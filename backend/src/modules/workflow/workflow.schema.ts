// backend/src/modules/workflow/workflow.schema.ts

import { z } from 'zod';

export const transitionSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  condition: z.string().optional(),
  roles: z.array(z.string()).optional(),
  label: z.string().optional(),
});

export const workflowConfigSchema = z.object({
  enabled: z.boolean(),
  states: z.array(z.string()),
  initialState: z.string(),
  transitions: z.array(transitionSchema),
});

export const transitionSubmissionSchema = z.object({
  transitionId: z.string(),
  role: z.string().optional(),
});
