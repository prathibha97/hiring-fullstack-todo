import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Undo2, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EditTodoForm } from "./EditTodoForm";
import { deleteTodo, toggleTodoDone, type Todo } from "./todo.api";
import { todoKeys } from "./todo.queries";

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: toggleTodoDone,
    retry: false,
    onError: (error) => toast.error(error.message),
    onSuccess: async (updatedTodo) => {
      toast.success(
        updatedTodo.done ? "TODO completed" : "TODO marked pending",
      );
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    retry: false,
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      setDeleteOpen(false);
      toast.success("TODO deleted");
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  const isBusy = toggleMutation.isPending || deleteMutation.isPending;

  function handleDelete() {
    if (isBusy) return;
    deleteMutation.mutate(todo._id);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border bg-card p-4">
        <EditTodoForm todo={todo} onClose={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    <li className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h2
            className={`wrap-break-words font-medium ${
              todo.done ? "text-muted-foreground line-through" : ""
            }`}
          >
            {todo.title}
          </h2>

          {todo.description && (
            <p className="whitespace-pre-wrap wrap-break-words text-sm text-muted-foreground">
              {todo.description}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            aria-pressed={todo.done}
            aria-label={`Mark ${todo.title} as ${
              todo.done ? "pending" : "done"
            }`}
            onClick={() => toggleMutation.mutate(todo._id)}
          >
            {toggleMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : todo.done ? (
              <Undo2 className="size-4" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            {toggleMutation.isPending
              ? "Saving…"
              : todo.done
                ? "Mark pending"
                : "Mark done"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            aria-label={`Edit ${todo.title}`}
            onClick={() => {
              toggleMutation.reset();
              deleteMutation.reset();
              setIsEditing(true);
            }}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>

          <AlertDialog
            open={deleteOpen}
            onOpenChange={(open) => {
              if (deleteMutation.isPending) return;
              if (open) deleteMutation.reset();
              setDeleteOpen(open);
            }}
          >
            <AlertDialogTrigger
              disabled={isBusy}
              render={<Button variant="destructive" size="sm" />}
              aria-label={`Delete ${todo.title}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete TODO?</AlertDialogTitle>
                <AlertDialogDescription className="break-words">
                  This will permanently delete “{todo.title}”. You cannot undo
                  this action.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {deleteMutation.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {deleteMutation.error.message}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isBusy}
                  onClick={handleDelete}
                >
                  {deleteMutation.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                  {deleteMutation.isPending ? "Deleting…" : "Delete TODO"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {toggleMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {toggleMutation.error?.message}
        </p>
      )}
    </li>
  );
}
