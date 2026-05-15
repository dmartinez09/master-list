import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { listUsersPublic, findUser, verifyPassword, updateUserPassword } from '../lib/users.js';
import { signToken, requireAuth, type SessionPayload } from '../lib/auth.js';

export const usersRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10, // 10 intentos por IP en 5 min (acomoda a varios usuarios desde la misma red)
  message: { error: 'Demasiados intentos. Espera 5 minutos.' },
  standardHeaders: true,
});

/** GET /api/users — listado público para mostrar en el selector de login */
usersRouter.get('/', async (_req, res) => {
  try {
    const users = await listUsersPublic();
    res.json(users);
  } catch (err: any) {
    console.error('GET /users error:', err.message);
    res.status(500).json({ error: 'No se pudo cargar la lista de usuarios' });
  }
});

const LoginSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

/** POST /api/users/login — autenticación de manager */
usersRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  const { userId, password } = parsed.data;

  try {
    const user = await findUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    const token = signToken({ role: 'manager', userId: user.id, userName: user.name });
    res.json({ token, role: 'manager', userId: user.id, userName: user.name });
  } catch (err: any) {
    console.error('POST /users/login error:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(200),
});

/** POST /api/users/change-password — cambia la propia contraseña (auth requerida) */
usersRouter.post('/change-password', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;
  if (session.role !== 'manager' || !session.userId) {
    return res.status(403).json({ error: 'Solo managers pueden cambiar su contraseña aquí' });
  }

  const parsed = ChangePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detail: parsed.error.issues.map(i => i.message).join('; '),
    });
  }

  try {
    const user = await findUser(session.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!verifyPassword(parsed.data.oldPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    await updateUserPassword(user.id, parsed.data.newPassword);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('POST /users/change-password error:', err.message);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

/** GET /api/users/me — verifica que el token sigue válido y devuelve info actual */
usersRouter.get('/me', requireAuth, (req, res) => {
  const session: SessionPayload = (req as any).session;
  res.json({
    role: session.role,
    userId: session.userId,
    userName: session.userName,
  });
});
