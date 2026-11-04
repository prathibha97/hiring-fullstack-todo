import { useState } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { todosQueryOptions } from "./todo.queries";
import { TodoItem } from "./TodoItem";

export type Filter = "all" | "active" | "completed";

export function TodoList({
  filter,
  onFilterChange,
}: {
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}) {
  const [search, setSearch] = useState("");
  const {
    data: todos,
    error,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(todosQueryOptions());

  if (isPending)
    return (
      <p
        role="status"
        className="flex items-center gap-2 py-8 text-sm text-muted-foreground"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading tasks…
      </p>
    );
  if (isError && !todos)
    return (
      <div className="space-y-3 py-8">
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
        <Button
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RotateCcw
            className={`size-4 ${isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isFetching ? "Retrying…" : "Try again"}
        </Button>
      </div>
    );

  const completed = todos.filter((todo) => todo.done).length;
  const query = search.trim().toLowerCase();
  const visibleTodos = todos.filter(
    (todo) =>
      (filter === "all" || (filter === "completed" ? todo.done : !todo.done)) &&
      `${todo.title} ${todo.description}`.toLowerCase().includes(query),
  );
  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: todos.length },
    { value: "active", label: "Active", count: todos.length - completed },
    { value: "completed", label: "Completed", count: completed },
  ];

  return (
    <div>
      <div className="task-toolbar">
        <div className="task-filters" role="group" aria-label="Filter tasks">
          {filters.map(({ value, label, count }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              className="task-filter"
              onClick={() => onFilterChange(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <div className="task-search">
          <Search
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search tasks"
            placeholder="Search"
            className="h-8 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      {isError && (
        <p role="alert" className="my-3 text-sm text-destructive">
          Couldn’t refresh tasks.{" "}
          <button
            className="underline underline-offset-4"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Retry
          </button>
        </p>
      )}
      {visibleTodos.length === 0 ? (
        <div className="empty-tasks">
          <p>
            {query
              ? "No matching tasks."
              : todos.length === 0
                ? "No tasks yet."
                : filter === "active"
                  ? "No active tasks."
                  : "No completed tasks."}
          </p>
          {(query || filter !== "all") && (
            <button
              type="button"
              className="mt-2 text-xs underline underline-offset-4"
              onClick={() => {
                setSearch("");
                onFilterChange("all");
              }}
            >
              Show all tasks
            </button>
          )}
        </div>
      ) : (
        <ul className="task-list">
          {visibleTodos.map((todo) => (
            <TodoItem key={todo._id} todo={todo} />
          ))}
        </ul>
      )}
      <p className="task-summary" role="status">
        {todos.length - completed} active<span aria-hidden="true"> · </span>
        {completed} completed{query && ` · ${visibleTodos.length} matching`}
      </p>
    </div>
  );
}
