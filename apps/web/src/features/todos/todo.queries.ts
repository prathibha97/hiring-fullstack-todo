import { queryOptions } from '@tanstack/react-query';
import { getTodos } from './todo.api';

export const todoKeys = {
  all: ['todos'] as const,
};

export function todosQueryOptions() {
  return queryOptions({
    queryKey: todoKeys.all,
    queryFn: ({ signal }) => getTodos(signal),
  });
}
