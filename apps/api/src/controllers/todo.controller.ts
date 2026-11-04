import { Request, Response } from 'express';
import { AppError } from '../errors/app-error.js';
import { Todo } from '../models/todo.model.js';
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
  const validatedId = validateTodoId(req.params.id);

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

  const todo = await todoService.updateTodo(validatedId, {
    title: bodyResult.data.title,
    description: bodyResult.data.description,
  });

  checkTodoExists(todo);

  return res.status(200).json({ todo });
}

export async function toggleTodoDone(req: Request, res: Response) {
  const validatedId = validateTodoId(req.params.id);

  const todo = await todoService.toggleTodoDone(validatedId);

  checkTodoExists(todo);

  return res.status(200).json({ todo });
}

export async function deleteTodo(req: Request, res: Response) {
  const validatedId = validateTodoId(req.params.id);

  const todo = await todoService.deleteTodo(validatedId);

  checkTodoExists(todo);
  
  return res.status(204).end();
}

function validateTodoId(id: string | string[] | undefined): string {
  const result = todoIdSchema.safeParse(id);
  if (!result.success) {
    throw new AppError('Invalid TODO ID', 400);
  }
  return result.data;
}

function checkTodoExists(todo: Todo | null) {
  if (!todo) {
    throw new AppError('TODO not found', 404);
  }
  return todo;
}
