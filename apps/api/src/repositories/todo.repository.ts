import { TodoModel } from '../models/todo.model.js';

export type CreateTodoInput = {
  title: string;
  description?: string;
};

export type UpdateTodoInput = Partial<CreateTodoInput>;

export async function createTodo(input: CreateTodoInput) {
  return TodoModel.create({
    title: input.title,
    description: input.description,
  });
}

export async function findTodos() {
  return TodoModel.find().sort({ createdAt: -1, _id: -1 }).lean().exec();
}

export async function updateTodo(id: string, input: UpdateTodoInput) {
  return TodoModel.findByIdAndUpdate(
    id,
    { $set: input },
    { new: true, runValidators: true },
  ).exec();
}
