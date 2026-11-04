import { z } from 'zod';
import {
  createTodoSchema,
  todoIdSchema,
} from '../validators/todo.validator.js';

export const todoResponseSchema = z
  .object({
    _id: todoIdSchema,
    title: createTodoSchema.shape.title,
    description: createTodoSchema.shape.description.unwrap(),
    done: z.boolean(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: 'Todo' });

export const todoListResponseSchema = z
  .object({
    todos: z.array(todoResponseSchema),
  })
  .meta({ id: 'TodoListResponse' });

export const todoItemResponseSchema = z
  .object({
    todo: todoResponseSchema,
  })
  .meta({ id: 'TodoItemResponse' });

export const errorResponseSchema = z
  .object({
    error: z.object({
      message: z.string(),
      details: z
        .array(
          z.object({
            field: z.string().optional(),
            message: z.string(),
          }),
        )
        .optional(),
    }),
  })
  .meta({ id: 'ErrorResponse' });
