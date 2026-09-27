/**
 * api/index.ts
 * Vercel Serverless Function entry point for the AiRA API backend.
 */

import app from '../server/app';

export default function handler(req: any, res: any) {
  // Normalize request URL for Vercel Serverless routing
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  } else if (typeof req.url === 'string') {
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }

  return app(req, res);
}
