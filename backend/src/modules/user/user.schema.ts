import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).optional(),
    avatarUrl: z.url().optional(),
  }).strict(),
});