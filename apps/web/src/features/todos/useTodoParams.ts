import { useEffect, useState } from 'react';
import { defaultTodoParams, type TodoListParams } from './todo.api';

export function readTodoParams(search: string): TodoListParams {
  const query = new URLSearchParams(search);
  const page = Number(query.get('page') ?? 1);
  const limit = Number(query.get('limit') ?? 10);
  const status = query.get('status');
  return {
    page: Number.isInteger(page) && page > 0 && page <= 1_000_000 ? page : 1,
    limit: [10, 20, 50].includes(limit) ? limit : 10,
    status: status === 'active' || status === 'completed' ? status : 'all',
    search: (query.get('search') ?? '').slice(0, 200),
  };
}

export function useTodoParams() {
  const [params, setParams] = useState(() =>
    readTodoParams(window.location.search),
  );

  useEffect(() => {
    const handlePopState = () =>
      setParams(readTodoParams(window.location.search));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function updateParams(next: TodoListParams) {
    const url = new URL(window.location.href);
    for (const key of ['page', 'limit', 'status', 'search'] as const) {
      if (next[key] === defaultTodoParams[key]) url.searchParams.delete(key);
      else url.searchParams.set(key, String(next[key]));
    }
    if (url.href !== window.location.href) {
      // Typing replaces the current search entry; page/filter changes are navigable.
      const method =
        next.search !== params.search ? 'replaceState' : 'pushState';
      window.history[method](null, '', url);
    }
    setParams(next);
  }

  return [params, updateParams] as const;
}
