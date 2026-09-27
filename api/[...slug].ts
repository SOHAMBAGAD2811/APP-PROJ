/**
 * api/[...slug].ts
 * Vercel Serverless Function catch-all route for all /api/* endpoints.
 */

import app from '../server/app';

export default function handler(req: any, res: any) {
  if (req.url && typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
