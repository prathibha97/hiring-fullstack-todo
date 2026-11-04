import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { todosQueryOptions } from './todo.queries';

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
    <ul className='space-y-3'>
      {todos.map((todo) => (
        <li key={todo._id} className='rounded-lg border bg-card p-4'>
          <div className='flex items-start justify-between gap-4'>
            <h2
              className={`break-words font-medium ${
                todo.done ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {todo.title}
            </h2>
            <span className='shrink-0 text-xs text-muted-foreground'>
              {todo.done ? 'Completed' : 'Pending'}
            </span>
          </div>

          {todo.description && (
            <p className='mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground'>
              {todo.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
