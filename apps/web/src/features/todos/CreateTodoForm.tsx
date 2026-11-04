import { Plus, Loader2, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createTodo } from "./todo.api";
import { todoKeys } from "./todo.queries";

export function CreateTodoForm() {
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createTodo,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async () => {
      toast.success("TODO added");
      setTitle("");
      setDescription("");
      setDescriptionOpen(false);

      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  useEffect(() => {
    if (mutation.isError) titleRef.current?.focus();
  }, [mutation.isError]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError("Title is required");
      titleRef.current?.focus();
      return;
    }

    setTitleError(null);

    mutation.mutate({
      title: trimmedTitle,
      description: description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="task-composer">
      <fieldset disabled={mutation.isPending}>
        <legend className="sr-only">Add a task</legend>
        <p className="composer-label">New task</p>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="todo-title" className="sr-only">
              Task title
            </label>
            <Input
              ref={titleRef}
              id="todo-title"
              placeholder="Add a task…"
              className="h-10"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setTitleError(null);
              }}
              required
              maxLength={200}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? "todo-title-error" : undefined}
            />
          </div>
          <Button type="submit" className="h-10 px-4">
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {mutation.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
        {titleError && (
          <p
            id="todo-title-error"
            role="alert"
            className="mt-2 text-sm text-destructive"
          >
            {titleError}
          </p>
        )}
        <button
          type="button"
          className="description-toggle"
          onClick={() => setDescriptionOpen((open) => !open)}
          aria-expanded={descriptionOpen}
          aria-controls="task-description-field"
        >
          <AlignLeft className="size-3.5" aria-hidden="true" />
          {descriptionOpen
            ? "Hide description"
            : description
              ? "Edit description"
              : "Add description"}
        </button>
        <div
          id="task-description-field"
          className="description-field"
          hidden={!descriptionOpen}
        >
          <label
            htmlFor="todo-description"
            className="mb-2 block text-xs text-muted-foreground"
          >
            Description
          </label>
          <Textarea
            id="todo-description"
            placeholder="Optional details"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={2}
            className="resize-y"
          />
        </div>
        {mutation.isError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}
      </fieldset>
    </form>
  );
}
