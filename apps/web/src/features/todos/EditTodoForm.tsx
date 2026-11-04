import { Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updateTodo, type Todo } from './todo.api';
import { todoKeys } from './todo.queries';

type EditTodoFormProps = {
  todo: Todo;
  onClose: () => void;
};

export function EditTodoForm({ todo, onClose }: EditTodoFormProps) {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [titleError, setTitleError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: { title: string; description: string }) =>
      updateTodo(todo._id, input),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async () => {
      toast.success('TODO updated');
      await queryClient.invalidateQueries({
        queryKey: todoKeys.all,
      });

      onClose();
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
      setTitleError('Title is required');
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
    <form onSubmit={handleSubmit} className="edit-form">
      <fieldset disabled={mutation.isPending} className="space-y-4">
        <legend className="mb-4 font-medium">Edit TODO</legend>

        <div className="space-y-2">
          <label htmlFor={`${id}-title`} className="text-sm font-medium">
            Title
          </label>
          <Input
            ref={titleRef}
            id={`${id}-title`}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(null);
            }}
            required
            maxLength={200}
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? `${id}-title-error` : undefined}
          />
          {titleError && (
            <p
              id={`${id}-title-error`}
              role="alert"
              className="text-sm text-destructive"
            >
              {titleError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={`${id}-description`} className="text-sm font-medium">
            Description (optional)
          </label>
          <Textarea
            id={`${id}-description`}
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

        <div className="flex gap-2">
          <Button type="submit">
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="size-4" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
