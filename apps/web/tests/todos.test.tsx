import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TodosPage } from '@/features/todos/TodosPage';
import { CreateTodoForm } from '@/features/todos/CreateTodoForm';
import { EditTodoForm } from '@/features/todos/EditTodoForm';
import { TodoItem } from '@/features/todos/TodoItem';
import type { Todo, TodoPage } from '@/features/todos/todo.api';

const todo: Todo = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Review requirements',
  description: 'Check acceptance criteria',
  done: false,
  createdAt: '2026-11-04T08:00:00.000Z',
  updatedAt: '2026-11-04T08:00:00.000Z',
};
const fetchMock = vi.fn<typeof fetch>();
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
function page(pageNumber = 1, title = todo.title): TodoPage {
  return {
    todos: [{ ...todo, title }],
    pagination: { page: pageNumber, limit: 10, total: 11, totalPages: 2 },
    counts: { all: 11, active: 8, completed: 3 },
  };
}
function mount(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('task forms', () => {
  it('rejects whitespace-only titles without sending a request', async () => {
    const user = userEvent.setup();
    mount(<CreateTodoForm />);
    await user.type(screen.getByLabelText('Task title'), '   ');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
    expect(screen.getByLabelText('Task title')).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('trims a new task and clears the form only after success', async () => {
    fetchMock.mockResolvedValue(json({ todo }));
    const onCreated = vi.fn();
    const user = userEvent.setup();
    mount(<CreateTodoForm onCreated={onCreated} />);
    await user.type(screen.getByLabelText('Task title'), '  New task  ');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      title: 'New task',
      description: '',
    });
    expect(screen.getByLabelText('Task title')).toHaveValue('');
  });
  it('keeps create input and returns focus after a server validation error', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { message: 'Title was rejected' } }, 400),
    );
    const user = userEvent.setup();
    mount(<CreateTodoForm />);
    await user.type(screen.getByLabelText('Task title'), 'Keep my draft');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Title was rejected',
    );
    expect(screen.getByLabelText('Task title')).toHaveValue('Keep my draft');
    await waitFor(() =>
      expect(screen.getByLabelText('Task title')).toHaveFocus(),
    );
  });
  it('preserves an edited draft on failure, then saves successfully', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { message: 'Try later' } }, 500))
      .mockResolvedValueOnce(json({ todo }));
    const onClose = vi.fn();
    const user = userEvent.setup();
    mount(<EditTodoForm todo={todo} onClose={onClose} />);
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Revised task');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Try later');
    expect(screen.getByLabelText('Title')).toHaveValue('Revised task');
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('PUT');
  });
});

describe('task actions', () => {
  it('toggles completion once and reflects the stored result after refresh', async () => {
    fetchMock.mockImplementation(async (_url, init) =>
      init?.method === 'PATCH'
        ? json({ todo: { ...todo, done: true } })
        : json({
            ...page(),
            todos: [
              {
                ...todo,
                done: fetchMock.mock.calls.some(
                  ([, opts]) => opts?.method === 'PATCH',
                ),
              },
            ],
          }),
    );
    const user = userEvent.setup();
    mount(<TodosPage />);
    await user.click(
      await screen.findByRole('checkbox', {
        name: `Mark ${todo.title} as done`,
      }),
    );
    expect(
      await screen.findByRole('checkbox', {
        name: `Mark ${todo.title} as pending`,
      }),
    ).toBeChecked();
    expect(
      fetchMock.mock.calls.filter(([, opts]) => opts?.method === 'PATCH'),
    ).toHaveLength(1);
  });
  it('requires confirmation, cancels safely, and keeps a failed delete dialog open', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { message: 'Delete failed' } }, 500),
    );
    const user = userEvent.setup();
    mount(
      <ul>
        <TodoItem todo={todo} />
      </ul>,
    );
    await user.click(
      screen.getByRole('button', { name: `Delete ${todo.title}` }),
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: `Delete ${todo.title}` }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete TODO' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Delete failed',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(
      screen.getByRole('heading', { name: todo.title }),
    ).toBeInTheDocument();
  });
});

describe('list navigation', () => {
  it('loads URL state, navigates pages, and responds to browser history', async () => {
    window.history.replaceState(null, '', '/?status=active&page=2');
    fetchMock.mockImplementation(async (url) => {
      const params = new URL(String(url)).searchParams;
      return json(
        page(Number(params.get('page')), `Page ${params.get('page')} task`),
      );
    });
    const user = userEvent.setup();
    mount(<TodosPage />);
    expect(
      await screen.findByRole('heading', { name: 'Page 2 task' }),
    ).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('status=active');
    await user.click(
      screen.getByRole('button', { name: 'Go to previous page' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Page 1 task' }),
    ).toBeInTheDocument();
    expect(new URLSearchParams(window.location.search).get('page')).toBeNull();
    window.history.replaceState(null, '', '/?page=2');
    fireEvent.popState(window);
    expect(
      await screen.findByRole('heading', { name: 'Page 2 task' }),
    ).toBeInTheDocument();
  });
  it('debounces search, resets the page and keeps controls available after failure', async () => {
    window.history.replaceState(null, '', '/?page=2');
    fetchMock.mockImplementation(async (url) =>
      new URL(String(url)).searchParams.get('search')
        ? json({ error: { message: 'Search unavailable' } }, 503)
        : json(page()),
    );
    const user = userEvent.setup();
    mount(<TodosPage />);
    await screen.findByRole('heading', { name: todo.title });
    await user.type(
      screen.getByRole('textbox', { name: 'Search tasks' }),
      'meeting',
    );
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        new URL(String(url)).searchParams.get('search'),
      ),
    ).toHaveLength(0);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Search unavailable',
    );
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        new URL(String(url)).searchParams.get('search'),
      ),
    ).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Search tasks' })).toHaveValue(
      'meeting',
    );
    await user.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(
      await screen.findByRole('heading', { name: todo.title }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });
  it('sends status and page-size changes to the API with page one', async () => {
    fetchMock.mockImplementation(async () => json(page()));
    const user = userEvent.setup();
    mount(<TodosPage />);
    await screen.findByRole('heading', { name: todo.title });
    await user.click(
      within(screen.getByRole('group', { name: 'Filter tasks' })).getByRole(
        'button',
        { name: /Completed/ },
      ),
    );
    await waitFor(() =>
      expect(String(fetchMock.mock.lastCall?.[0])).toContain(
        'status=completed',
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Tasks per page' }),
      ).toBeEnabled(),
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Tasks per page' }),
      '20',
    );
    await waitFor(() =>
      expect(String(fetchMock.mock.lastCall?.[0])).toContain('limit=20'),
    );
    expect(String(fetchMock.mock.lastCall?.[0])).toContain('page=1');
  });
});

it('recovers from a failed next-page request without hiding search or filters', async () => {
  fetchMock.mockImplementation(async (url) =>
    new URL(String(url)).searchParams.get('page') === '2'
      ? json({ error: { message: 'Page unavailable' } }, 500)
      : json(page()),
  );
  const user = userEvent.setup();
  mount(<TodosPage />);
  await screen.findByRole('heading', { name: todo.title });
  await user.click(screen.getByRole('button', { name: 'Go to next page' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Page unavailable',
  );
  expect(screen.getByRole('textbox', { name: 'Search tasks' })).toBeEnabled();
  expect(
    screen.getByRole('group', { name: 'Filter tasks' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reset view' }));
  expect(
    await screen.findByRole('heading', { name: todo.title }),
  ).toBeInTheDocument();
});

it('removes a task only after a confirmed successful delete', async () => {
  let deleted = false;
  fetchMock.mockImplementation(async (_url, init) => {
    if (init?.method === 'DELETE') {
      deleted = true;
      return new Response(null, { status: 204 });
    }
    return json(
      deleted
        ? {
            todos: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
            counts: { all: 0, active: 0, completed: 0 },
          }
        : page(),
    );
  });
  const user = userEvent.setup();
  mount(<TodosPage />);
  await user.click(
    await screen.findByRole('button', { name: `Delete ${todo.title}` }),
  );
  expect(deleted).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Delete TODO' }));
  expect(await screen.findByText('No tasks yet.')).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: todo.title }),
  ).not.toBeInTheDocument();
});
