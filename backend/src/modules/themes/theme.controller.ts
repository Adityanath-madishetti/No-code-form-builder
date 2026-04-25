// backend/src/modules/themes/theme.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as service from './theme.service.js';

export const createTheme = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const theme = await service.createThemeService((req as any).user.uid, req.body);
    res.status(201).json({ theme });
  } catch (err) {
    next(err);
  }
};

export const listThemes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const themes = await service.listThemesService((req as any).user);
    res.status(200).json({ themes });
  } catch (err) {
    next(err);
  }
};

export const updateTheme = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const themeId = req.params.themeId as string;
    const theme = await service.updateThemeService(themeId, (req as any).user.uid, req.body);
    res.status(200).json({ theme });
  } catch (err) {
    next(err);
  }
};

export const deleteTheme = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const themeId = req.params.themeId as string;
    await service.deleteThemeService(themeId, (req as any).user.uid);
    res.status(200).json({ message: 'Theme deleted' });
  } catch (err) {
    next(err);
  }
};
