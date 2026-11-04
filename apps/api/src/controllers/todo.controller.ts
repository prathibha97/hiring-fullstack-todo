import { Request, Response } from 'express';
import * as todoService from '../services/todo.service.js';
import { createTodoSchema } from '../validators/todo.validator.js';
export async function createTodo(req: Request, res: Response) {
  const result = createTodoSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid TODO',
        details: result.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      },
    });
  }

  const todo = await todoService.createTodo({
    title: result.data.title,
    description: result.data.description,
  });

  return res.status(201).json(todo);
}
