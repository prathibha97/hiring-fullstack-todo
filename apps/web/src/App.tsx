import { useEffect, useState } from 'react';
import { CreateTodoForm } from './features/todos/CreateTodoForm';
import { getTodos, type Todo } from './features/todos/todo.api';
import { TodoList } from './features/todos/TodoList';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const fetchTodos = async () => {
    try {
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);
  return (
    <main className='mx-auto max-w-2xl space-y-6 px-4 py-12'>
      <header className='space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight'>My TODOs</h1>
        <p className='text-muted-foreground'>
          Keep track of what needs to get done.
        </p>
      </header>

      <CreateTodoForm />
      <TodoList />
    </main>
  );
}

export default App;
