import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ListTodo, Plus } from 'lucide-react';
import { WorkspaceSidebar } from '@/components/layout/WorkspaceSidebar';
import { useTodoParams } from './useTodoParams';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { CreateTodoForm } from './CreateTodoForm';
import { TodoList } from './TodoList';
import { defaultTodoParams } from './todo.api';
import { todosQueryOptions } from './todo.queries';

export function TodosPage() {
  const [params, setParams] = useTodoParams();
  const search = useDebouncedValue(params.search, 300);
  const queryParams = { ...params, search };
  const { data } = useQuery(todosQueryOptions(queryParams));

  return (
    <div className="linear-layout">
      <a href="#tasks" className="skip-link">
        Skip to tasks
      </a>
      <WorkspaceSidebar
        status={params.status}
        counts={data?.counts}
        onStatusChange={(status) => setParams({ ...params, status, page: 1 })}
      />
      <main id="tasks" tabIndex={-1} className="linear-main">
        <div className="workspace-breadcrumb">
          <ListTodo className="size-4" aria-hidden="true" />
          <span>Personal</span>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-foreground">My tasks</span>
        </div>
        <div className="todo-app">
          <header className="todo-header">
            <div>
              <div className="flex items-center gap-2.5">
                <h1>My tasks</h1>
                {data && (
                  <span className="heading-count">{data.counts.all}</span>
                )}
              </div>
              <p>Manage your tasks and track what’s done.</p>
            </div>
            <Button
              size="sm"
              onClick={() => document.getElementById('todo-title')?.focus()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New task
            </Button>
          </header>
          <CreateTodoForm
            onCreated={() =>
              setParams({ ...defaultTodoParams, limit: params.limit })
            }
          />
          <section aria-label="Tasks">
            <TodoList
              params={params}
              queryParams={queryParams}
              onParamsChange={setParams}
            />
          </section>
        </div>
      </main>
      <Toaster position="bottom-right" closeButton />
    </div>
  );
}
