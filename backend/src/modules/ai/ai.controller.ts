// backend/src/modules/ai/ai.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as service from './ai.service.js';

export const generateForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A valid prompt string is required.' });
    }
    const generatedDraft = await service.generateFormDraftService(prompt);
    return res.status(200).json(generatedDraft);
  } catch (error) {
    next(error);
  }
};
