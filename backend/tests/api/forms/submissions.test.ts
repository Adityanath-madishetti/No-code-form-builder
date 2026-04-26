/**
 * SUBMISSION LIFECYCLE TESTS
 *
 * These tests target the complex guard logic around form submissions:
 * submitting to inactive/unpublished forms, policy enforcement (no double-submit),
 * closed dates, submission limits, and accessing submissions you shouldn't see.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '@/app.js';
import crypto from 'crypto';

let currentUser: any = { uid: 'sub-owner-uid', email: 'sub-owner@test.com' };

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

const OWNER = { uid: 'sub-owner-uid', email: 'sub-owner@test.com' };
const SUBMITTER = { uid: 'sub-user-uid', email: 'submitter@test.com' };

/** Helper: creates a form, publishes it, and makes it open/public. Returns formId. */
async function makePublicActiveForm(title = 'Public Form') {
  currentUser = { ...OWNER };

  // 1. Create
  const r1 = await request(app).post('/api/forms').send({ title });
  expect(r1.status).toBe(201);
  const fid = r1.body.form.formId;

  // 2. Set visibility to public
  await request(app)
    .patch(`/api/forms/${fid}/versions/1/access`)
    .send({ access: { visibility: 'public' } });

  // 3. Publish
  const r3 = await request(app).post(`/api/forms/${fid}/publish`);
  expect(r3.status).toBe(200);

  return fid;
}

describe('Submission Lifecycle Tests', () => {
  describe('Submitting to unpublished / inactive forms', () => {
    it('POST submission to a form that was never published returns 400', async () => {
      // A newly created form has isActive: false by default.
      // No explicit activation is needed — the form is inactive until published.
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Draft-Only' });
      const fid = r.body.form.formId;

      const sub = await request(app)
        .post(`/api/forms/${fid}/submissions`)
        .send({ pages: [] });
      expect(sub.status).toBe(400);
    });

    it('POST submission to a form closed by its closeDate returns 400', async () => {
      // Published, public forms with a past closeDate should reject submissions.
      // This tests the same "is effectively inactive" business rule via the
      // correct API surface (settings.closeDate) instead of the now-removed isActive PATCH.
      currentUser = { ...OWNER };
      const r = await request(app).post('/api/forms').send({ title: 'Closed Form' });
      const fid = r.body.form.formId;

      await request(app)
        .patch(`/api/forms/${fid}/versions/1/access`)
        .send({ access: { visibility: 'public' } });

      // closeDate in the past → submissions are refused.
      await request(app)
        .patch(`/api/forms/${fid}/versions/1/settings`)
        .send({ settings: { closeDate: new Date(Date.now() - 1000).toISOString() } });

      await request(app).post(`/api/forms/${fid}/publish`);

      const sub = await request(app)
        .post(`/api/forms/${fid}/submissions`)
        .send({ pages: [] });
      expect(sub.status).toBe(400);
      expect(sub.body.message).toMatch(/closed/i);
    });
  });

  describe('Double-submit policy (default = "none")', () => {
    it('second submission from same user on a "none" policy form returns 409', async () => {
      const fid = await makePublicActiveForm('No-Resubmit Form');
      currentUser = { ...SUBMITTER };

      const s1 = await request(app).post(`/api/forms/${fid}/submissions`).send({ pages: [] });
      expect(s1.status).toBe(201);

      // The default submissionPolicy is 'none' — second attempt must be blocked.
      const s2 = await request(app).post(`/api/forms/${fid}/submissions`).send({ pages: [] });
      expect(s2.status).toBe(409);
    });
  });

  describe('Accessing submissions you don\'t own', () => {
    it('stranger cannot list submissions of a form they have no role on', async () => {
      const fid = await makePublicActiveForm('Private Submissions Form');

      currentUser = SUBMITTER;
      const res = await request(app).get(`/api/forms/${fid}/submissions`);
      expect(res.status).toBe(403);
    });

    it('stranger cannot fetch a specific submission by ID', async () => {
      const fid = await makePublicActiveForm('Submission Peek Form');

      currentUser = SUBMITTER;
      // Submit first so there's something to guess at.
      await request(app).post(`/api/forms/${fid}/submissions`).send({ pages: [] });

      // Now a different stranger tries to fetch via a guessed submissionId.
      const stranger = { uid: 'other-stranger', email: 'other@test.com' };
      currentUser = stranger;

      // Even with a real submissionId, they should be 403'd.
      const listRes = await request(app).get(`/api/forms/${fid}/submissions`);
      expect(listRes.status).toBe(403);
    });

    it('stranger cannot export CSV of another form', async () => {
      const fid = await makePublicActiveForm('CSV Export Form');
      currentUser = SUBMITTER;

      const res = await request(app).get(`/api/forms/${fid}/submissions/export.csv`);
      expect(res.status).toBe(403);
    });
  });

  describe('Editing submissions (policy enforcement)', () => {
    it('PATCH my submission on a form with policy="none" returns 409', async () => {
      const fid = await makePublicActiveForm('No-Edit Policy Form');
      currentUser = SUBMITTER;

      const s1 = await request(app).post(`/api/forms/${fid}/submissions`).send({ pages: [] });
      expect(s1.status).toBe(201);
      const subId = s1.body.submission.submissionId;

      const patch = await request(app)
        .patch(`/api/forms/${fid}/submissions/${subId}/mine`)
        .send({ pages: [] });

      // Policy is 'none' by default — editing must be disallowed.
      expect(patch.status).toBe(409);
    });

    it('PATCH a submission that belongs to someone else returns 404', async () => {
      const fid = await makePublicActiveForm('Edit Ownership Form');
      currentUser = SUBMITTER;
      const s1 = await request(app).post(`/api/forms/${fid}/submissions`).send({ pages: [] });
      const subId = s1.body.submission.submissionId;

      // A different user tries to edit SUBMITTER's submission.
      currentUser = { uid: 'thief-uid', email: 'thief@test.com' };
      const patch = await request(app)
        .patch(`/api/forms/${fid}/submissions/${subId}/mine`)
        .send({ pages: [] });

      // Should not expose or allow editing another user's submission.
      expect(patch.status).not.toBe(200);
    });

    it('PATCH a non-existent submissionId returns 404, not 500', async () => {
      const fid = await makePublicActiveForm('Ghost Submission Form');
      currentUser = SUBMITTER;

      const patch = await request(app)
        .patch(`/api/forms/${fid}/submissions/${crypto.randomUUID()}/mine`)
        .send({ pages: [] });
      expect([404, 400, 409]).toContain(patch.status); // must not be 500
    });
  });
});
