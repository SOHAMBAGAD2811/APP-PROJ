/**
 * server/api_entry.ts
 * Serverless function entrypoint for Vercel deployment.
 */
import app from './app';

export default function handler(req: any, res: any) {
  if (req.url && typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
