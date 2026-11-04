import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import type { TodoListParams } from './todo.api';
import { todosQueryOptions } from './todo.queries';
import { TodoItem } from './TodoItem';
import { TodoPagination } from './TodoPagination';

export function TodoList({
  params,
  onParamsChange,
}: {
  params: TodoListParams;
  onParamsChange: (params: TodoListParams) => void;
}) {
  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
    refetch,
  } = useQuery(todosQueryOptions(params));
  if (isPending)
    return (
      <p
        role='status'
        className='flex items-center gap-2 py-8 text-sm text-muted-foreground'
      >
        <Loader2 className='size-4 animate-spin' aria-hidden='true' />
        Loading tasks…
      </p>
    );
  if (isError && !data)
    return (
      <div className='space-y-3 py-8'>
        <p role='alert' className='text-sm text-destructive'>
          {error.message}
        </p>
        <Button
          variant='outline'
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RotateCcw
            className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
            aria-hidden='true'
          />
          {isFetching ? 'Retrying…' : 'Try again'}
        </Button>
      </div>
    );

  const { todos, counts, pagination } = data;
  const query = params.search.trim();
  const filter = params.status;
  const filters = [
    { value: 'all' as const, label: 'All', count: counts.all },
    { value: 'active' as const, label: 'Active', count: counts.active },
    {
      value: 'completed' as const,
      label: 'Completed',
      count: counts.completed,
    },
  ];
  return (
    <div>
      <div className='task-toolbar'>
        <div className='task-filters' role='group' aria-label='Filter tasks'>
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type='button'
              aria-pressed={filter === value}
              className='task-filter'
              onClick={() =>
                onParamsChange({ ...params, status: value, page: 1 })
              }
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <div className='task-search'>
          <Search
            className='size-3.5 shrink-0 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            value={params.search}
            maxLength={200}
            onChange={(event) =>
              onParamsChange({ ...params, search: event.target.value, page: 1 })
            }
            aria-label='Search tasks'
            placeholder='Search'
            className='h-8 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
          />
        </div>
      </div>
      {isError && (
        <p role='alert' className='my-3 text-sm text-destructive'>
          Couldn’t refresh tasks.{' '}
          <button
            className='underline underline-offset-4'
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Retry
          </button>
        </p>
      )}
      {todos.length === 0 ? (
        <div className='empty-tasks'>
          <p>
            {query
              ? 'No matching tasks.'
              : counts.all === 0
                ? 'No tasks yet.'
                : filter === 'active'
                  ? 'No active tasks.'
                  : 'No completed tasks.'}
          </p>
          {(query || filter !== 'all') && (
            <button
              type='button'
              className='mt-2 text-xs underline underline-offset-4'
              onClick={() => {
                onParamsChange({
                  ...params,
                  page: 1,
                  search: '',
                  status: 'all',
                });
              }}
            >
              Show all tasks
            </button>
          )}
        </div>
      ) : (
        <fieldset
          disabled={isPlaceholderData}
          aria-busy={isFetching}
          className={
            isPlaceholderData
              ? 'opacity-50 transition-opacity'
              : 'transition-opacity'
          }
        >
          <legend className='sr-only'>Tasks on page {pagination.page}</legend>
          <ul className='task-list'>
            {todos.map((todo) => (
              <TodoItem key={todo._id} todo={todo} />
            ))}
          </ul>
        </fieldset>
      )}
      {isFetching && (
        <p role='status' className='mt-3 text-xs text-muted-foreground'>
          Updating tasks…
        </p>
      )}
      <TodoPagination
        pagination={pagination}
        busy={isFetching}
        onPageChange={(page) => onParamsChange({ ...params, page })}
        onLimitChange={(limit) => onParamsChange({ ...params, limit, page: 1 })}
      />
    </div>
  );
}
