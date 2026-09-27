/**
 * server/auth.ts
 * JWT authentication helpers for AiRA admin and export endpoints.
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.AIRA_JWT_SECRET || 'aira-dev-secret-change-in-production';
const JWT_EXPIRE_HOURS = 24;

const DEMO_USERS: Record<string, { password: string; role: string }> = {
  admin: {
    password: process.env.AIRA_ADMIN_PASSWORD || 'aira-admin-2024',
    role: 'admin',
  },
  viewer: {
    password: process.env.AIRA_VIEWER_PASSWORD || 'aira-viewer-2024',
    role: 'viewer',
  },
};

export interface TokenData {
  username: string;
  role: string;
}

export function authenticateUser(username: string, password: string): { username: string; role: string } | null {
  const user = DEMO_USERS[username];
  if (user && user.password === password) {
    return { username, role: user.role };
  }
  return null;
}

export function createAccessToken(username: string, role: string): string {
  const payload = {
    sub: username,
    role,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRE_HOURS}h`,
  });
}

export function decodeToken(token: string): TokenData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { username: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.substring(7);
  const data = decodeToken(token);
  if (!data || data.role !== 'admin') {
    res.status(403).json({ detail: 'Admin privileges required' });
    return;
  }
  (req as any).user = data;
  next();
}
