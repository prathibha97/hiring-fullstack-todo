import { describe, expect, it } from 'vitest';
import {
  createTodoSchema,
  todoIdSchema,
  updateTodoSchema,
} from '../src/validators/todo.validator.js';

describe('creating a TODO', () => {
  it('trims the title and allows an omitted description', () => {
    const result = createTodoSchema.parse({ title: '  Buy milk  ' });

    expect(result).toEqual({ title: 'Buy milk' });
  });

  it.each([
    {},
    { title: '' },
    { title: '   ' },
    { title: 123 },
    { title: 'a'.repeat(201) },
    { title: 'Buy milk', description: 'a'.repeat(2001) },
    { title: 'Buy milk', done: true },
  ])('rejects invalid input: %j', (input) => {
    expect(createTodoSchema.safeParse(input).success).toBe(false);
  });

  it('accepts the maximum field lengths', () => {
    const result = createTodoSchema.safeParse({
      title: 'a'.repeat(200),
      description: 'a'.repeat(2000),
    });

    expect(result.success).toBe(true);
  });
});

describe('updating a TODO', () => {
  it('allows updating only the title', () => {
    expect(updateTodoSchema.parse({ title: 'Updated' })).toEqual({
      title: 'Updated',
    });
  });

  it('allows clearing the description', () => {
    expect(updateTodoSchema.parse({ description: '' })).toEqual({
      description: '',
    });
  });

  it.each([
    {},
    { title: '   ' },
    { description: null },
    { done: true },
    { title: 'Updated', done: false },
  ])('rejects invalid updates: %j', (input) => {
    expect(updateTodoSchema.safeParse(input).success).toBe(false);
  });
});

describe('TODO IDs', () => {
  it('accepts a 24-character hexadecimal ID', () => {
    expect(todoIdSchema.safeParse('507f1f77bcf86cd799439011').success).toBe(
      true,
    );
  });

  it.each(['', 'invalid', 'a'.repeat(23), 'g'.repeat(24)])(
    'rejects an invalid ID: %j',
    (id) => {
      expect(todoIdSchema.safeParse(id).success).toBe(false);
    },
  );
});
