// backend/src/modules/forms/modules/form-versions/form-version.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as service from './form-version.service.js';
import { ApiError } from '@/middlewares/error.middleware.js';

export const listVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');
    const versions = await service.listVersionsService(formId, req.user);
    res.status(200).json({ versions });
  } catch (err) {
    next(err);
  }
};

export const getLatestVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') {
      throw new ApiError(400, 'Invalid form ID');
    }
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const version = await service.getLatestVersionService(formId, req.user);
    res.status(200).json({ version });
  } catch (err) {
    next(err);
  }
};

export const getVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, version } = req.params;
    if (typeof formId !== 'string' || typeof version !== 'string') {
      throw new ApiError(400, 'Invalid parameters');
    }
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    const versionNum = parseInt(version, 10);
    const result = await service.getVersionService(formId, versionNum, req.user);
    res.status(200).json({ version: result });
  } catch (err) {
    next(err);
  }
};

export const createVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;

    if (typeof formId !== 'string') {
      throw new ApiError(400, 'Invalid form ID');
    }

    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const result = await service.createVersionService(formId, req.user);

    res.status(201).json({ version: result });
  } catch (err) {
    next(err);
  }
};

export const updateVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, version } = req.params;

    if (typeof formId !== 'string' || typeof version !== 'string') {
      throw new ApiError(400, 'Invalid path parameters');
    }

    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum)) throw new ApiError(400, 'Version must be a number');

    const result = await service.updateVersionService(formId, versionNum, req.body, req.user);

    res.status(200).json({ version: result });
  } catch (err) {
    next(err);
  }
};

export const updateVersionSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, version } = req.params;
    if (typeof formId !== 'string' || typeof version !== 'string') {
      throw new ApiError(400, 'Invalid parameters');
    }
    const versionNum = parseInt(version, 10);
    const result = await service.updateVersionSettingsService(
      formId,
      versionNum,
      req.body,
      req.user,
    );
    res.status(200).json({ version: result });
  } catch (err) {
    next(err);
  }
};

export const updateVersionAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId, version } = req.params;
    if (typeof formId !== 'string' || typeof version !== 'string') {
      throw new ApiError(400, 'Invalid parameters');
    }
    const versionNum = parseInt(version, 10);
    const result = await service.updateVersionAccessService(formId, versionNum, req.body, req.user);
    res.status(200).json({ version: result });
  } catch (err) {
    next(err);
  }
};

export const publishVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { formId } = req.params;
    if (typeof formId !== 'string') throw new ApiError(400, 'Invalid form ID');
    if (!req.user) throw new ApiError(401, 'Unauthorized');

    const version = await service.publishVersionService(formId, req.user);
    res.status(200).json({
      message: 'Form published',
      version,
    });
  } catch (err) {
    next(err);
  }
};
