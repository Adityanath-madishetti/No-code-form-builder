/**
 * PUBLIC FORM ACCESS TESTS
 *
 * The public endpoint uses `optionalAuth` and has its own visibility-based
 * access control inside canFillForm(). These tests verify that the gate
 * holds for every combination of form state and user.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import crypto from 'crypto';

let currentUser: any = { uid: 'pub-owner-uid', email: 'pub-owner@test.com' };

vi.mock('@/middlewares/auth.middleware.js', () => ({
  verifyToken: (req: any, _res: any, next: any) => {
    req.user = currentUser ? { ...currentUser } : null;
    next();
  },
  optionalAuth: (req: any, _res: any, next: any) => {
    req.user = currentUser ? { ...currentUser } : null;
    next();
  },
}));

const OWNER = { uid: 'pub-owner-uid', email: 'pub-owner@test.com' };
const STRANGER = { uid: 'pub-stranger-uid', email: 'pub-stranger@test.com' };

describe('Public Form Access Tests', () => {
  describe('Guard: inactive forms are never accessible', () => {
    it('GET /:id/public on a never-published form returns 400', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Unpublished' });
      const fid = r.body.form.formId;

      const res = await request(app).get(`/api/forms/${fid}/public`);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/not currently accepting responses/i);
    });

    it('GET /:id/public on a deleted (soft-deleted) published form returns 404', async () => {
      // Deletion is currently the only way to "deactivate" a published form via the API
      // (isActive can no longer be directly set via PATCH — it requires the publish flow).
      // A deleted form returns 404 on all endpoints including /public.
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'To Delete' });
      const fid = r.body.form.formId;

      await request(app)
        .patch(`/api/forms/${fid}/versions/1/access`)
        .send({ access: { visibility: 'public' } });
      await request(app).post(`/api/forms/${fid}/publish`);

      // Soft-delete.
      await request(app).delete(`/api/forms/${fid}`);

      const res = await request(app).get(`/api/forms/${fid}/public`);
      expect(res.status).toBe(404);
    });
  });

  describe('Guard: private forms only accessible to authorized users', () => {
    let privateFormId: string;

    beforeAll(async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Private Active Form' });
      privateFormId = r.body.form.formId;

      // Explicitly set visibility to private (the default) and publish.
      await request(app)
        .patch(`/api/forms/${privateFormId}/versions/1/access`)
        .send({ access: { visibility: 'private' } });
      await request(app).post(`/api/forms/${privateFormId}/publish`);
    });

    it('unauthenticated user gets 401 accessing a private form', async () => {
      currentUser = null; // no user
      const res = await request(app).get(`/api/forms/${privateFormId}/public`);
      expect(res.status).toBe(401);
    });

    it('authenticated stranger gets 403 on a private form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${privateFormId}/public`);
      expect(res.status).toBe(403);
    });

    it('owner can access their own private published form', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${privateFormId}/public`);
      expect(res.status).toBe(200);
    });
  });

  describe('Guard: public forms ARE accessible to everyone', () => {
    let publicFormId: string;

    beforeAll(async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Public Form' });
      publicFormId = r.body.form.formId;

      await request(app)
        .patch(`/api/forms/${publicFormId}/versions/1/access`)
        .send({ access: { visibility: 'public' } });
      await request(app).post(`/api/forms/${publicFormId}/publish`);
    });

    it('unauthenticated user CAN access a public form', async () => {
      currentUser = null;
      const res = await request(app).get(`/api/forms/${publicFormId}/public`);
      expect(res.status).toBe(200);
    });

    it('stranger CAN access a public form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${publicFormId}/public`);
      expect(res.status).toBe(200);
    });
  });

  describe('Guard: non-existent form IDs', () => {
    it('returns 404 (not 500) for a plausible but non-existent formId', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${crypto.randomUUID()}/public`);
      expect(res.status).toBe(404);
    });
  });
});
