/**
 * server/auth.ts
 * JWT authentication and institutional user management for AiRA (MoSPI / DGCA / RBI).
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.AIRA_JWT_SECRET || 'aira-dev-secret-change-in-production';
const JWT_EXPIRE_HOURS = 24;

export interface UserRecord {
  username: string;
  password: string;
  fullName: string;
  email: string;
  organization: string;
  department: string;
  role: 'admin' | 'mospi_analyst' | 'dgca_officer' | 'rbi_researcher' | 'viewer';
  createdAt: string;
}

export interface UserProfile {
  username: string;
  fullName: string;
  email: string;
  organization: string;
  department: string;
  role: string;
  createdAt: string;
}

export interface TokenData {
  username: string;
  role: string;
  fullName?: string;
  organization?: string;
}

// In-memory institutional user registry with official MoSPI, DGCA, RBI preconfigured roles
const USER_REGISTRY: Map<string, UserRecord> = new Map([
  [
    'admin',
    {
      username: 'admin',
      password: process.env.AIRA_ADMIN_PASSWORD || 'aira-admin-2024',
      fullName: 'MoSPI DIID Lead Administrator',
      email: 'admin.diid@mospi.gov.in',
      organization: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      department: 'Data Informatics & Innovation Division (DIID)',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  [
    'viewer',
    {
      username: 'viewer',
      password: process.env.AIRA_VIEWER_PASSWORD || 'aira-viewer-2024',
      fullName: 'Public Statistical Observer',
      email: 'analyst.open@mospi.gov.in',
      organization: 'National Statistical System',
      department: 'Price Statistics Division (PSD)',
      role: 'viewer',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  [
    'mospi_analyst',
    {
      username: 'mospi_analyst',
      password: process.env.AIRA_MOSPI_PASSWORD || 'mospi-cpi-2024',
      fullName: 'Senior Statistical Officer',
      email: 'sso.cpi@mospi.gov.in',
      organization: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      department: 'Price Statistics Division — CPI Augmentation Unit',
      role: 'mospi_analyst',
      createdAt: '2024-02-15T00:00:00Z',
    },
  ],
  [
    'rbi_analyst',
    {
      username: 'rbi_analyst',
      password: process.env.AIRA_RBI_PASSWORD || 'rbi-policy-2024',
      fullName: 'Monetary Policy Research Fellow',
      email: 'research.mpd@rbi.org.in',
      organization: 'Reserve Bank of India (RBI)',
      department: 'Department of Economic and Policy Research (DEPR)',
      role: 'rbi_researcher',
      createdAt: '2024-03-01T00:00:00Z',
    },
  ],
  [
    'dgca_officer',
    {
      username: 'dgca_officer',
      password: process.env.AIRA_DGCA_PASSWORD || 'dgca-at-2024',
      fullName: 'Director of Air Transport',
      email: 'director.at@dgca.nic.in',
      organization: 'Directorate General of Civil Aviation (DGCA)',
      department: 'Air Transport & Tariff Monitoring Directorate',
      role: 'dgca_officer',
      createdAt: '2024-03-10T00:00:00Z',
    },
  ],
]);

export function authenticateUser(username: string, password: string): UserProfile | null {
  const user = USER_REGISTRY.get(username.trim().toLowerCase());
  if (user && user.password === password) {
    const { password: _, ...profile } = user;
    return profile;
  }
  return null;
}

export function registerUser(data: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  organization: string;
  department?: string;
  role?: 'admin' | 'mospi_analyst' | 'dgca_officer' | 'rbi_researcher' | 'viewer';
}): { user: UserProfile } | { error: string } {
  const username = data.username.trim().toLowerCase();
  if (!username || username.length < 3) {
    return { error: 'Username must be at least 3 characters long.' };
  }
  if (USER_REGISTRY.has(username)) {
    return { error: `Username "${username}" is already registered.` };
  }
  if (!data.password || data.password.length < 6) {
    return { error: 'Password must be at least 6 characters long.' };
  }
  if (!data.email || !data.email.includes('@')) {
    return { error: 'A valid email address is required.' };
  }

  const newUser: UserRecord = {
    username,
    password: data.password,
    fullName: data.fullName?.trim() || username,
    email: data.email.trim(),
    organization: data.organization?.trim() || 'Ministry of Statistics (MoSPI)',
    department: data.department?.trim() || 'Data Informatics & Innovation Division',
    role: data.role || 'viewer',
    createdAt: new Date().toISOString(),
  };

  USER_REGISTRY.set(username, newUser);
  const { password: _, ...profile } = newUser;
  return { user: profile };
}

export function getUserByUsername(username: string): UserProfile | null {
  const user = USER_REGISTRY.get(username.trim().toLowerCase());
  if (!user) return null;
  const { password: _, ...profile } = user;
  return profile;
}

export function getPublicDemoAccounts(): Array<{
  username: string;
  passwordHint: string;
  role: string;
  fullName: string;
  organization: string;
}> {
  return [
    {
      username: 'admin',
      passwordHint: 'aira-admin-2024',
      role: 'MoSPI Administrator',
      fullName: 'MoSPI DIID Lead Administrator',
      organization: 'MoSPI · Data Informatics & Innovation Division',
    },
    {
      username: 'mospi_analyst',
      passwordHint: 'mospi-cpi-2024',
      role: 'CPI Senior Statistician',
      fullName: 'Senior Statistical Officer',
      organization: 'MoSPI · Price Statistics Division',
    },
    {
      username: 'rbi_analyst',
      passwordHint: 'rbi-policy-2024',
      role: 'RBI Monetary Researcher',
      fullName: 'Monetary Policy Research Fellow',
      organization: 'Reserve Bank of India · DEPR',
    },
    {
      username: 'dgca_officer',
      passwordHint: 'dgca-at-2024',
      role: 'DGCA Tariff Director',
      fullName: 'Director of Air Transport',
      organization: 'DGCA · Air Transport Directorate',
    },
    {
      username: 'viewer',
      passwordHint: 'aira-viewer-2024',
      role: 'Public Data Observer',
      fullName: 'Public Statistical Observer',
      organization: 'National Statistical System',
    },
  ];
}

export function createAccessToken(user: UserProfile): string {
  const payload = {
    sub: user.username,
    role: user.role,
    name: user.fullName,
    org: user.organization,
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${JWT_EXPIRE_HOURS}h`,
  });
}

export function decodeToken(token: string): TokenData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      username: decoded.sub,
      role: decoded.role,
      fullName: decoded.name,
      organization: decoded.org,
    };
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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.substring(7);
  const data = decodeToken(token);
  if (!data) {
    res.status(401).json({ detail: 'Session expired or invalid token' });
    return;
  }
  (req as any).user = data;
  next();
}
