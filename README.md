# Full-stack TODO assessment

React/Vite frontend and Express API in a Yarn/Turborepo monorepo, backed by MongoDB. Tasks support creation, editing, deletion, done toggling, server-side search/filtering, and pagination.

## Run with Docker Compose

Install Docker Desktop (or Docker Engine with the Compose plugin), start Docker, and run from the repository root:

```sh
docker compose up --build -d --wait
```

No local Node.js, Yarn, or environment files are required. The first build downloads dependencies and takes longer than subsequent builds.

- App: http://localhost:8080
- Swagger UI: http://localhost:8080/api/docs/
- OpenAPI JSON: http://localhost:8080/api/openapi.json
- Direct API: http://localhost:4000/api/todos

Nginx serves the built React app and proxies `/api` to Express over the Compose network. Express connects to `mongodb:27017`. MongoDB must become healthy before the API starts, and the API must become healthy before Nginx starts. The API runs as the non-root Node user with production dependencies. Images use separate build and runtime stages; local environment files, dependencies, and build outputs are excluded from the build context.

The frontend uses the API through Nginx. The API is also published on loopback port 4000 for direct testing. MongoDB remains bound to loopback at port 27018 for local development and integration tests. Data is retained in the existing `mongodb_data` named volume.

```sh
docker compose ps
docker compose logs -f api
docker compose down
```

Stopping the stack retains task data. `docker compose down -v` permanently removes the database volume and its tasks; use it only when intentionally resetting the app.

If a port is occupied, override it when starting the stack:

```sh
WEB_PORT=8081 MONGODB_PORT=27019 docker compose up --build -d --wait
```

Use the same overrides for subsequent Compose commands. The app and Swagger then use port 8081. The direct API port remains 4000; stop a host API server before starting the full Compose stack, or change the API port mapping if that port is occupied. Use `MONGODB_TEST_URI=mongodb://127.0.0.1:27019 yarn test` if running integration tests against the alternate MongoDB port.

Containers run compiled builds without source mounts or hot reload. Rebuild after source changes. The frontend uses same-origin API requests in Docker, so no browser-visible container hostname or Vite URL configuration is needed. Local `.env` files are not read by the container images; Compose supplies the API configuration directly.

## Local development

Use Node.js 24+ and Yarn 4.17.1. Start only MongoDB in Docker:

```sh
yarn install --immutable
cp -n apps/api/.env.example apps/api/.env
cp -n apps/web/.env.example apps/web/.env.local
docker compose up -d --wait mongodb
```

Start the API and frontend in separate terminals:

```sh
yarn workspace api dev
```

```sh
yarn workspace web dev
```

App: http://localhost:5173. API/Swagger: http://localhost:4000/api/docs/. See the app READMEs for environment settings and behavior.

## Checks

With Docker MongoDB running:

```sh
yarn lint
yarn check-types
yarn test
yarn build
yarn workspace web format:check
```

Frontend tests use Vitest, Testing Library, and jsdom. Backend tests cover validation, HTTP behavior, and real MongoDB integration in a unique test database. Tests do not modify development tasks.

## Continuous integration

GitHub Actions runs on pushes to `develop` and `main`, pull requests targeting either branch, and manual dispatch. The first job installs the locked dependencies, runs lint, strict type checks, frontend formatting, all tests against Docker MongoDB, and workspace builds. The second job builds and starts the full Compose stack, then checks the app assets, Swagger/OpenAPI, and TODO operations through Nginx. Both jobs clean up their temporary containers and volumes. They currently use the Ubuntu 22.04 runner because MongoDB 8.0 rejects newer kernels used by `ubuntu-latest`; see [MongoDB’s kernel compatibility notice](https://www.mongodb.com/docs/v8.0/release-notes/8.0/). Revisit this runner pin when MongoDB supports the newer hosted runner kernel. No repository secrets, image publishing, or deployment are configured.

To run the container smoke check locally after starting Compose:

```sh
node scripts/smoke-test.mjs
```

For a different web port, use `SMOKE_BASE_URL=http://localhost:8081 node scripts/smoke-test.mjs`. The script creates uniquely named tasks and removes only those tasks afterward. It checks HTTP integration, not browser rendering.

## Structure

- `apps/web`: React, TypeScript, Tailwind, shadcn/ui, TanStack Query, and Sonner. Feature components and HTTP/query logic live together under `src/features/todos`.
- `apps/api`: Express, Zod validators, controllers, services, repositories, and Mongoose models. OpenAPI is generated from Zod schemas.
- `packages`: shared ESLint/TypeScript configuration and the shared UI workspace.

## Recordings

- [Product demo](https://drive.google.com/file/d/1RmUNzDG7jXJavbMqt-kddddYLZPQBUyQ/view?usp=sharing)
- [Code and architecture walkthrough](https://drive.google.com/file/d/1HBqJGxZjBmvb1jV6HNtPGX8MHcP2EFKh/view?usp=sharing)

## Assumptions and limitations

The app has one shared task list without authentication. The Compose setup is intended for local assessment review; MongoDB has no authentication and host ports bind to loopback. Health checks confirm HTTP availability after initial database connection, not ongoing database readiness. There is no TLS deployment configuration.
