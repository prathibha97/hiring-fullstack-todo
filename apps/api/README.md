# API

Express 5 API using TypeScript and Node ESM. Run commands from the repository root with Node.js 24+ and Yarn 4.17.1.

```sh
yarn install --immutable
cp apps/api/.env.example apps/api/.env
yarn workspace api dev
```

The server defaults to port 4000 and allows browser requests from `http://localhost:3000`. Override `PORT` and `CLIENT_URL` in `apps/api/.env` or the process environment. The port must be an integer from 1 to 65535.

```sh
yarn workspace api lint
yarn workspace api check-types
yarn workspace api build
yarn workspace api start
curl http://localhost:4000/health
```

Root `yarn dev`, `yarn lint`, `yarn check-types`, and `yarn build` include this workspace. `start` runs compiled JavaScript and requires a successful build first.

`app.ts` configures middleware and HTTP routes; `server.ts` owns startup and graceful shutdown. Error middleware returns JSON for malformed JSON, oversized bodies, and unexpected errors without exposing internal details. Unknown routes return JSON 404 responses.

The `/health` endpoint reports HTTP availability only. MongoDB persistence and TODO routes are not implemented yet; no database connection is currently required. MongoDB connection instructions will be added with the persistence implementation.
