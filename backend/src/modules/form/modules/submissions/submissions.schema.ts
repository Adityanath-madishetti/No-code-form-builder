// backend/src/modules/forms/modules/submissions/submissions.schema.ts
import { z } from 'zod';

export const submitFormSchema = z.object({
  body: z.object({
    formVersion: z.number().optional(),
    status: z.enum(["draft", "submitted", "under_review", "approved", "rejected"]).optional(),
    email: z.string().email().optional().or(z.literal('')),
    pages: z.array(
      z.object({
        pageNo: z.number(),
        responses: z.array(
          z.object({
            componentId: z.string(),
            response: z.any().nullable().optional(),
          })
        ).optional(),
      })
    ).optional(),
  }),
});
