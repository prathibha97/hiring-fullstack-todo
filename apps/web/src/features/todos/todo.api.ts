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

const apiUrl = import.meta.env.VITE_API_URL;

export async function getTodos(signal?: AbortSignal): Promise<Todo[]> {
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/todos`, { signal });

  if (!response.ok) {
    throw new Error('Failed to fetch TODOs, please try again');
  }
  const data: { todos: Todo[] } = await response.json();
  return data.todos;
}

export async function createTodo(input: CreateTodoInput) {
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to create your TODO, please try again');
  }

  const data: { todo: Todo } = await response.json();
  return data.todo;
}
