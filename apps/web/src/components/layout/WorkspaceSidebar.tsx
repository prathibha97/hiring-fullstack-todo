import { Circle, CircleCheck, Layers2, ListTodo } from 'lucide-react';
import type { TodoListParams, TodoPage } from '@/features/todos/todo.api';

type Props = {
  status: TodoListParams['status'];
  counts?: TodoPage['counts'];
  onStatusChange: (status: TodoListParams['status']) => void;
};

export function WorkspaceSidebar({ status, counts, onStatusChange }: Props) {
  const views = [
    {
      value: 'all' as const,
      label: 'All tasks',
      icon: ListTodo,
      count: counts?.all,
    },
    {
      value: 'active' as const,
      label: 'Active',
      icon: Circle,
      count: counts?.active,
    },
    {
      value: 'completed' as const,
      label: 'Completed',
      icon: CircleCheck,
      count: counts?.completed,
    },
  ];

  return (
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
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{label}</span>
            <span className="view-count">{count ?? '—'}</span>
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
  );
}
