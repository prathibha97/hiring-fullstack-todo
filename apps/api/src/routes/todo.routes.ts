import { Router } from 'express';
import { createTodo } from '../controllers/todo.controller.js';

export const todoRouter = Router();

todoRouter.post('/', createTodo);
