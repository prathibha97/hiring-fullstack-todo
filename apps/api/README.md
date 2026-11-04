# TODO API

Express 5 REST API with MongoDB persistence, Mongoose models, Zod validation, and generated OpenAPI documentation. The API uses TypeScript and Node ESM.

## Requirements

- Node.js 24 or newer
- Yarn 4.17.1
- Docker with Docker Compose (Docker Desktop on macOS)

## Setup

Run these commands from the repository root:

```sh
yarn install --immutable
cp -n apps/api/.env.example apps/api/.env
docker compose up -d --wait
yarn workspace api dev
```

If `.env` already exists, check its values instead of replacing it:

```dotenv
PORT=4000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27018/hiring_fullstack_todo
```

The port must be an integer from 1 to 65535. `CLIENT_URL` is the browser origin allowed by CORS. Keep local `.env` files untracked.

MongoDB is exposed only on this Mac at port 27018, avoiding conflicts with a local MongoDB installation. The Compose named volume retains data across container restarts. Run `docker compose down` to stop MongoDB while retaining its data. The database appears after the first write.

The API connects to MongoDB before accepting HTTP requests. If initial database selection fails after five seconds, startup fails. On SIGINT or SIGTERM, it drains HTTP requests and disconnects MongoDB; shutdown has a ten-second deadline.

## Endpoints

| Method | Path                  | Behavior                      |
| ------ | --------------------- | ----------------------------- |
| GET    | `/api/todos`          | List TODOs, newest first      |
| POST   | `/api/todos`          | Create a TODO                 |
| PUT    | `/api/todos/:id`      | Edit title and/or description |
| PATCH  | `/api/todos/:id/done` | Atomically toggle done        |
| DELETE | `/api/todos/:id`      | Delete a TODO                 |

Creation returns 201 with `{ todo }`; update and toggle return 200 with `{ todo }`. Listing returns 200 with `{ todos }`. Deletion returns 204 without a body. Invalid input returns 400, missing TODOs return 404, oversized bodies return 413, and unexpected failures return a generic JSON 500 response.

- Swagger UI: http://localhost:4000/api/docs/
- OpenAPI JSON: http://localhost:4000/api/openapi.json
- HTTP health: http://localhost:4000/health

## Validation and behavior

A title is required, trimmed, and limited to 200 characters. Descriptions are optional, trimmed, limited to 2000 characters, and default to an empty string. New TODOs start with `done: false`. Create/update requests reject unknown fields.

PUT accepts either editable field and preserves omitted fields; an empty description clears it. At least one field is required. PATCH toggles the stored boolean without a request body; repeating a request toggles it again. There is no automatic retry protection.

## Checks and tests

Start Docker MongoDB before running integration tests:

```sh
docker compose up -d --wait
yarn workspace api lint
yarn workspace api check-types
yarn workspace api build
yarn test
```

`yarn test` runs API tests through Turbo with caching disabled. `yarn workspace api test` runs the same suite directly; `yarn workspace api test:watch` watches for changes. Tests cover validation, controller error responses, and database CRUD, including concurrent toggles.

Integration tests use MongoDB at `mongodb://127.0.0.1:27018` by default. To use a different test server:

```sh
MONGODB_TEST_URI=mongodb://127.0.0.1:27018 yarn test
```

Each integration run selects a unique `todo_test_...` database, overriding any database name in the URI, and deletes its records afterward. It does not use `MONGODB_URI` or the development database. The random test database may remain with an empty collection.

For a compiled production run:

```sh
yarn workspace api build
yarn workspace api start
```

## Structure and limitations

Controllers handle HTTP input and responses; services call repositories; repositories own Mongoose queries. `app.ts` configures Express without opening a port, while `server.ts` manages startup and shutdown. Documentation reuses request validators and declares separate response schemas.

This assessment API has no authentication, authorization, pagination, or rate limiting. All TODOs are shared. `/health` reports HTTP availability, not ongoing database readiness. The local Compose database has no authentication and is bound to loopback for development. Request bodies are limited to 100 KB.
