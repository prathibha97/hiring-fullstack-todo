import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import { registerTodoPaths } from './todo.paths.js';

const registry = new OpenAPIRegistry();

registerTodoPaths(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'TODO API',
    version: '1.0.0',
    description: 'API for creating and managing TODO items.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Todos' }],
});
