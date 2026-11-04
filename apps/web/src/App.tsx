import { Toaster } from "@/components/ui/sonner";
import { ListTodo } from "lucide-react";
import { CreateTodoForm } from "./features/todos/CreateTodoForm";
import { TodoList } from "./features/todos/TodoList";

function App() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <ListTodo className="size-7" aria-hidden="true" />
          My TODOs
        </h1>
        <p className="text-muted-foreground">
          Keep track of what needs to get done.
        </p>
      </header>

      <CreateTodoForm />
      <TodoList />
      <Toaster position="bottom-right" richColors closeButton />
    </main>
  );
}

export default App;
