import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/todo.service.js', () => ({
  createTodo: vi.fn(),
  listTodos: vi.fn(),
  updateTodo: vi.fn(),
  toggleTodoDone: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { app } from '../src/app.js';
import * as todoService from '../src/services/todo.service.js';

const missingId = '507f1f77bcf86cd799439011';

describe('TODO request validation', () => {
  it('rejects a blank title', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: '   ' });

    expect(response.status).toBe(400);
    expect(todoService.createTodo).not.toHaveBeenCalled();
  });

  it('rejects an invalid ID when updating', async () => {
    const response = await request(app)
      .put('/api/todos/invalid')
      .send({ title: 'Updated' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Invalid TODO ID');
    expect(todoService.updateTodo).not.toHaveBeenCalled();
  });

  it('rejects an invalid ID when toggling', async () => {
    const response = await request(app).patch('/api/todos/invalid/done');

    expect(response.status).toBe(400);
    expect(todoService.toggleTodoDone).not.toHaveBeenCalled();
  });

  it('rejects an invalid ID when deleting', async () => {
    const response = await request(app).delete('/api/todos/invalid');

    expect(response.status).toBe(400);
    expect(todoService.deleteTodo).not.toHaveBeenCalled();
  });
});

describe('missing TODOs', () => {
  it('returns 404 when updating', async () => {
    vi.mocked(todoService.updateTodo).mockResolvedValueOnce(null);

    const response = await request(app)
      .put(`/api/todos/${missingId}`)
      .send({ title: 'Updated' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { message: 'TODO not found' },
    });
  });

  it('returns 404 when toggling', async () => {
    vi.mocked(todoService.toggleTodoDone).mockResolvedValueOnce(null);

    const response = await request(app).patch(`/api/todos/${missingId}/done`);

    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting', async () => {
    vi.mocked(todoService.deleteTodo).mockResolvedValueOnce(null);

    const response = await request(app).delete(`/api/todos/${missingId}`);

    expect(response.status).toBe(404);
  });
});

describe('pagination parameters', () => {
  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'abc' },
    { limit: '0' },
    { limit: '51' },
    { status: 'unknown' },
    { search: 'a'.repeat(201) },
    { page: ['1', '2'] },
  ])('rejects invalid list parameters: %j', async (query) => {
    const response = await request(app).get('/api/todos').query(query);
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Invalid list parameters');
    expect(todoService.listTodos).not.toHaveBeenCalled();
  });
});
