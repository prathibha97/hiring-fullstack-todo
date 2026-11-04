import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { todosQueryOptions } from './todo.queries';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const {
    data: todos,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(todosQueryOptions());

  if (isPending) {
    return <p role='status'>Loading your TODOs…</p>;
  }

  if (isError && !todos) {
    return (
      <div className='space-y-3'>
        <p role='alert' className='text-destructive'>
          {error.message}
        </p>
        <Button
          variant='outline'
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    );
  }

  return (
  <ul className="space-y-3">
    {todos.map((todo) => (
      <TodoItem key={todo._id} todo={todo} />
    ))}
  </ul>
);
}
