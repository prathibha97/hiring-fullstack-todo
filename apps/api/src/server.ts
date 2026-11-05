import 'dotenv/config';
import { z } from 'zod';
import { app } from './app.js';
import {
  connectToDatabase,
  disconnectFromDatabase,
} from './database/connection.js';

async function startServer() {
  const port = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000)
    .parse(process.env.PORT);

  const mongoUri = z.string().url().parse(process.env.MONGODB_URI);

  await connectToDatabase(mongoUri);

  const server = app.listen(port);

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
      process.exit(1);
    }, 10_000);
    timeout.unref();

    server.close((error) => {
      if (error) {
        console.error('Failed to shutdown server:', error);
        process.exitCode = 1;
      }

      void disconnectFromDatabase()
        .catch(() => {
          console.error('Failed to disconnect from database');
          process.exitCode = 1;
        })
        .finally(() => clearTimeout(timeout));
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
  } catch {
    console.error('Failed to disconnect from database');
  }
});
