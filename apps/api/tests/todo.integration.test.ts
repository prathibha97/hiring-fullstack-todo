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
