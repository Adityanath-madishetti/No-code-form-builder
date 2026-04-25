// backend/src/modules/workflow/workflow.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as service from './workflow.service.js';

export const setWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const workflow = await service.setWorkflowService(formId, req.body, req.user);
    const isDisabling = req.body.enabled === false;
    res.status(200).json({
      message: isDisabling ? 'Workflow disabled' : 'Workflow saved',
      workflow,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const workflow = await service.getWorkflowService(formId, req.user);
    res.status(200).json({ workflow });
  } catch (err) {
    next(err);
  }
};

export const transitionSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const submissionId = req.params.submissionId as string;
    const { transitionId, role } = req.body;

    const result = await service.transitionSubmissionService(
      formId,
      submissionId,
      transitionId,
      role,
      req.user,
    );

    res.status(200).json({
      message: `Transitioned to "${result.currentState}"`,
      submission: result,
    });
  } catch (err) {
    next(err);
  }
};

export const listAvailableTransitions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const formId = req.params.formId as string;
    const submissionId = req.params.submissionId as string;
    const result = await service.listAvailableTransitionsService(
      formId,
      submissionId,
      req.query.role as string | undefined,
      req.user,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
