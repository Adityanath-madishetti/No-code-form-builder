// backend/src/modules/workflow/workflow.routes.ts

import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import * as controller from './workflow.controller.js';
import { validateRequest } from '@/shared/middleware/validate.middleware.js';
import { workflowConfigSchema, transitionSubmissionSchema } from './workflow.schema.js';

const router = Router({ mergeParams: true });

router.post('/', verifyToken, validateRequest(workflowConfigSchema), controller.setWorkflow);
router.get('/', verifyToken, controller.getWorkflow);

router.post(
  '/submissions/:submissionId/transition',
  verifyToken,
  validateRequest(transitionSubmissionSchema),
  controller.transitionSubmission,
);

router.get(
  '/submissions/:submissionId/transitions',
  verifyToken,
  controller.listAvailableTransitions,
);

export default router;
