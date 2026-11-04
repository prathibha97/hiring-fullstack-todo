import * as todoRepository from '../repositories/todo.repository.js';
import { CreateTodoInput } from '../repositories/todo.repository.js';

export async function createTodo(input: CreateTodoInput) {
  return todoRepository.createTodo(input);
}

export async function listTodos() {
  return todoRepository.findTodos();
}
