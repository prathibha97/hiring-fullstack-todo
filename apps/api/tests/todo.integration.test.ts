import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { TodoModel } from '../src/models/todo.model.js';

const databaseName = `todo_test_${randomUUID().replaceAll('-', '')}`;

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGODB_TEST_URI ?? 'mongodb://127.0.0.1:27018',
    {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    },
  );
}, 10_000);

beforeEach(async () => {
  await TodoModel.deleteMany({});
});

afterAll(async () => {
  try {
    if (
      mongoose.connection.readyState === 1 &&
      mongoose.connection.name === databaseName
    ) {
      await TodoModel.deleteMany({});
    }
  } finally {
    await mongoose.disconnect();
  }
}, 10_000);

async function createTodo() {
  const response = await request(app).post('/api/todos').send({
    title: 'Buy milk',
    description: 'For breakfast',
  });

  expect(response.status).toBe(201);

  return response.body.todo;
}

it('creates a TODO, persists it, and includes it in the list', async () => {
  const created = await request(app).post('/api/todos').send({
    title: '  Buy milk  ',
    description: 'For breakfast',
  });

  expect(created.status).toBe(201);
  expect(created.body.todo).toMatchObject({
    _id: expect.any(String),
    title: 'Buy milk',
    description: 'For breakfast',
    done: false,
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  });

  const saved = await TodoModel.findById(created.body.todo._id).lean();

  expect(saved).toMatchObject({
    title: 'Buy milk',
    description: 'For breakfast',
    done: false,
  });

  const listed = await request(app).get('/api/todos');

  expect(listed.status).toBe(200);
  expect(listed.body.todos).toHaveLength(1);
  expect(listed.body.todos[0]).toMatchObject({
    _id: created.body.todo._id,
    title: 'Buy milk',
    done: false,
  });
});

it('updates the title without changing other fields', async () => {
  const todo = await createTodo();

  const response = await request(app)
    .put(`/api/todos/${todo._id}`)
    .send({ title: 'Buy oat milk' });

  expect(response.status).toBe(200);
  expect(response.body.todo).toMatchObject({
    _id: todo._id,
    title: 'Buy oat milk',
    description: 'For breakfast',
    done: false,
  });

  const saved = await TodoModel.findById(todo._id).lean();

  expect(saved).toMatchObject({
    title: 'Buy oat milk',
    description: 'For breakfast',
    done: false,
  });
});

it('allows clearing the description', async () => {
  const todo = await createTodo();

  const response = await request(app)
    .put(`/api/todos/${todo._id}`)
    .send({ description: '' });

  expect(response.status).toBe(200);
  expect(response.body.todo).toMatchObject({
    _id: todo._id,
    title: 'Buy milk',
    description: '',
    done: false,
  });

  const saved = await TodoModel.findById(todo._id).lean();

  expect(saved).toMatchObject({
    title: 'Buy milk',
    description: '',
    done: false,
  });
});

it('toggles done and then restores its original value', async () => {
  const todo = await createTodo();

  const first = await request(app).patch(`/api/todos/${todo._id}/done`);

  expect(first.status).toBe(200);
  expect(first.body.todo.done).toBe(true);

  const second = await request(app).patch(`/api/todos/${todo._id}/done`);

  expect(second.status).toBe(200);
  expect(second.body.todo.done).toBe(false);

  const saved = await TodoModel.findById(todo._id).lean();

  expect(saved).not.toBeNull();
  expect(saved?.done).toBe(false);
});

it('preserves both concurrent toggles', async () => {
  const todo = await createTodo();

  const responses = await Promise.all([
    request(app).patch(`/api/todos/${todo._id}/done`),
    request(app).patch(`/api/todos/${todo._id}/done`),
  ]);

  for (const response of responses) {
    expect(response.status).toBe(200);
  }

  expect(responses.map((response) => response.body.todo.done).sort()).toEqual([
    false,
    true,
  ]);

  const saved = await TodoModel.findById(todo._id).lean();

  expect(saved).not.toBeNull();
  expect(saved?.done).toBe(false);
});

it('deletes a TODO and returns 404 on a second attempt', async () => {
  const todo = await createTodo();

  const deleted = await request(app).delete(`/api/todos/${todo._id}`);

  expect(deleted.status).toBe(204);
  expect(deleted.text).toBe('');
  expect(await TodoModel.findById(todo._id)).toBeNull();

  const repeated = await request(app).delete(`/api/todos/${todo._id}`);

  expect(repeated.status).toBe(404);
  expect(repeated.body).toEqual({
    error: { message: 'TODO not found' },
  });
});

async function seedPages() {
  return TodoModel.insertMany(
    Array.from({ length: 12 }, (_, index) => ({
      title: `Task ${index + 1}`,
      description: index % 2 === 0 ? 'Needle [literal]' : 'Other details',
      done: index % 3 === 0,
      createdAt: new Date(Date.UTC(2026, 10, 4, 8, 0, index)),
    })),
  );
}

it('returns defaults and disjoint pages in a stable newest-first order', async () => {
  await seedPages();
  const defaults = await request(app).get('/api/todos');
  expect(defaults.status).toBe(200);
  expect(defaults.body.todos).toHaveLength(10);
  expect(defaults.body.pagination).toEqual({
    page: 1,
    limit: 10,
    total: 12,
    totalPages: 2,
  });
  const first = await request(app).get('/api/todos?page=1&limit=5');
  const second = await request(app).get('/api/todos?page=2&limit=5');
  expect(first.body.todos.map((todo: { title: string }) => todo.title)).toEqual(
    ['Task 12', 'Task 11', 'Task 10', 'Task 9', 'Task 8'],
  );
  expect(
    second.body.todos.map((todo: { title: string }) => todo.title),
  ).toEqual(['Task 7', 'Task 6', 'Task 5', 'Task 4', 'Task 3']);
  expect(
    new Set(
      [...first.body.todos, ...second.body.todos].map(
        (todo: { _id: string }) => todo._id,
      ),
    ).size,
  ).toBe(10);
});

it('filters across the full dataset and returns global status counts', async () => {
  await seedPages();
  const response = await request(app).get(
    '/api/todos?status=completed&limit=2',
  );
  expect(response.status).toBe(200);
  expect(response.body.todos).toHaveLength(2);
  expect(
    response.body.todos.every((todo: { done: boolean }) => todo.done),
  ).toBe(true);
  expect(response.body.pagination).toEqual({
    page: 1,
    limit: 2,
    total: 4,
    totalPages: 2,
  });
  expect(response.body.counts).toEqual({ all: 12, active: 8, completed: 4 });
});

it('searches titles and descriptions case-insensitively using literal text', async () => {
  await seedPages();
  const descriptions = await request(app)
    .get('/api/todos')
    .query({ search: 'NEEDLE', limit: 2, page: 2 });
  expect(descriptions.status).toBe(200);
  expect(descriptions.body.pagination.total).toBe(6);
  expect(descriptions.body.todos).toHaveLength(2);
  const literal = await request(app).get('/api/todos').query({ search: '[' });
  expect(literal.status).toBe(200);
  expect(literal.body.pagination.total).toBe(6);
  const combined = await request(app)
    .get('/api/todos')
    .query({ search: 'needle', status: 'completed' });
  expect(combined.body.pagination.total).toBe(2);
  const title = await request(app)
    .get('/api/todos')
    .query({ search: 'task 12' });
  expect(title.body.todos).toHaveLength(1);
});

it('returns consistent metadata for an empty result', async () => {
  const response = await request(app).get('/api/todos?page=99');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    todos: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    counts: { all: 0, active: 0, completed: 0 },
  });
});

it('returns the nearest valid page after the last-page records are deleted', async () => {
  await seedPages();
  const last = await request(app).get('/api/todos?page=2');
  for (const todo of last.body.todos)
    await request(app).delete(`/api/todos/${todo._id}`).expect(204);
  const response = await request(app).get('/api/todos?page=2');
  expect(response.body.pagination).toEqual({
    page: 1,
    limit: 10,
    total: 10,
    totalPages: 1,
  });
  expect(response.body.todos).toHaveLength(10);
});

it('keeps pagination stable when timestamps are identical', async () => {
  const createdAt = new Date('2026-11-04T08:00:00.000Z');
  const documents = await TodoModel.insertMany(
    Array.from({ length: 6 }, (_, index) => ({
      title: `Same time ${index}`,
      createdAt,
    })),
  );
  const expectedIds = documents
    .map((todo) => todo._id.toString())
    .sort()
    .reverse();
  const first = await request(app).get('/api/todos?limit=3');
  const second = await request(app).get('/api/todos?limit=3&page=2');
  expect(
    [...first.body.todos, ...second.body.todos].map(
      (todo: { _id: string }) => todo._id,
    ),
  ).toEqual(expectedIds);
});
