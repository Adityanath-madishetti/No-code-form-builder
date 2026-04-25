// backend/src/modules/forms/form.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as service from './form.service.js';
import { ApiError } from '@/shared/middleware/error.middleware.js';
// TODO: use ApiError here

export const createForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { form, formVersion } = await service.createFormService((req as any).user.uid, req.body);
    res.status(201).json({ form, formVersion });
  } catch (err) {
    next(err);
  }
};

export const listForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forms = await service.listFormsService((req as any).user.uid);
    res.status(200).json({ forms });
  } catch (err) {
    next(err);
  }
};

export const listSharedForms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forms = await service.listSharedFormsService((req as any).user);
    res.status(200).json({ forms });
  } catch (err) {
    next(err);
  }
};

export const getForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const form = await service.getFormService(formId, (req as any).user);
    res.status(200).json({ form });
  } catch (err) {
    next(err);
  }
};

export const updateForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const form = await service.updateFormService(formId, req.body, (req as any).user);
    res.status(200).json({ form });
  } catch (err) {
    next(err);
  }
};

export const deleteForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const form = await service.deleteFormService(formId, (req as any).user.uid);
    res.status(200).json({ message: 'Form deleted', form });
  } catch (err) {
    next(err);
  }
};

export const publishForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const { form, publishedVersion } = await service.publishFormService(
      formId,
      (req as any).user.uid,
    );
    res.status(200).json({
      message: 'Form published successfully',
      form,
      publishedVersion,
    });
  } catch (err) {
    next(err);
  }
};

export const getPublicForm = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const { form, version } = await service.getPublicFormService(formId, (req as any).user);
    res.status(200).json({ form, version });
  } catch (err) {
    next(err);
  }
};
