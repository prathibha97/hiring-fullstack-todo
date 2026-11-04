import { ClipboardList, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { todosQueryOptions } from "./todo.queries";
import { TodoItem } from "./TodoItem";

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
    return (
      <p role="status" className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading your TODOs…
      </p>
    );
  }

  if (isError && !todos) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-destructive">
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
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <ClipboardList className="size-8" aria-hidden="true" />
        <p>No TODOs yet. Add your first task above.</p>
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
