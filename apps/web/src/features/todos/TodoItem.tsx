import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo, toggleTodoDone, type Todo } from './todo.api';
import { todoKeys } from './todo.queries';

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: toggleTodoDone,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  const isBusy = toggleMutation.isPending || deleteMutation.isPending;

  function handleDelete() {
    if (isBusy) return;
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteMutation.mutate(todo._id);
    }
  }

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

        <div className='flex shrink-0 flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={isBusy}
            aria-pressed={todo.done}
            aria-label={`Mark ${todo.title} as ${
              todo.done ? 'pending' : 'done'
            }`}
            onClick={() => toggleMutation.mutate(todo._id)}
          >
            {toggleMutation.isPending
              ? 'Saving…'
              : todo.done
                ? 'Mark pending'
                : 'Mark done'}
          </Button>

          <Button
            variant='destructive'
            size='sm'
            disabled={isBusy}
            aria-label={`Delete ${todo.title}`}
            onClick={handleDelete}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>

      {(toggleMutation.isError || deleteMutation.isError) && (
        <p role='alert' className='text-sm text-destructive'>
          {deleteMutation.error?.message ?? toggleMutation.error?.message}
        </p>
      )}
    </li>
  );
}
