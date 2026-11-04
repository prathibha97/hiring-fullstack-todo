import 'dotenv/config';
import { z } from 'zod';
import { app } from './app.js';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from './database/connection.js';

const port = z.coerce
  .number()
  .int()
  .min(1)
  .max(65535)
  .default(4000)
  .parse(process.env.PORT);

const mongoUri = z.string().url().parse(process.env.MONGODB_URI);

async function startServer() {
  const server = app.listen(port);

  await connectToDatabase(mongoUri);

  server.on('listening', () => {
    console.log(`Server listening on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exitCode = 1;

    void disconnectFromDatabase().catch(() => {
      console.error('Failed to disconnect from database');
    });
  });

  server.on('close', () => {
    console.log('Server closed');
  });

  let shuttingDown = false;

  function shutDown() {
    if (shuttingDown) return;
    shuttingDown = true;

    // Allow active requests to finish, but bound shutdown if a client stalls.
    const timeout = setTimeout(() => {
      console.error('Shutdown timed out');
      process.exitCode = 1;
      server.closeAllConnections();
    }, 10_000);
    timeout.unref();

    server.close((error) => {
      clearTimeout(timeout);
      if (error) {
        console.error('Failed to shutdown server:', error);
        process.exitCode = 1;
      }

      void disconnectFromDatabase().catch(() => {
        console.error('Failed to disconnect from database');
        process.exitCode = 1;
      });
    });
  }

  process.on('SIGINT', shutDown);
  process.on('SIGTERM', shutDown);
}

void startServer().catch(async () => {
  console.error('Failed to start server');
  process.exitCode = 1;

  try {
    await disconnectFromDatabase();
  } catch (error) {
    console.error('Failed to disconnect from database');
  }
});
