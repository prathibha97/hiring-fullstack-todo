import { beforeEach, expect, it, vi } from 'vitest';
import {
  ApiError,
  createTodo,
  defaultTodoParams,
  deleteTodo,
  getTodos,
} from '@/features/todos/todo.api';

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

it('preserves the API status and validation details', async () => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        error: {
          message: 'Invalid TODO',
          details: [{ field: 'title', message: 'Title required' }, null],
        },
      }),
      { status: 400 },
    ),
  );
  const error = await createTodo({ title: '' }).catch(
    (error: unknown) => error,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({
    status: 400,
    message: 'Invalid TODO',
    details: [{ field: 'title', message: 'Title required' }],
  });
});
it('uses a safe fallback for a non-JSON proxy error', async () => {
  fetchMock.mockResolvedValue(
    new Response('<html>Bad Gateway</html>', { status: 502 }),
  );
  await expect(getTodos(defaultTodoParams)).rejects.toMatchObject({
    status: 502,
    message: 'The request failed. Please try again.',
  });
});
it('does not parse an empty successful delete response', async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  await expect(deleteTodo('example-id')).resolves.toBeUndefined();
});
it('keeps the original cause of network failures', async () => {
  const cause = new TypeError('Failed to fetch');
  fetchMock.mockRejectedValue(cause);
  await expect(getTodos(defaultTodoParams)).rejects.toMatchObject({
    message: 'Cannot reach the server. Check your connection and try again.',
    cause,
  });
});
it('preserves abort errors rather than presenting them as connection failures', async () => {
  const controller = new AbortController();
  controller.abort();
  fetchMock.mockRejectedValue(controller.signal.reason);
  await expect(getTodos(defaultTodoParams, controller.signal)).rejects.toBe(
    controller.signal.reason,
  );
});
