// backend/src/modules/forms/modules/submissions/submissions.routes.ts
import { Router } from 'express';
import { verifyToken, optionalAuth } from '@/middlewares/auth.middleware.js';
import * as controller from './submissions.controller.js';
import { validateRequest } from '@/middlewares/validate.middleware.js';
import { submitFormSchema } from './submissions.schema.js';

const router = Router({ mergeParams: true });

// Static routes before dynamic parameters
router.post('/', optionalAuth, validateRequest(submitFormSchema), controller.submitForm);
router.get('/', verifyToken, controller.listSubmissions);
router.get('/export.csv', verifyToken, controller.exportSubmissionsCsv);
router.get('/mine', verifyToken, controller.getMyFormSubmissions);

// Dynamic parameter routes
router.patch('/:submissionId/mine', verifyToken, controller.updateMySubmission);
router.get('/:submissionId', verifyToken, controller.getSubmission);

export default router;
