import { Router } from 'express';
import {
  createTodo,
  listTodos,
  toggleTodoDone,
  updateTodo,
} from '../controllers/todo.controller.js';

export const todoRouter = Router();

todoRouter.get('/', listTodos);
todoRouter.post('/', createTodo);
todoRouter.put('/:id', updateTodo);
todoRouter.patch('/:id/done', toggleTodoDone);
