import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:8080";
const marker = `ci-smoke-${randomUUID()}`;
const createdIds = new Set();

async function request(path, { method = "GET", body, status = 200 } = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, status, `${method} ${path}: unexpected status`);
  return response;
}

try {
  const html = await (await request("/")).text();
  assert.match(html, /id="root"/);
  const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/)?.[1];
  assert.ok(asset, "The app should reference a built JavaScript asset");
  await request(asset);
  assert.match(await (await request("/api/docs/")).text(), /swagger-ui/i);
  const spec = await (await request("/api/openapi.json")).json();
  assert.equal(spec.openapi, "3.0.3");
  assert.ok(spec.paths["/api/todos"]);

  for (const title of [`${marker} first`, `${marker} second`]) {
    const { todo } = await (
      await request("/api/todos", {
        method: "POST",
        body: { title },
        status: 201,
      })
    ).json();
    createdIds.add(todo._id);
  }
  const [id] = createdIds;
  const page = await (
    await request(`/api/todos?search=${marker}&limit=1&page=2`)
  ).json();
  assert.equal(page.todos.length, 1);
  assert.equal(page.pagination.total, 2);
  assert.equal(page.pagination.page, 2);

  const updated = await (
    await request(`/api/todos/${id}`, {
      method: "PUT",
      body: { title: `${marker} updated`, description: "Compose smoke check" },
    })
  ).json();
  assert.equal(updated.todo.title, `${marker} updated`);
  const toggled = await (
    await request(`/api/todos/${id}/done`, { method: "PATCH" })
  ).json();
  assert.equal(toggled.todo.done, true);
  const completed = await (
    await request(`/api/todos?search=${marker}&status=completed`)
  ).json();
  assert.equal(completed.pagination.total, 1);
  assert.equal(completed.todos[0]._id, id);
  await request(`/api/todos/${id}`, { method: "DELETE", status: 204 });
  createdIds.delete(id);
  const remaining = await (await request(`/api/todos?search=${marker}`)).json();
  assert.equal(remaining.pagination.total, 1);
  console.log(
    "Smoke test passed: app assets, Swagger/OpenAPI, CRUD, toggle, search, and pagination.",
  );
} finally {
  // Only remove records created by this invocation, including after a failed assertion.
  for (const id of createdIds) {
    await request(`/api/todos/${id}`, { method: "DELETE", status: 204 });
  }
}
