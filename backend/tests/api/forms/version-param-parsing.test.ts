/**
 * VERSION PARAMETER PARSING TESTS
 *
 * Several controllers parse the :version URL param with parseInt() but do NOT
 * validate the result for NaN before passing it to the service or repository.
 * Passing NaN to Mongoose's findOne({ version: NaN }) results in either
 * returning the first document encountered or a cast error.
 *
 * Affected endpoints (all call parseInt but none guard for NaN):
 *  - GET    /:formId/versions/:version
 *  - PUT    /:formId/versions/:version
 *  - PATCH  /:formId/versions/:version/settings
 *  - PATCH  /:formId/versions/:version/access
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';

let currentUser = { uid: 'nan-owner-uid', email: 'nan-owner@test.com' };

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

const OWNER = { uid: 'nan-owner-uid', email: 'nan-owner@test.com' };

describe('Version Parameter Parsing', () => {
  let formId: string;

  beforeAll(async () => {
    currentUser = { ...OWNER };
    const res = await request(app).post('/api/forms').send({ title: 'NaN Test Form' });
    expect(res.status).toBe(201);
    formId = res.body.form.formId;
  });

  describe('Non-numeric :version string → parseInt → NaN', () => {
    it('GET /versions/abc returns 400 (isNaN guard added)', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${formId}/versions/abc`);
      expect(res.status).toBe(400);
    });

    it('PATCH /versions/abc/settings returns 400 (isNaN guard added)', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${formId}/versions/abc/settings`)
        .send({ settings: { collectEmailMode: 'none' } });
      expect(res.status).toBe(400);
    });

    it('PATCH /versions/abc/access returns 400 (isNaN guard added)', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${formId}/versions/abc/access`)
        .send({ access: { visibility: 'public' } });
      expect(res.status).toBe(400);
    });

    it('BUG: PUT /versions/abc returns 400 from the isNaN guard (this one IS protected)', async () => {
      // The updateVersion controller explicitly checks isNaN(versionNum) → 400.
      // This confirms the inconsistency: GET and PATCH controllers do NOT have this guard.
      currentUser = { ...OWNER };
      const res = await request(app)
        .put(`/api/forms/${formId}/versions/abc`)
        .send({ meta: { createdBy: 'nan-owner-uid', name: 'Test' } });

      // This one correctly returns 400 (the controller has isNaN check).
      expect(res.status).toBe(400);
    });

    it('negative version number returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${formId}/versions/-1`);
      expect([400, 404]).toContain(res.status);
      expect(res.status).not.toBe(500);
    });

    it('float version number is truncated by parseInt and treated as integer', async () => {
      // parseInt("1.9", 10) === 1, so this should unintentionally hit version 1.
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${formId}/versions/1.9`);
      // Should return version 1 data (200) since parseInt truncates.
      expect(res.status).toBe(200);
    });
  });
});
