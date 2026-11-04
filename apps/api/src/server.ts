import "dotenv/config";
import { z } from "zod";
import { app } from "./app.js";

const port = z.coerce
  .number()
  .int()
  .min(1)
  .max(65535)
  .default(4000)
  .parse(process.env.PORT);

const server = app.listen(port);

server.on("listening", () => {
  console.log(`Server listening on http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});

server.on("close", () => {
  console.log("Server closed");
});

let shuttingDown = false;

function shutDown() {
  if (shuttingDown) return;
  shuttingDown = true;

  // Allow active requests to finish, but bound shutdown if a client stalls.
  const timeout = setTimeout(() => {
    console.error("Shutdown timed out");
    process.exitCode = 1;
    server.closeAllConnections();
  }, 10_000);
  timeout.unref();

  server.close((error) => {
    clearTimeout(timeout);
    if (error) {
      console.error("Failed to shutdown server:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
