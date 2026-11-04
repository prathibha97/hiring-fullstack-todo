import { TodoModel } from "../models/todo.model.js";

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

export type ListTodosInput = {
  page: number;
  limit: number;
  status: "all" | "active" | "completed";
  search: string;
};

export async function findTodos({
  page,
  limit,
  status,
  search,
}: ListTodosInput) {
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = {
    ...(status === "all" ? {} : { done: status === "completed" }),
    ...(search
      ? {
          $or: [
            { title: { $regex: escapedSearch, $options: "i" } },
            { description: { $regex: escapedSearch, $options: "i" } },
          ],
        }
      : {}),
  };
  const [total, all, completed] = await Promise.all([
    TodoModel.countDocuments(filter),
    TodoModel.countDocuments({}),
    TodoModel.countDocuments({ done: true }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(page, totalPages);
  const todos = await TodoModel.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return {
    todos,
    pagination: { page: currentPage, limit, total, totalPages },
    counts: { all, active: all - completed, completed },
  };
}

export async function updateTodo(id: string, input: UpdateTodoInput) {
  return TodoModel.findByIdAndUpdate(
    id,
    { $set: input },
    { returnDocument: "after", runValidators: true },
  ).exec();
}

export async function toggleTodoDone(id: string) {
  return TodoModel.findByIdAndUpdate(
    id,
    [{ $set: { done: { $not: ["$done"] } } }],
    { updatePipeline: true, returnDocument: "after" },
  ).exec();
}

export async function deleteTodo(id: string) {
  return TodoModel.findByIdAndDelete(id).exec();
}
