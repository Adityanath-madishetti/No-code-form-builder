/**
 * AUTHORIZATION BREACH TESTS
 *
 * Every test here attempts an operation that MUST be denied.
 * A 2xx response from any of these means a real authorization hole.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import crypto from 'crypto';

// ----- Auth mock: user context is swapped per test -----
let currentUser = { uid: 'owner-uid', email: 'owner@test.com' };

vi.mock('@/middlewares/auth.middleware.js', () => ({
  verifyToken: (req: any, _res: any, next: any) => {
    req.user = { ...currentUser };
    next();
  },
  optionalAuth: (req: any, _res: any, next: any) => {
    req.user = { ...currentUser };
    next();
  },
}));

const OWNER = { uid: 'owner-uid', email: 'owner@test.com' };
const STRANGER = { uid: 'stranger-uid', email: 'stranger@test.com' };

describe('Authorization Breach Tests', () => {
  let ownerFormId: string;

  beforeAll(async () => {
    currentUser = { ...OWNER };
    const res = await request(app)
      .post('/api/forms')
      .send({ title: 'Owner Form' });
    expect(res.status).toBe(201);
    ownerFormId = res.body.form.formId;
  });

  describe('Cross-user CRUD', () => {
    it('stranger cannot GET another user\'s form details', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot PATCH another user\'s form title', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app)
        .patch(`/api/forms/${ownerFormId}`)
        .send({ title: 'Hijacked' });
      expect(res.status).toBe(403);
    });

    it('stranger cannot DELETE another user\'s form', async () => {
      currentUser = { ...STRANGER };
      // delete is scoped by uid in repo — returns null → 404, not 403.
      // But it must NOT return 200 (i.e., the form must still exist afterwards).
      const res = await request(app).delete(`/api/forms/${ownerFormId}`);
      expect(res.status).not.toBe(200);

      // Verify the form is still intact from the owner's perspective.
      currentUser = { ...OWNER };
      const check = await request(app).get(`/api/forms/${ownerFormId}`);
      expect(check.status).toBe(200);
    });

    it('stranger cannot PUBLISH another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).post(`/api/forms/${ownerFormId}/publish`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot GET the latest version of another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/latest`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot CREATE a new version for another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).post(`/api/forms/${ownerFormId}/versions`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot UPDATE version content for another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app)
        .put(`/api/forms/${ownerFormId}/versions/1`)
        .send({ meta: { createdBy: 'owner-uid', name: 'Hijacked Name' } });
      expect(res.status).toBe(403);
    });

    it('stranger cannot update version SETTINGS for another user\'s form', async () => {
      // Fixed: assertCanEdit() is now called at the top of updateVersionSettingsService.
      currentUser = { ...STRANGER };
      const res = await request(app)
        .patch(`/api/forms/${ownerFormId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'required' } });

      expect(res.status).toBe(403);
    });

    it('stranger cannot update version ACCESS for another user\'s form', async () => {
      // Fixed: assertCanEdit() is now called at the top of updateVersionAccessService.
      currentUser = { ...STRANGER };
      const res = await request(app)
        .patch(`/api/forms/${ownerFormId}/versions/1/access`)
        .send({ access: { visibility: 'public' } });

      expect(res.status).toBe(403);
    });

    it('stranger cannot LIST submissions for another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/submissions`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot export CSV for another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/submissions/export.csv`);
      expect(res.status).toBe(403);
    });
  });

  describe('Garbage / non-existent IDs', () => {
    it('GET with a plausible but non-existent UUID returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${crypto.randomUUID()}`);
      expect(res.status).toBe(404);
    });

    it('PATCH on non-existent form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${crypto.randomUUID()}`)
        .send({ title: 'Ghost' });
      expect(res.status).toBe(404);
    });

    it('DELETE on non-existent form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).delete(`/api/forms/${crypto.randomUUID()}`);
      expect(res.status).toBe(404);
    });

    it('PUBLISH on non-existent form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).post(`/api/forms/${crypto.randomUUID()}/publish`);
      expect(res.status).toBe(404);
    });
  });
});
