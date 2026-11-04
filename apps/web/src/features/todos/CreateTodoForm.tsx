import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { createTodo } from "./todo.api";
import { todoKeys } from "./todo.queries";

export function CreateTodoForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createTodo,
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("TODO added");
      setTitle("");
      setDescription("");

      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mutation.isPending) return;

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError("Title is required");
      return;
    }

    setTitleError(null);

    mutation.mutate({
      title: trimmedTitle,
      description: description.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4">
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <legend className="mb-4 font-medium">Add a TODO</legend>

        <div className="space-y-2">
          <label htmlFor="todo-title" className="text-sm font-medium">
            Title
          </label>
          <Input
            id="todo-title"
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
          {titleError && (
            <p
              id="todo-title-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="todo-description" className="text-sm font-medium">
            Description (optional)
          </label>
          <Textarea
            id="todo-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={3}
          />
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}

        <Button type="submit">
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {mutation.isPending ? "Adding…" : "Add TODO"}
        </Button>
      </fieldset>
    </form>
  );
}
