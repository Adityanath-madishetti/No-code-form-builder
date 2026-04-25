// backend/src/modules/forms/modules/submissions/submissions.schema.ts
import { z } from 'zod';

export const submitFormSchema = z.object({
  body: z.object({
    formVersion: z.number().optional(),
    status: z.string().optional(),
    email: z.email().optional().or(z.literal('')),
    pages: z.array(z.any()).optional(),
  }),
});
