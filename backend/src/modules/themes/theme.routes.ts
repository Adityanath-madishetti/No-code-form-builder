// backend/src/modules/themes/theme.routes.ts

import { Router } from 'express';
import { verifyToken } from '@/shared/middleware/auth.middleware.js';
import * as controller from './theme.controller.js';
import { validateRequest } from '@/shared/middleware/validate.middleware.js';
import { createThemeSchema, updateThemeSchema } from './theme.schema.js';

const router = Router();

router.post('/', verifyToken, validateRequest(createThemeSchema), controller.createTheme);
router.get('/', verifyToken, controller.listThemes);
router.patch('/:themeId', verifyToken, validateRequest(updateThemeSchema), controller.updateTheme);
router.delete('/:themeId', verifyToken, controller.deleteTheme);

export default router;
