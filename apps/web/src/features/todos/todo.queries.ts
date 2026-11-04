import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { defaultTodoParams, getTodos, type TodoListParams } from "./todo.api";

export const todoKeys = { all: ["todos"] as const };

export function todosQueryOptions(params: TodoListParams = defaultTodoParams) {
  return queryOptions({
    queryKey: [...todoKeys.all, params],
    queryFn: ({ signal }) => getTodos(params, signal),
    placeholderData: keepPreviousData,
  });
}
