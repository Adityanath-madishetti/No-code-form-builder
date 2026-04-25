// backend/src/modules/group/group.routes.ts
import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import * as controller from './group.controller.js';
import { validateRequest } from '@/shared/middleware/validate.middleware.js';
import { createGroupSchema, updateGroupSchema } from './group.schema.js';

const router = Router();

router.post('/', verifyToken, validateRequest(createGroupSchema), controller.createGroup);
router.get('/', verifyToken, controller.listGroups);
router.patch('/:groupId', verifyToken, validateRequest(updateGroupSchema), controller.updateGroup);
router.delete('/:groupId', verifyToken, controller.deleteGroup);

export default router;
