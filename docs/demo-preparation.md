# Demo and submission preparation

## Before recording

1. Rehearse the product demo once without recording. Use your own explanation and be ready to explain every implementation choice you show.
2. Start Docker Desktop and run `docker compose up --build -d --wait` from the repository root. Confirm `docker compose ps` reports all three services as healthy.
3. Open **http://localhost:8080** explicitly with HTTP. This local stack does not serve HTTPS. Open Swagger in a second tab at **http://localhost:8080/api/docs/**.
4. Use fictional demo tasks. Have at least 11 tasks available if showing pagination at 10 per page. Add them through the UI before recording; do not reset a database that contains tasks you need.
5. Use a readable browser zoom and editor font. Close unrelated tabs and terminals, hide notifications, and check the microphone. Keep credentials and local environment files off screen.
6. Run the local checks or confirm a green hosted CI run for the commit being demonstrated. Do not describe an unrun hosted workflow as passing.

## Product demo — about two minutes

| Time      | Action                                                                                                       | Point to explain                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| 0:00–0:15 | Show the running app and briefly show the Compose startup command.                                           | An evaluator can start the full stack with one command.                         |
| 0:15–0:40 | Add “Prepare assessment demo” with a description. Edit its title, then clear its description and save.       | Required title, optional description, and persisted editing.                    |
| 0:40–0:55 | Mark the task complete, view Completed, and mark it pending again.                                           | The server stores completion state; the filters update after mutations.         |
| 0:55–1:15 | Search for a task previously on another page. Clear the search, move to page two, then change the page size. | Search and pagination happen on the server. Sidebar counts cover the full list. |
| 1:15–1:30 | Reload the page. Optionally show Back restoring a page or filter change.                                     | Tasks persist in MongoDB; view settings live in the URL.                        |
| 1:30–1:45 | Open Delete, cancel once, then confirm deletion of your demo task.                                           | Confirmation prevents accidental deletion.                                      |
| 1:45–2:00 | Briefly show a narrow browser window and Swagger.                                                            | Responsive layout and discoverable API documentation.                           |

Do not spend the recording waiting for image builds. Start the stack before recording. If a failure occurs, explain it honestly rather than describing a different result.

## Code walkthrough — five minutes

Use these as prompts, rather than reading a script word for word. Open the relevant files ahead of time.

### 0:00–0:35 — Repository and runtime

Show `apps/web`, `apps/api`, and `compose.yaml`. Explain that React/Vite is built to static files, Nginx serves them and proxies `/api`, Express handles requests, and MongoDB persists tasks. Containers use service names internally; the browser uses one local origin. Mention the separate local development mode.

### 0:35–1:35 — Backend request flow

Trace one create request through `routes/todo.routes.ts`, `controllers/todo.controller.ts`, `validators/todo.validator.ts`, `services/todo.service.ts`, `repositories/todo.repository.ts`, and `models/todo.model.ts` under `apps/api/src`.

Explain the responsibility of each boundary, title/description validation, consistent JSON errors, and why create/update cannot set arbitrary fields. The service layer is intentionally small in this assessment. Show the atomic database toggle and explain why an automatic retry could reverse the state again.

### 1:35–2:10 — Listing and persistence

Show the repository's search/status filter, stable ordering by creation time and ID, page metadata, and global counts. Explain that page requests beyond the last page are clamped after deletion. Mention that offset pagination and regex search are practical for this scope, but a larger dataset would need different pagination/search strategies.

### 2:10–3:20 — Frontend state and interactions

Show `TodosPage.tsx`, `todo.api.ts`, `todo.queries.ts`, and `useTodoParams.ts` under `apps/web/src/features/todos`.

Explain server state in TanStack Query versus local form state. Query keys include list parameters; successful mutations invalidate all list variations. Fetch requests support cancellation, search waits 300 ms, and URL state survives refresh/history navigation. Previous data stays visible during page changes, with stale task actions disabled. Explain why mutations refresh server data rather than optimistically updating several paginated caches.

Show one form's pending/error handling and the delete dialog. Mention preserved drafts, focus handling, accessible labels, reduced motion, and the separation of feature components from shared UI primitives.

### 3:20–4:15 — Tests and CI

Show the backend tests and the frontend interaction tests. Explain the real MongoDB test database isolation, mocked frontend HTTP responses, and coverage of validation, failed requests, confirmation, and page/search behavior.

Show `.github/workflows/ci.yml`: immutable install, lint/types/formatting, tests, builds, then the Compose smoke check. Show the latest hosted run only after it has actually completed successfully. Explain that the smoke check verifies HTTP integration while component tests verify UI behavior; neither replaces a real browser accessibility/layout review.

### 4:15–5:00 — Documentation and tradeoffs

Show the README startup command, Swagger, and the Docker build/runtime stages. Explain the non-root API runtime, production-only API dependencies, dependency health checks, and volume persistence.

Close with the deliberate limits: one shared list without authentication, local HTTP rather than TLS deployment, offset pagination, regex search, no optimistic mutations, and HTTP health checks that do not continuously verify database readiness. State what you would prioritize next based on real product requirements.

## Final verification

From the repository root, with Docker running:

```sh
yarn install --immutable
yarn lint
yarn check-types
yarn workspace web format:check
docker compose up -d --wait mongodb
yarn test
yarn build
docker compose up --build -d --wait
node scripts/smoke-test.mjs
```

The Node/Yarn checks need the documented local tooling; running the app in Compose does not. The smoke check creates and removes only its own uniquely named tasks. Use `docker compose down` to stop the stack and retain your demo tasks. Do not use `down -v` unless you intend to remove the database volume.

## Submission checklist

- [ ] Review the original assessment document against the final implementation, including any details not reproduced in the README.
- [ ] Review the diff and ensure `.env` files, credentials, generated dependencies, and build outputs are untracked.
- [ ] Commit and push the final work on `develop`.
- [ ] Confirm both GitHub Actions jobs pass for the submitted commit.
- [ ] Record the product demo and five-minute code walkthrough.
- [ ] Check that each recording link works for someone who is not signed in to your account.
- [ ] Open the `develop` → `main` PR and complete its template with the implementation rationale, validation, limitations, and recording links.
- [ ] Confirm the repository visibility and submission contents match the assessment instructions.
- [ ] Submit the PR/repository and recordings through the assessment submission form.

The recording, publishing of links, PR creation, and official submission are still your final steps. CI is implemented locally; a hosted green run requires pushing the workflow.
