import { TodoModel } from '../models/todo.model.js';

export type CreateTodoInput = {
  title: string;
  description?: string;
};

export async function createTodo(input: CreateTodoInput) {
  return TodoModel.create({
    title: input.title,
    description: input.description,
  });
}
