// backend/src/modules/themes/theme.schema.ts

import { z } from 'zod';

export const createThemeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    theme: z.any(),
    sharedWith: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updateThemeSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    theme: z.any().optional(),
    sharedWith: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
  }),
});
