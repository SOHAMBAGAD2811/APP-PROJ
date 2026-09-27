/**
 * server/api_entry.ts
 * Serverless function entrypoint for Vercel deployment.
 */
import app from './app';

export default function handler(req: any, res: any) {
  const matchedPath = req.headers['x-matched-path'];
  if (typeof matchedPath === 'string' && matchedPath.startsWith('/api') && matchedPath !== '/api' && matchedPath !== '/api/' && !matchedPath.includes('[')) {
    const queryIdx = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
    const query = queryIdx !== -1 ? req.url.slice(queryIdx) : '';
    const cleanMatched = matchedPath.split('?')[0];
    req.url = cleanMatched + query;
  } else if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
