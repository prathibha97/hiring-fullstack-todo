import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  createTodoSchema,
  todoIdSchema,
  updateTodoSchema,
} from '../validators/todo.validator.js';
import {
  errorResponseSchema,
  todoItemResponseSchema,
  todoListResponseSchema,
} from './schemas.js';

function jsonResponse(description: string, schema: z.ZodType) {
  return {
    description,
    content: {
      'application/json': { schema },
    },
  };
}

const todoParams = z.object({
  id: todoIdSchema,
});

const badRequest = jsonResponse(
  'Invalid request body or TODO ID',
  errorResponseSchema,
);

const notFound = jsonResponse('TODO not found', errorResponseSchema);

const serverError = jsonResponse(
  'Unexpected server error',
  errorResponseSchema,
);

const bodyTooLarge = jsonResponse(
  'Request body exceeds the 100 KB limit',
  errorResponseSchema,
);

export function registerTodoPaths(registry: OpenAPIRegistry) {
  registry.registerPath({
    method: 'get',
    path: '/api/todos',
    tags: ['Todos'],
    operationId: 'listTodos',
    summary: 'List all TODOs',
    description: 'Returns TODOs ordered newest first.',
    responses: {
      200: jsonResponse('TODO list', todoListResponseSchema),
      500: serverError,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/todos',
    tags: ['Todos'],
    operationId: 'createTodo',
    summary: 'Create a TODO',
    description: 'Creates a TODO with done set to false.',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: createTodoSchema,
            example: {
              title: 'Complete assessment',
              description: 'Finish the TODO app',
            },
          },
        },
      },
    },
    responses: {
      201: jsonResponse('TODO created', todoItemResponseSchema),
      400: badRequest,
      413: bodyTooLarge,
      500: serverError,
    },
  });

  registry.registerPath({
    method: 'put',
    path: '/api/todos/{id}',
    tags: ['Todos'],
    operationId: 'updateTodo',
    summary: 'Edit a TODO',
    description:
      'Updates title and/or description. Omitted fields are preserved. ' +
      'An empty description clears it. The done field cannot be updated here.',
    request: {
      params: todoParams,
      body: {
        required: true,
        content: {
          'application/json': {
            schema: updateTodoSchema.meta({
              minProperties: 1,
              description: 'Provide at least one of title or description.',
            }),
            example: { title: 'Finish API documentation' },
          },
        },
      },
    },
    responses: {
      200: jsonResponse('TODO updated', todoItemResponseSchema),
      400: badRequest,
      404: notFound,
      413: bodyTooLarge,
      500: serverError,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/todos/{id}/done',
    tags: ['Todos'],
    operationId: 'toggleTodoDone',
    summary: "Toggle a TODO's done status",
    description:
      'Atomically flips the stored done value. No request body is required. ' +
      'Repeating this request toggles the value again.',
    request: {
      params: todoParams,
    },
    responses: {
      200: jsonResponse('TODO toggled', todoItemResponseSchema),
      400: badRequest,
      404: notFound,
      500: serverError,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/todos/{id}',
    tags: ['Todos'],
    operationId: 'deleteTodo',
    summary: 'Delete a TODO',
    request: {
      params: todoParams,
    },
    responses: {
      204: { description: 'TODO deleted. No response body.' },
      400: badRequest,
      404: notFound,
      500: serverError,
    },
  });
}
