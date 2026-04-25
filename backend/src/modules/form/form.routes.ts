// backend/src/modules/forms/form.routes.ts

import { Router } from 'express';
import { optionalAuth, verifyToken } from '@/middlewares/auth.middleware.js';
import * as controller from './form.controller.js';
import { validateRequest } from '@/middlewares/validate.middleware.js';
import { createFormSchema, updateFormSchema } from './form.schema.js';
import { formVersionRoutes } from './modules/form-versions/index.js';
import { submissionRoutes } from './modules/submissions/index.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Forms
 *   description: Form management and response collection
 */

// Form CRUD
router.post('/', verifyToken, validateRequest(createFormSchema), controller.createForm);
router.get('/', verifyToken, controller.listForms);
router.get('/shared', verifyToken, controller.listSharedForms);

router.get('/:formId', verifyToken, controller.getForm);
router.patch('/:formId', verifyToken, validateRequest(updateFormSchema), controller.updateForm);
router.delete('/:formId', verifyToken, controller.deleteForm);

// Publish
router.post('/:formId/publish', verifyToken, controller.publishForm);

// Public form access
router.get('/:formId/public', optionalAuth, controller.getPublicForm);

// Nested routes
router.use('/:formId/versions', formVersionRoutes);
router.use('/:formId/submissions', submissionRoutes);

export default router;
