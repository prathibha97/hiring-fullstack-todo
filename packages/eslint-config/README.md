# `@repo/eslint-config`

Shared ESLint configurations used by repository workspaces. The API imports `./base`, and the shared UI workspace imports `./react-internal`. The Vite frontend maintains its own configuration for React Hooks and Fast Refresh.

The base configuration uses Babel to parse TypeScript syntax. TypeScript checks undefined names and unused declarations separately; run both lint and type checks. The base configuration currently reports rule violations as warnings, while the API lint command rejects warnings with `--max-warnings 0`.
