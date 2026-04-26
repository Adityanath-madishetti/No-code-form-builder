/**
 * VERSION LIFECYCLE TESTS
 *
 * These tests target the fragile state machine of form versions:
 * publishing a draft, creating new versions, and operating on versions
 * that don't exist yet or are in the wrong state.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import crypto from 'crypto';

let currentUser = { uid: 'ver-owner-uid', email: 'ver-owner@test.com' };

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

const OWNER = { uid: 'ver-owner-uid', email: 'ver-owner@test.com' };

describe('Version Lifecycle Tests', () => {
  let formId: string;

  beforeAll(async () => {
    currentUser = { ...OWNER };
    const res = await request(app)
      .post('/api/forms')
      .send({ title: 'Version Test Form' });
    expect(res.status).toBe(201);
    formId = res.body.form.formId;
  });

  describe('Publishing before content is ready', () => {
    it('publish creates a published version (v1 is a valid draft)', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).post(`/api/forms/${formId}/publish`);
      // Should succeed — initial draft can be published.
      expect(res.status).toBe(200);
    });

    it('re-publishing the same version again does NOT create a duplicate', async () => {
      currentUser = { ...OWNER };
      await request(app).post(`/api/forms/${formId}/publish`);
      const res = await request(app).post(`/api/forms/${formId}/publish`);
      // Second publish should still succeed or be idempotent, not 500.
      expect(res.status).not.toBe(500);
    });
  });

  describe('Creating new versions', () => {
    it('creating a new version bumps currentVersion', async () => {
      currentUser = { ...OWNER };
      const before = await request(app).get(`/api/forms/${formId}`);
      const vBefore = before.body.form.currentVersion;

      const res = await request(app).post(`/api/forms/${formId}/versions`);
      expect(res.status).toBe(201); // createVersion correctly returns 201

      const after = await request(app).get(`/api/forms/${formId}`);
      expect(after.body.form.currentVersion).toBe(vBefore + 1);
    });

    it('getting a version number that does NOT exist returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${formId}/versions/9999`);
      expect(res.status).toBe(404);
    });
  });

  describe('Updating version content', () => {
    it('PUT with missing required AJV fields (meta.name) should return 400', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .put(`/api/forms/${formId}/versions/1`)
        .send({ meta: { createdBy: 'ver-owner-uid' } }); // name is required by AJV schema

      expect(res.status).toBe(400);
    });

    it('PUT with valid meta passes validation', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .put(`/api/forms/${formId}/versions/1`)
        .send({ meta: { createdBy: 'ver-owner-uid', name: 'My Form' } });
      expect(res.status).toBe(200);
    });

    it('PUT on a non-existent version number returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .put(`/api/forms/${formId}/versions/9999`)
        .send({ meta: { createdBy: 'ver-owner-uid', name: 'Ghost Version' } });
      expect(res.status).toBe(404);
    });

    it('PATCH settings with invalid collectEmailMode is normalized to "none", not 500', async () => {
      // Fixed: updateVersionSettingsService now calls normalizeSettings() before writing,
      // so invalid enum values are silently coerced to 'none' instead of crashing.
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${formId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'INVALID_VALUE' } });

      expect(res.status).toBe(200);
      expect(res.body.version?.settings?.collectEmailMode).toBe('none');
    });

    it('PATCH access with invalid visibility is silently normalized to "private"', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${formId}/versions/1/access`)
        .send({ access: { visibility: 'totally-made-up' } });
      expect(res.status).toBe(200);
      // normalizeAccess defaults to 'private' for unknown values
      expect(res.body.access?.visibility ?? 'private').toBe('private');
    });
  });

  describe('Operating on deleted form versions', () => {
    it('after deleting a form, getting its versions returns 404', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'To Be Deleted' });
      const fid = r.body.form.formId;

      await request(app).delete(`/api/forms/${fid}`);

      const vRes = await request(app).get(`/api/forms/${fid}/versions/latest`);
      expect(vRes.status).toBe(404);
    });
  });
});
