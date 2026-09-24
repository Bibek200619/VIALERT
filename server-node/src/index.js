import { createApp } from './app.js';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const app = createApp({ clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' });
const server = app.listen(port, host, () => {
  console.log(`VIALERT Phase 1 demo API: http://${host}:${port}/api/health`);
});
server.on('error', (error) => {
  console.error(`Unable to start VIALERT demo API: ${error.message}`);
  process.exitCode = 1;
});

function shutdown() {
  server.close(() => {
    process.exitCode = 0;
  });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
