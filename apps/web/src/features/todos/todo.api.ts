export type Todo = {
  _id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  done: boolean;
};

const apiUrl = import.meta.env.VITE_API_URL;

export async function getTodos(signal?: AbortSignal): Promise<Todo[]> {
  if (!apiUrl) {
    throw new Error('API URL is not configured');
  }

  const response = await fetch(`${apiUrl}/api/todos`, { signal });

  if (!response.ok) {
    throw new Error('Failed to fetch todos, please try again');
  }
  const data: { todos: Todo[] } = await response.json();
  return data.todos;
}
