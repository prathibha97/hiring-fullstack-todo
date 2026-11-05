import { expect, it } from 'vitest';
import { readTodoParams } from '@/features/todos/useTodoParams';

it('falls back to safe defaults for invalid URL parameters', () => {
  expect(readTodoParams('?page=-2&limit=999&status=other')).toEqual({
    page: 1,
    limit: 10,
    status: 'all',
    search: '',
  });
});
it('restores supported parameters and caps search length', () => {
  expect(
    readTodoParams(
      `?page=3&limit=50&status=completed&search=${'x'.repeat(201)}`,
    ),
  ).toEqual({
    page: 3,
    limit: 50,
    status: 'completed',
    search: 'x'.repeat(200),
  });
});
