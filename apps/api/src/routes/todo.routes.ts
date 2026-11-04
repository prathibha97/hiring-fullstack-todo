import { Router } from 'express';
import { createTodo, listTodos } from '../controllers/todo.controller.js';

export const todoRouter = Router();

todoRouter.get('/', listTodos);
todoRouter.post('/', createTodo);
