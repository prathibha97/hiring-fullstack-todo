import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { todoRouter } from './routes/todo.routes.js';

export const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
);

app.use(
  express.json({
    limit: '100kb',
  }),
);

app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
  }),
);

app.use('/api/todos', todoRouter);

app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route Not Found',
    },
  });
});

app.use(errorHandler);
