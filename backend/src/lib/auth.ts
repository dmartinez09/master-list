import type { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '12h';

if (!JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en .env');
  process.exit(1);
}

interface AdminPayload {
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function signAdminToken(): string {
  const payload: AdminPayload = { role: 'admin' };
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, opts);
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    if (decoded?.role !== 'admin') return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Middleware Express — exige header `Authorization: Bearer <jwt>` */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
  (req as any).admin = payload;
  next();
}
