// backend/src/modules/forms/modules/submissions/submissions.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { verifyToken, optionalAuth } from '@/middlewares/auth.middleware.js';
import * as controller from './submissions.controller.js';
import Submission from '@/database/models/Submission.js';

const validateMongooseSubmission = (req: Request, res: Response, next: NextFunction) => {
  // Map formVersion to version to match Mongoose schema
  const dataToValidate = { ...req.body };
  if (dataToValidate.formVersion !== undefined) {
    dataToValidate.version = dataToValidate.formVersion;
  }

  const doc = new Submission(dataToValidate);
  // Only validate fields expected from the user
  const err = doc.validateSync(['pages', 'email', 'status', 'version']);

  if (err) {
    const errorMessages = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
    res.status(400).json({
      status: 'error',
      message: 'Invalid request data',
      errors: errorMessages,
    });
    return;
  }
  next();
};

const router = Router({ mergeParams: true });

// Static routes before dynamic parameters
// router.post('/', optionalAuth, validateRequest(submitFormSchema), controller.submitForm);
router.post('/', optionalAuth, validateMongooseSubmission, controller.submitForm);
router.get('/', verifyToken, controller.listSubmissions);
router.get('/export.csv', verifyToken, controller.exportSubmissionsCsv);
router.get('/mine', verifyToken, controller.getMyFormSubmissions);

// Dynamic parameter routes
router.patch('/:submissionId/mine', verifyToken, controller.updateMySubmission);
router.get('/:submissionId', verifyToken, controller.getSubmission);

export default router;
