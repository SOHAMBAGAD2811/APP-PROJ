/**
 * api/index.ts
 * Vercel Serverless Function entry point for the AiRA API backend.
 */

import app from '../server/app';

export default function handler(req: any, res: any) {
  if (req.url && typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
