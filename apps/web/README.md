# TODO frontend

React + TypeScript frontend built with Vite, Tailwind CSS, shadcn/ui (Base UI), Lucide icons, Sonner notifications, and TanStack Query. It communicates with the separate Express API over HTTP.

## Docker Compose

From the repository root, run `docker compose up --build -d --wait`. Open http://localhost:8080 and Swagger at http://localhost:8080/api/docs/. No environment files are required for this mode. The [root README](../../README.md) covers ports, persistence, logs, and shutdown.

The instructions below run the apps on the host with only MongoDB in Docker. Use `docker compose up -d --wait mongodb` for that mode.

## Requirements and setup

Use Node.js 24+ and Yarn 4.17.1. Start Docker Desktop first. Run these commands from the repository root:

```sh
yarn install --immutable
docker compose up -d --wait mongodb
cp -n apps/api/.env.example apps/api/.env
cp -n apps/web/.env.example apps/web/.env.local
```

Check the API environment file contains:

```dotenv
PORT=4000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27018/hiring_fullstack_todo
```

For the separate local Vite and API servers, the frontend environment file should contain:

```dotenv
VITE_API_URL=http://localhost:4000
```

Start the two apps in separate terminals:

```sh
yarn workspace api dev
```

```sh
yarn workspace web dev
```

Open http://localhost:5173. Vite uses port 5173 and fails clearly if it is occupied instead of silently moving to a port that the API's CORS configuration does not allow. Restart Vite after changing environment variables. An unset or empty `VITE_API_URL` uses same-origin requests, which is the Docker/Nginx mode. Vite embeds this value at build time; changing a running static web container’s environment does not change the built app. Variables prefixed with `VITE_` are public browser configuration; never put credentials in them.

## Usage

- Create a task using the title field; expand Add description for optional details.
- Mark tasks done or pending using their checkbox.
- Edit a task inline; Cancel discards edits.
- Delete using the confirmation dialog; Cancel leaves the task intact.
- Filter All, Active, or Completed from the sidebar or list toolbar; search matches titles and descriptions across all pages.
- Navigate using shadcn pagination, or choose 10, 20, or 50 tasks per page. Search, status, and page-size changes return to the first page. Sidebar counts always cover the full list.
- Search waits 300 ms after typing before requesting results. Filters, page size, search, and page are stored in the URL. Refresh preserves the view; browser Back/Forward restores page and filter changes. Search typing replaces the current history entry.

Titles are trimmed, required, and limited to 200 characters. Descriptions are limited to 2000 characters. The server also validates requests.

## Structure and behavior

`App` composes `TodosPage`, which owns the list view state and combines the workspace sidebar, forms, and results. TODO components remain together in `src/features/todos`; shared UI primitives live in `src/components/ui`. The sidebar lives in `src/components/layout`. Theme styles, workspace layout, TODO styles, and accessibility overrides have separate files.

`src/features/todos/todo.api.ts` owns HTTP requests. `ApiError` retains HTTP status and valid server validation details, with a safe fallback for non-JSON responses. Search and filter controls stay mounted after failures, with Retry and Reset view recovery options. Query options provide stable keys and pass cancellation signals into fetch. TanStack Query caches server data, refreshes active lists after successful mutations, and exposes pending/error states. Components keep form values and UI state locally.

Mutation controls are disabled while requests run. Failed creates and edits preserve entered values; failed deletes keep the dialog open. Toasts provide feedback, and inline messages remain available. A failed background refresh retains previously loaded tasks. Toggle mutations have automatic retries disabled because repeating a toggle reverses the value again.

The Linear-inspired layout switches to a single column on small screens. Controls have accessible labels, keyboard focus styles, a skip link, focus management for inline editing, and larger targets on coarse-pointer devices. CSS transitions respect reduced-motion preferences. The shadcn confirmation dialog traps focus and returns it on cancel.

## Checks

```sh
yarn workspace web build
yarn workspace web lint
yarn workspace web check-types
yarn workspace web format:check
yarn workspace web test
```

The app, tooling, and test code use strict TypeScript checking. The build checks types, undefined names, and unused declarations. ESLint uses Babel’s TypeScript/JSX parser, matching the API’s approach and avoiding the current `typescript-eslint` incompatibility with TypeScript 7. React Hooks and Fast Refresh rules remain enabled. Run both lint and build; they cover different checks.

Frontend tests use Vitest, jsdom, and Testing Library with mocked HTTP responses; they do not need MongoDB. They cover form validation, failure recovery, completion/deletion, API errors, URL navigation, search, and pagination. Use `yarn workspace web test:watch` while developing. Run `yarn workspace web format` to apply the frontend formatting convention.

The root test command runs both frontend and backend suites; backend tests require Docker MongoDB:

```sh
yarn test
```

## Assumptions and limitations

This assessment has one shared task list with no sign-in or per-user ownership. Search, status filtering, and pagination happen on the server. Previous results remain visible while the next page loads, with task actions temporarily disabled. Creating a task returns to the first page of All tasks; deleting the last item on a page returns the last available page. Mutations refresh from the server rather than optimistically updating the list. A network failure can occur after a server has applied an operation; refresh before retrying an uncertain create or toggle. API response types are declared in TypeScript, not validated at runtime in the browser. Component tests run in jsdom; real browser layout and accessibility still need manual verification.

API documentation: http://localhost:4000/api/docs/.
