import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Circle,
  CircleCheck,
  Layers2,
  ListTodo,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { CreateTodoForm } from './features/todos/CreateTodoForm';
import { TodoList } from './features/todos/TodoList';
import {
  defaultTodoParams,
  type TodoListParams,
} from './features/todos/todo.api';
import { todosQueryOptions } from './features/todos/todo.queries';

export default function App() {
  const [params, setParams] = useState<TodoListParams>(defaultTodoParams);
  const { data } = useQuery(todosQueryOptions(params));
  const views = [
    {
      value: 'all' as const,
      label: 'All tasks',
      icon: ListTodo,
      count: data?.counts.all,
    },
    {
      value: 'active' as const,
      label: 'Active',
      icon: Circle,
      count: data?.counts.active,
    },
    {
      value: 'completed' as const,
      label: 'Completed',
      icon: CircleCheck,
      count: data?.counts.completed,
    },
  ];

  return (
    <div className='linear-layout'>
      <a href='#tasks' className='skip-link'>
        Skip to tasks
      </a>
      <aside className='linear-sidebar' aria-label='Workspace'>
        <a href='#tasks' className='workspace-name'>
          <span className='workspace-symbol'>
            <Layers2 className='size-4' aria-hidden='true' />
          </span>
          Personal
        </a>
        <p className='sidebar-label'>Workspace</p>
        <nav aria-label='Task views' className='sidebar-views'>
          {views.map(({ value, label, icon: Icon, count }) => (
            <button
              type='button'
              key={value}
              className='sidebar-view'
              aria-pressed={params.status === value}
              onClick={() =>
                setParams((previous) => ({
                  ...previous,
                  status: value,
                  page: 1,
                }))
              }
            >
              <Icon className='size-4' aria-hidden='true' />
              <span>{label}</span>
              <span className='view-count'>{count ?? '—'}</span>
            </button>
          ))}
        </nav>
        <div className='sidebar-bottom'>
          <span className='workspace-avatar' aria-hidden='true'>
            P
          </span>
          <div>
            <p>Personal workspace</p>
            <span>TODOs</span>
          </div>
        </div>
      </aside>
      <main id='tasks' tabIndex={-1} className='linear-main'>
        <div className='workspace-breadcrumb'>
          <ListTodo className='size-4' aria-hidden='true' />
          <span>Personal</span>
          <ChevronRight className='size-3' aria-hidden='true' />
          <span className='text-foreground'>My tasks</span>
        </div>
        <div className='todo-app'>
          <header className='todo-header'>
            <div>
              <div className='flex items-center gap-2.5'>
                <h1>My tasks</h1>
                {data && (
                  <span className='heading-count'>{data.counts.all}</span>
                )}
              </div>
              <p>Manage your tasks and track what’s done.</p>
            </div>
            <Button
              size='sm'
              onClick={() => document.getElementById('todo-title')?.focus()}
            >
              <Plus className='size-3.5' aria-hidden='true' />
              New task
            </Button>
          </header>
          <CreateTodoForm
            onCreated={() =>
              setParams({ ...defaultTodoParams, limit: params.limit })
            }
          />
          <section aria-label='Tasks'>
            <TodoList params={params} onParamsChange={setParams} />
          </section>
        </div>
      </main>
      <Toaster position='bottom-right' closeButton />
    </div>
  );
}
