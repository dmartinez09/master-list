import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { signToken, requireAdmin } from '../lib/auth.js';

export const adminRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

if (!ADMIN_PASSWORD) {
  console.error('❌ Falta ADMIN_PASSWORD en .env');
  process.exit(1);
}

/** Rate limit: 5 intentos por IP cada 5 minutos (anti brute-force) */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos. Espera 5 minutos.' },
  standardHeaders: true,
});

const LoginSchema = z.object({
  password: z.string().min(1, 'Password requerido'),
});

/** POST /api/admin/login — recibe { password }, devuelve { token } */
adminRouter.post('/login', loginLimiter, (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  // Comparación tiempo-constante para evitar timing attacks
  const submitted = Buffer.from(parsed.data.password);
  const expected = Buffer.from(ADMIN_PASSWORD);
  if (submitted.length !== expected.length) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  let diff = 0;
  for (let i = 0; i < submitted.length; i++) diff |= submitted[i] ^ expected[i];
  if (diff !== 0) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = signToken({ role: 'admin' });
  res.json({ token, role: 'admin' });
});

/** GET /api/admin/verify — verifica si el token sigue válido (para auto-login en la UI) */
adminRouter.get('/verify', requireAdmin, (_req, res) => {
  res.json({ ok: true, role: 'admin' });
});
