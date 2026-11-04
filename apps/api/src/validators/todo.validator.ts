import { z } from 'zod';

export const createTodoSchema = z.strictObject({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(200, {
    message: 'Title must be at most 200 characters',
  }),
  description: z
    .string()
    .trim()
    .max(2000, {
      message: 'Description must be at most 2000 characters',
    })
    .optional(),
});
