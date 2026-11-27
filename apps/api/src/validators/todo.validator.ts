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

export const todoIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid TODO ID');

export const updateTodoSchema = createTodoSchema
  .partial()
  .refine(
    (input) => input.title != undefined || input.description != undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export const listTodosQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['all', 'active', 'completed']).default('all'),
  search: z.string().trim().max(200).default(''),
});
