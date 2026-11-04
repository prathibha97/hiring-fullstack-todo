import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { todoRouter } from './routes/todo.routes.js';

export const app = express();

app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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

app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route Not Found',
    },
  });
});

app.use(errorHandler);
