// backend/src/modules/group/group.schema.ts
import { z } from 'zod';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Group name is required'),
    components: z.any(),
    sharedWith: z.array(z.email()).optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updateGroupSchema = z.object({
  params: z.object({
    groupId: z.uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
    components: z.any().optional(),
    sharedWith: z.array(z.email()).optional(),
    isPublic: z.boolean().optional(),
  }),
});
