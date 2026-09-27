/**
 * server/index.ts
 * Local development server entry point for AiRA (executed via tsx).
 */

import app from './app';

const PORT = parseInt(process.env.PORT || '8000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✈️  AiRA Node/TypeScript API server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available: /api/airports, /api/apix/summary, /api/chat, etc.`);
});
