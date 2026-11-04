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

const apiUrl = import.meta.env.VITE_API_URL;

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new Error(
      "Cannot reach the server. Check your connection and try again.",
    );
  }
}

export async function getTodos(signal?: AbortSignal): Promise<Todo[]> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch(`${apiUrl}/api/todos`, { signal });

  if (!response.ok) {
    throw new Error("Failed to fetch TODOs, please try again");
  }
  const data: { todos: Todo[] } = await response.json();
  return data.todos;
}

export async function createTodo(input: CreateTodoInput) {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch(`${apiUrl}/api/todos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create your TODO, please try again");
  }

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch(`${apiUrl}/api/todos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to update this TODO, please try again");
  }

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function toggleTodoDone(id: string): Promise<Todo> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch(`${apiUrl}/api/todos/${id}/done`, {
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to update this TODO, please try again");
  }

  const data: { todo: Todo } = await response.json();
  return data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  if (!apiUrl) {
    throw new Error("API URL is not configured");
  }

  const response = await apiFetch(`${apiUrl}/api/todos/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete this TODO, please try again");
  }
}
