import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers2,
  ListTodo,
  Circle,
  CircleCheck,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { CreateTodoForm } from "./features/todos/CreateTodoForm";
import { TodoList, type Filter } from "./features/todos/TodoList";
import { todosQueryOptions } from "./features/todos/todo.queries";

export default function App() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: todos } = useQuery(todosQueryOptions());
  const completed = todos?.filter((todo) => todo.done).length ?? 0;
  const views = [
    {
      value: "all" as const,
      label: "All tasks",
      icon: ListTodo,
      count: todos?.length,
    },
    {
      value: "active" as const,
      label: "Active",
      icon: Circle,
      count: todos ? todos.length - completed : undefined,
    },
    {
      value: "completed" as const,
      label: "Completed",
      icon: CircleCheck,
      count: todos ? completed : undefined,
    },
  ];

  return (
    <div className="linear-layout">
      <a href="#tasks" className="skip-link">
        Skip to tasks
      </a>
      <aside className="linear-sidebar" aria-label="Workspace">
        <a href="#tasks" className="workspace-name">
          <span className="workspace-symbol">
            <Layers2 className="size-4" aria-hidden="true" />
          </span>
          Personal
        </a>
        <p className="sidebar-label">Workspace</p>
        <nav aria-label="Task views" className="sidebar-views">
          {views.map(({ value, label, icon: Icon, count }) => (
            <button
              type="button"
              key={value}
              className="sidebar-view"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
              <span className="view-count">{count ?? "—"}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="workspace-avatar" aria-hidden="true">
            P
          </span>
          <div>
            <p>Personal workspace</p>
            <span>TODOs</span>
          </div>
        </div>
      </aside>
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
                {todos && <span className="heading-count">{todos.length}</span>}
              </div>
              <p>Manage your tasks and track what’s done.</p>
            </div>
            <Button
              size="sm"
              onClick={() => document.getElementById("todo-title")?.focus()}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              New task
            </Button>
          </header>
          <CreateTodoForm />
          <section aria-label="Tasks">
            <TodoList filter={filter} onFilterChange={setFilter} />
          </section>
        </div>
      </main>
      <Toaster position="bottom-right" closeButton />
    </div>
  );
}
