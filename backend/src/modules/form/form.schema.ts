// backend/src/modules/forms/form.schema.ts

import { z } from 'zod';

export const createFormSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
  }),
});

export const updateFormSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    // isActive is intentionally excluded: use the publish/unpublish endpoints.
  }),
});
