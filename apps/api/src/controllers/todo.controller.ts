import { Request, Response } from 'express';
import * as todoService from '../services/todo.service.js';
import {
  createTodoSchema,
  todoIdSchema,
  updateTodoSchema,
} from '../validators/todo.validator.js';
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

export async function listTodos(_req: Request, res: Response) {
  const todos = await todoService.listTodos();
  return res.status(200).json({ todos });
}

export async function updateTodo(req: Request, res: Response) {
  const idResult = todoIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid TODO ID',
      },
    });
  }

  const bodyResult = updateTodoSchema.safeParse(req.body);

  if (!bodyResult.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid TODO',
        details: bodyResult.error.issues.map((issue) => ({
          field: issue.path[0],
          message: issue.message,
        })),
      },
    });
  }

  const todo = await todoService.updateTodo(idResult.data, {
    title: bodyResult.data.title,
    description: bodyResult.data.description,
  });

  if (!todo) {
    return res.status(404).json({
      error: {
        message: 'TODO not found',
      },
    });
  }
  return res.status(200).json({ todo });
}

export async function toggleTodoDone(req: Request, res: Response) {
  const idResult = todoIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid TODO ID',
      },
    });
  }

  const todo = await todoService.toggleTodoDone(idResult.data);

  if (!todo) {
    return res.status(404).json({
      error: {
        message: 'TODO not found',
      },
    });
  }
  return res.status(200).json({ todo });
}

export async function deleteTodo(req: Request, res: Response) {
  const idResult = todoIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid TODO ID',
      },
    });
  }

  const todo = await todoService.deleteTodo(idResult.data);

  if (!todo) {
    return res.status(404).json({
      error: {
        message: 'TODO not found',
      },
    });
  }
  return res.status(204).end();
}
