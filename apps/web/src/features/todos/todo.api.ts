export type Todo = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  done: boolean;
};

export type CreateTodoInput = {
  title: string;
  description?: string;
};

export type UpdateTodoInput = Partial<CreateTodoInput>;

export type ApiErrorDetail = { field: string; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) throw new Error('API URL is not configured');
  let response: Response;
  try {
    response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/api/todos${path}`,
      options,
    );
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new Error(
      'Cannot reach the server. Check your connection and try again.',
      { cause: error },
    );
  }
  if (!response.ok) {
    let message = 'The request failed. Please try again.';
    let details: ApiErrorDetail[] = [];
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const error = body.error;
        if (error && typeof error === 'object') {
          if ('message' in error && typeof error.message === 'string')
            message = error.message;
          if ('details' in error && Array.isArray(error.details)) {
            details = error.details.filter(
              (detail): detail is ApiErrorDetail =>
                !!detail &&
                typeof detail === 'object' &&
                typeof detail.field === 'string' &&
                typeof detail.message === 'string',
            );
          }
        }
      }
    } catch {
      // Proxies can return HTML or an empty body instead of the API's JSON format.
    }
    throw new ApiError(message, response.status, details);
  }
  return response;
}

export type TodoListParams = {
  page: number;
  limit: number;
  status: 'all' | 'active' | 'completed';
  search: string;
};

export type TodoPage = {
  todos: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: { all: number; active: number; completed: number };
};

export const defaultTodoParams: TodoListParams = {
  page: 1,
  limit: 10,
  status: 'all',
  search: '',
};

export async function getTodos(
  params: TodoListParams,
  signal?: AbortSignal,
): Promise<TodoPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    status: params.status,
    search: params.search,
  });
  const response = await apiFetch(`?${query}`, { signal });
  return response.json();
}

export async function createTodo(input: CreateTodoInput) {
  const response = await apiFetch('', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  const response = await apiFetch(`/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function toggleTodoDone(id: string): Promise<Todo> {
  const response = await apiFetch(`/${id}/done`, {
    method: 'PATCH',
  });

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  await apiFetch(`/${id}`, {
    method: 'DELETE',
  });
}
