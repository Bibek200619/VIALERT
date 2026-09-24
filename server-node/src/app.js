import express from 'express';
import cors from 'cors';
import { createStore } from './data/store.js';
import { createApiRouter } from './routes/api.js';
import { ApiError } from './services/validation.js';

export function createApp({ store = createStore(), clientOrigin = 'http://localhost:5173' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', createApiRouter(store));
  app.use((_request, _response, next) => {
    next(new ApiError(404, 'NOT_FOUND', 'This endpoint is not available in the Phase 1 foundation.'));
  });

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      response.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' }, demo: true });
      return;
    }
    if (error.type === 'entity.too.large') {
      response.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body exceeds the 32 KB limit.' }, demo: true });
      return;
    }
    if (error instanceof ApiError) {
      response.status(error.status).json({ error: { code: error.code, message: error.message }, demo: true });
      return;
    }
    console.error('Node API request failed:', error);
    response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The demo API could not complete this request.' }, demo: true });
  });

  return app;
}
