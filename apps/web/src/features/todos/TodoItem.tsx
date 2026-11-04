import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toggleTodoDone, type Todo } from './todo.api';
import { todoKeys } from './todo.queries';

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: toggleTodoDone,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  return (
    <li className='space-y-3 rounded-lg border bg-card p-4'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 space-y-2'>
          <h2
            className={`wrap-break-words font-medium ${
              todo.done ? 'text-muted-foreground line-through' : ''
            }`}
          >
            {todo.title}
          </h2>

          {todo.description && (
            <p className='whitespace-pre-wrap wrap-break-words text-sm text-muted-foreground'>
              {todo.description}
            </p>
          )}
        </div>

        <Button
          variant='outline'
          size='sm'
          className='shrink-0'
          disabled={mutation.isPending}
          aria-pressed={todo.done}
          aria-label={`Mark ${todo.title} as ${todo.done ? 'pending' : 'done'}`}
          onClick={() => mutation.mutate(todo._id)}
        >
          {mutation.isPending
            ? 'Saving…'
            : todo.done
              ? 'Mark pending'
              : 'Mark done'}
        </Button>
      </div>

      {mutation.isError && (
        <p role='alert' className='text-sm text-destructive'>
          {mutation.error.message}
        </p>
      )}
    </li>
  );
}
