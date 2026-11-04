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
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { EditTodoForm } from "./EditTodoForm";
import { deleteTodo, toggleTodoDone, type Todo } from "./todo.api";
import { todoKeys } from "./todo.queries";

type TodoItemProps = {
  todo: Todo;
};

export function TodoItem({ todo }: TodoItemProps) {
  const editButtonRef = useRef<HTMLButtonElement>(null);
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

  function closeEditor() {
    setIsEditing(false);
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  if (isEditing) {
    return (
      <li className="task-row task-row-editing">
        <EditTodoForm todo={todo} onClose={closeEditor} />
      </li>
    );
  }

  return (
    <li className={`task-row ${todo.done ? "task-row-completed" : ""}`}>
      <div className="task-row-main">
        <input
          type="checkbox"
          className="task-checkbox"
          checked={todo.done}
          disabled={isBusy}
          onChange={() => toggleMutation.mutate(todo._id)}
          aria-label={`Mark ${todo.title} as ${todo.done ? "pending" : "done"}`}
        />
        <div className="min-w-0 flex-1">
          <h2
            className={`task-title ${todo.done ? "line-through text-muted-foreground" : ""}`}
          >
            {todo.title}
          </h2>
          {todo.description && (
            <p className="task-description">{todo.description}</p>
          )}
        </div>
        <time
          className="task-date"
          dateTime={todo.createdAt}
          title={`Created ${new Date(todo.createdAt).toLocaleString()}`}
        >
          {new Date(todo.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </time>
        <div className="task-actions">
          {toggleMutation.isPending && (
            <Loader2
              className="size-3.5 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isBusy}
            ref={editButtonRef}
            aria-label={`Edit ${todo.title}`}
            title="Edit task"
            onClick={() => {
              toggleMutation.reset();
              deleteMutation.reset();
              setIsEditing(true);
            }}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
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
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="task-delete"
                />
              }
              aria-label={`Delete ${todo.title}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="sr-only">Delete</span>
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
        <p role="alert" className="mt-2 pl-7 text-xs text-destructive">
          {toggleMutation.error?.message}
        </p>
      )}
    </li>
  );
}
