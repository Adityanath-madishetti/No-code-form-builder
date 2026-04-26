/**
 * VERSION READ AUTHORIZATION TESTS
 *
 * Access model for read-only version endpoints (list, get specific version):
 *   - Owner: ✅ read
 *   - Editor: ✅ read
 *   - Reviewer: ✅ read (needed by FormReview to display submission responses)
 *   - Stranger: ❌ 403
 *   - Unauthenticated: ❌ 401
 *
 * Read gates use assertCanRead() → canReviewSubmissions() (owner + editor + reviewer).
 * Write gates still use assertCanEdit() → canEditForm() (owner + editor only).
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';

let currentUser: any = { uid: 'vr-owner-uid', email: 'vr-owner@test.com' };

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

const OWNER    = { uid: 'vr-owner-uid',    email: 'vr-owner@test.com' };
const EDITOR   = { uid: 'vr-editor-uid',   email: 'vr-editor@test.com' };
const REVIEWER = { uid: 'vr-reviewer-uid', email: 'vr-reviewer@test.com' };
const STRANGER = { uid: 'vr-stranger-uid', email: 'vr-stranger@test.com' };

describe('Version Read Authorization', () => {
  let ownerFormId: string;

  beforeAll(async () => {
    // Create form as owner.
    currentUser = { ...OWNER };
    const res = await request(app).post('/api/forms').send({ title: 'Secret Form' });
    expect(res.status).toBe(201);
    ownerFormId = res.body.form.formId;

    // Grant editor and reviewer roles.
    await request(app)
      .patch(`/api/forms/${ownerFormId}/versions/1/access`)
      .send({
        access: {
          visibility: 'private',
          editors:   [{ uid: EDITOR.uid,   email: EDITOR.email }],
          reviewers: [{ uid: REVIEWER.uid, email: REVIEWER.email }],
        },
      });
  });

  // ── LIST ALL VERSIONS ────────────────────────────────────────────────────

  describe('GET /versions — list all versions', () => {
    it('owner can list versions', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions`);
      expect(res.status).toBe(200);
    });

    it('editor can list versions', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions`);
      expect(res.status).toBe(200);
    });

    it('reviewer can list versions (needed to review submissions)', async () => {
      currentUser = { ...REVIEWER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions`);
      expect(res.status).toBe(200);
    });

    it('stranger cannot list versions of another user\'s form', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET SPECIFIC VERSION ─────────────────────────────────────────────────

  describe('GET /versions/:version — single version', () => {
    it('owner can read a specific version', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/1`);
      expect(res.status).toBe(200);
    });

    it('editor can read a specific version', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/1`);
      expect(res.status).toBe(200);
    });

    it('reviewer can read a specific version (needed by FormReview schema fetch)', async () => {
      currentUser = { ...REVIEWER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/1`);
      expect(res.status).toBe(200);
    });

    it('stranger cannot read a specific version', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/1`);
      expect(res.status).toBe(403);
    });
  });

  // ── GET LATEST VERSION (used by form preview) ────────────────────────────

  describe('GET /versions/latest — used by form preview', () => {
    it('owner can read the latest version', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/latest`);
      expect(res.status).toBe(200);
    });

    it('editor can read the latest version', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/latest`);
      expect(res.status).toBe(200);
    });

    it('reviewer can read the latest version (needed for form preview)', async () => {
      currentUser = { ...REVIEWER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/latest`);
      expect(res.status).toBe(200);
    });

    it('stranger cannot read the latest version', async () => {
      currentUser = { ...STRANGER };
      const res = await request(app).get(`/api/forms/${ownerFormId}/versions/latest`);
      expect(res.status).toBe(403);
    });
  });

  // ── WRITE OPERATIONS STILL REQUIRE EDIT ROLE ────────────────────────────

  describe('PATCH /versions/:version/settings — requires edit role', () => {
    it('reviewer CANNOT update settings (edit role required)', async () => {
      currentUser = { ...REVIEWER };
      const res = await request(app)
        .patch(`/api/forms/${ownerFormId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'optional' } });
      expect(res.status).toBe(403);
    });

    it('editor CAN update settings', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app)
        .patch(`/api/forms/${ownerFormId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'optional' } });
      expect(res.status).toBe(200);
    });
  });

  // ── SOFT-DELETE HANDLING ─────────────────────────────────────────────────

  describe('GET /versions after soft-delete', () => {
    it('listing versions of a deleted form returns 404', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Deleted Form' });
      const fid = r.body.form.formId;
      await request(app).delete(`/api/forms/${fid}`);

      currentUser = { ...OWNER };
      const res = await request(app).get(`/api/forms/${fid}/versions`);
      expect(res.status).toBe(404);
    });
  });
});
