import type { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '12h';

if (!JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en .env');
  process.exit(1);
}

export type Role = 'admin' | 'manager';

export interface SessionPayload {
  role: Role;
  userId?: string;   // solo para managers
  userName?: string; // solo para managers
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    if (decoded?.role !== 'admin' && decoded?.role !== 'manager') return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Middleware base — exige cualquier token válido (admin o manager) */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  (req as any).session = payload;
  next();
}

/** Solo admin */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const session: SessionPayload = (req as any).session;
    if (session.role !== 'admin') {
      return res.status(403).json({ error: 'Acción solo para administradores' });
    }
    next();
  });
}

/** Admin o manager */
export const requireManager = requireAuth;
