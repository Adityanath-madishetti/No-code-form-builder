import { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';

import { formVersionPayloadSchema } from './form-version.schema.js';

const ajv = new (Ajv as any)({ allErrors: true, verbose: true });

const validateFormVersionPayload = ajv.compile(formVersionPayloadSchema);

/**
 * Validate a form version payload against the JSON schema.
 *
 * @param {object} data — the payload to validate
 * @returns {{ valid: boolean, errors: object[]|null }}
 */
function validateFormVersion(data: any) {
  const valid = validateFormVersionPayload(data);
  return {
    valid,
    errors: valid ? null : validateFormVersionPayload.errors,
  };
}

/**
 * Express middleware: validate request body against the form version schema.
 * Attach to routes that accept form version payloads.
 */
export function validateFormVersionMiddleware(req: Request, res: Response, next: NextFunction) {
  const { valid, errors } = validateFormVersion(req.body);

  if (!valid && errors) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.map((e: any) => ({
        path: e.instancePath,
        message: e.message,
        params: e.params,
      })),
    });
  }

  next();
}
