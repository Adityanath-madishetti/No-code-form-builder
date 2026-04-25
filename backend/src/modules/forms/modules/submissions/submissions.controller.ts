// backend/src/modules/forms/modules/submissions/submissions.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as service from './submissions.service.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';

export const submitForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');

    const result = await service.submitFormService(formId, req.body, req.user as any);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const listSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await service.listSubmissionsService(formId, page, limit, req.user as any);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const exportSubmissionsCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');

    const csvContent = await service.exportSubmissionsCsvService(formId, req.user as any);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="form-${formId}-submissions.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

export const getSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, submissionId } = req.params;
    if (typeof formId !== 'string' || typeof submissionId !== 'string') {
      throw new ApiError(400, 'Invalid path parameters');
    }

    const submission = await service.getSubmissionService(formId, submissionId, req.user as any);
    res.status(200).json({ submission });
  } catch (err) {
    next(err);
  }
};

export const getMyFormSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const submissions = await service.getMyFormSubmissionsService(formId, req.user as any);
    res.status(200).json({ submissions });
  } catch (err) {
    next(err);
  }
};

export const updateMySubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, submissionId } = req.params;
    if (typeof formId !== 'string' || typeof submissionId !== 'string') {
      throw new ApiError(400, 'Invalid path parameters');
    }
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const submission = await service.updateMySubmissionService(
      formId,
      submissionId,
      req.body,
      req.user as any,
    );
    res.status(200).json({ submission });
  } catch (err) {
    next(err);
  }
};

export const getMySubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const submissions = await service.getMySubmissionsService(req.user as any);
    res.status(200).json({ submissions });
  } catch (err) {
    next(err);
  }
};
