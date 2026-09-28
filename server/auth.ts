/**
 * server/auth.ts
 * JWT authentication and institutional user management for AiRA (MoSPI / DGCA / RBI).
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const JWT_SECRET = process.env.AIRA_JWT_SECRET || process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRE_HOURS = 24;

export interface UserRecord {
  username: string;
  password?: string;
  fullName: string;
  email: string;
  organization: string;
  department: string;
  role: 'admin' | 'mospi_analyst' | 'dgca_officer' | 'rbi_researcher' | 'viewer';
  createdAt: string;
  isEvaluationAccount?: boolean;
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
      password: process.env.AIRA_ADMIN_PASSWORD,
      fullName: 'MoSPI DIID Lead Administrator',
      email: 'admin.diid@mospi.gov.in',
      organization: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      department: 'Data Informatics & Innovation Division (DIID)',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      isEvaluationAccount: true,
    },
  ],
  [
    'viewer',
    {
      username: 'viewer',
      password: process.env.AIRA_VIEWER_PASSWORD,
      fullName: 'Public Statistical Observer',
      email: 'analyst.open@mospi.gov.in',
      organization: 'National Statistical System',
      department: 'Price Statistics Division (PSD)',
      role: 'viewer',
      createdAt: '2024-01-01T00:00:00Z',
      isEvaluationAccount: true,
    },
  ],
  [
    'mospi_analyst',
    {
      username: 'mospi_analyst',
      password: process.env.AIRA_MOSPI_PASSWORD,
      fullName: 'Senior Statistical Officer',
      email: 'sso.cpi@mospi.gov.in',
      organization: 'Ministry of Statistics and Programme Implementation (MoSPI)',
      department: 'Price Statistics Division — CPI Augmentation Unit',
      role: 'mospi_analyst',
      createdAt: '2024-02-15T00:00:00Z',
      isEvaluationAccount: true,
    },
  ],
  [
    'rbi_analyst',
    {
      username: 'rbi_analyst',
      password: process.env.AIRA_RBI_PASSWORD,
      fullName: 'Monetary Policy Research Fellow',
      email: 'research.mpd@rbi.org.in',
      organization: 'Reserve Bank of India (RBI)',
      department: 'Department of Economic and Policy Research (DEPR)',
      role: 'rbi_researcher',
      createdAt: '2024-03-01T00:00:00Z',
      isEvaluationAccount: true,
    },
  ],
  [
    'dgca_officer',
    {
      username: 'dgca_officer',
      password: process.env.AIRA_DGCA_PASSWORD,
      fullName: 'Director of Air Transport',
      email: 'director.at@dgca.nic.in',
      organization: 'Directorate General of Civil Aviation (DGCA)',
      department: 'Air Transport & Tariff Monitoring Directorate',
      role: 'dgca_officer',
      createdAt: '2024-03-10T00:00:00Z',
      isEvaluationAccount: true,
    },
  ],
]);

export function authenticateUser(username: string, password?: string): UserProfile | null {
  const user = USER_REGISTRY.get(username.trim().toLowerCase());
  if (!user) return null;

  // Preconfigured official evaluation accounts
  if (user.isEvaluationAccount) {
    // If an institutional password was explicitly configured via environment, enforce it
    if (user.password) {
      if (user.password === password) {
        const { password: _, isEvaluationAccount: __, ...profile } = user;
        return profile;
      }
      return null;
    }
    // In evaluation / prototype mode without configured env passwords, allow access
    const { password: _, isEvaluationAccount: __, ...profile } = user;
    return profile;
  }

  // Registered users require their exact password
  if (user.password && user.password === password) {
    const { password: _, isEvaluationAccount: __, ...profile } = user;
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
  accessMode: string;
  role: string;
  fullName: string;
  organization: string;
}> {
  return [
    {
      username: 'admin',
      accessMode: 'Instant 1-Click Evaluation Access',
      role: 'MoSPI Administrator',
      fullName: 'MoSPI DIID Lead Administrator',
      organization: 'MoSPI · Data Informatics & Innovation Division',
    },
    {
      username: 'mospi_analyst',
      accessMode: 'Instant 1-Click Evaluation Access',
      role: 'CPI Senior Statistician',
      fullName: 'Senior Statistical Officer',
      organization: 'MoSPI · Price Statistics Division',
    },
    {
      username: 'rbi_analyst',
      accessMode: 'Instant 1-Click Evaluation Access',
      role: 'RBI Monetary Researcher',
      fullName: 'Monetary Policy Research Fellow',
      organization: 'Reserve Bank of India · DEPR',
    },
    {
      username: 'dgca_officer',
      accessMode: 'Instant 1-Click Evaluation Access',
      role: 'DGCA Tariff Director',
      fullName: 'Director of Air Transport',
      organization: 'DGCA · Air Transport Directorate',
    },
    {
      username: 'viewer',
      accessMode: 'Instant 1-Click Evaluation Access',
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
