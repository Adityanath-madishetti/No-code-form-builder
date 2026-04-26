/**
 * FORM STATE INTEGRITY TESTS
 *
 * These probe the consistency of the form's state machine:
 *
 *  1. PATCH /api/forms/:id with { isActive: true } bypasses the publish flow.
 *     The form becomes active with no published version, so /submissions POST
 *     returns 400 ("No published version available") instead of accepting data.
 *
 *  2. Editor role: editors can update versions but CANNOT publish.
 *     Both publish endpoints (form-level and version-level) should reject them.
 *
 *  3. After deletion a form can no longer be published, activated, or queried
 *     — any attempt should be gracefully handled (404 not 500).
 *
 *  4. Rapidly creating versions sequentially: currentVersion on the Form
 *     document should always match the highest version in FormVersion.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';

let currentUser = { uid: 'state-owner-uid', email: 'state-owner@test.com' };

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

const OWNER = { uid: 'state-owner-uid', email: 'state-owner@test.com' };
const EDITOR = { uid: 'state-editor-uid', email: 'state-editor@test.com' };

describe('Form State Integrity Tests', () => {

  describe('isActive cannot be set via PATCH (fixed)', () => {
    it('PATCH { isActive: true } is silently stripped — form stays inactive', async () => {
      // Fixed: isActive is now removed from updateFormSchema and also stripped in
      // updateFormService, so it can never be set via PATCH. It can only be changed
      // by the publish/unpublish flow.
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Sneaky Activation' });
      const fid = r.body.form.formId;

      // Attempt to set isActive: true via PATCH.
      const activateRes = await request(app)
        .patch(`/api/forms/${fid}`)
        .send({ isActive: true });
      expect(activateRes.status).toBe(200);

      // The isActive flag must still be false — the field was stripped.
      expect(activateRes.body.form.isActive).toBe(false);
    });

    it('publishing via the correct endpoint sets isActive: true', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Proper Publish' });
      const fid = r.body.form.formId;

      const pubRes = await request(app).post(`/api/forms/${fid}/publish`);
      expect(pubRes.status).toBe(200);

      const formRes = await request(app).get(`/api/forms/${fid}`);
      expect(formRes.body.form.isActive).toBe(true);
    });
  });


  describe('Editor role constraints', () => {
    let editorFormId: string;

    beforeAll(async () => {
      // Owner creates form and grants editor role.
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Editor Test Form' });
      editorFormId = r.body.form.formId;

      // Grant editor access to EDITOR user.
      await request(app)
        .patch(`/api/forms/${editorFormId}/versions/1/access`)
        .send({
          access: {
            visibility: 'private',
            editors: [{ uid: EDITOR.uid, email: EDITOR.email }],
          },
        });
    });

    it('editor CAN read the latest version', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app).get(`/api/forms/${editorFormId}/versions/latest`);
      expect(res.status).toBe(200);
    });

    it('editor CAN update version content', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app)
        .put(`/api/forms/${editorFormId}/versions/1`)
        .send({ meta: { createdBy: OWNER.uid, name: 'Editor Updated' } });
      expect(res.status).toBe(200);
    });

    it('editor CANNOT publish via POST /:formId/publish (owner-only)', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app).post(`/api/forms/${editorFormId}/publish`);
      expect(res.status).toBe(403);
    });

    it('editor CANNOT publish via POST /:formId/versions/publish (owner-only)', async () => {
      // publishVersionService also checks form.createdBy === uid.
      currentUser = { ...EDITOR };
      const res = await request(app).post(`/api/forms/${editorFormId}/versions/publish`);
      expect(res.status).toBe(403);
    });

    it('editor CAN update settings', async () => {
      currentUser = { ...EDITOR };
      const res = await request(app)
        .patch(`/api/forms/${editorFormId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'optional' } });
      expect(res.status).toBe(200);
    });
  });

  describe('currentVersion counter consistency', () => {
    it('currentVersion on Form matches the highest version number after multiple creates', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Version Counter Form' });
      const fid = r.body.form.formId;

      // Create 3 additional versions (v2, v3, v4).
      await request(app).post(`/api/forms/${fid}/versions`);
      await request(app).post(`/api/forms/${fid}/versions`);
      await request(app).post(`/api/forms/${fid}/versions`);

      const formRes = await request(app).get(`/api/forms/${fid}`);
      const listRes = await request(app).get(`/api/forms/${fid}/versions`);

      const formCurrentVersion = formRes.body.form.currentVersion;
      const maxVersionInList = Math.max(
        ...listRes.body.versions.map((v: any) => v.version)
      );

      expect(formCurrentVersion).toBe(4);
      expect(maxVersionInList).toBe(4);
    });
  });

  describe('Operations on deleted forms', () => {
    let deletedFormId: string;

    beforeAll(async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Soon Deleted' });
      deletedFormId = r.body.form.formId;
      await request(app).delete(`/api/forms/${deletedFormId}`);
    });

    it('PATCH on deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${deletedFormId}`)
        .send({ title: 'Ghost Update' });
      expect(res.status).toBe(404);
    });

    it('POST publish on deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).post(`/api/forms/${deletedFormId}/publish`);
      expect(res.status).toBe(404);
    });

    it('POST create version on deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app).post(`/api/forms/${deletedFormId}/versions`);
      expect(res.status).toBe(404);
    });

    it('PATCH settings on deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${deletedFormId}/versions/1/settings`)
        .send({ settings: { collectEmailMode: 'none' } });
      expect(res.status).toBe(404);
    });

    it('PATCH access on deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .patch(`/api/forms/${deletedFormId}/versions/1/access`)
        .send({ access: { visibility: 'public' } });
      expect(res.status).toBe(404);
    });

    it('submit to deleted form returns 404, not 500', async () => {
      currentUser = { ...OWNER };
      const res = await request(app)
        .post(`/api/forms/${deletedFormId}/submissions`)
        .send({ pages: [] });
      expect(res.status).toBe(404);
    });
  });

  describe('Version listing on deleted form', () => {
    it('GET /versions on deleted form returns 404 (listVersionsService checks isDeleted)', async () => {
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Temp Deleted' });
      const fid = r.body.form.formId;
      await request(app).delete(`/api/forms/${fid}`);

      const res = await request(app).get(`/api/forms/${fid}/versions`);
      expect(res.status).toBe(404);
    });
  });
});
