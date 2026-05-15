import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { commentsContainer, initiativesContainer } from '../lib/cosmos.js';
import { requireAdmin, verifyToken, type SessionPayload } from '../lib/auth.js';

export const commentsRouter = Router();

/** Rate limit: 3 comentarios por IP cada minuto */
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Demasiados comentarios. Espera un momento e intenta de nuevo.' },
  standardHeaders: true,
});

const NewCommentSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre muy corto').max(50, 'Nombre muy largo'),
  apellido: z.string().trim().min(2, 'Apellido muy corto').max(50, 'Apellido muy largo'),
  contenido: z.string().trim().min(3, 'Comentario muy corto').max(2000, 'Comentario muy largo'),
});

/** GET /api/initiatives/:initiativeId/comments — listar */
commentsRouter.get('/:initiativeId/comments', async (req, res) => {
  const { initiativeId } = req.params;
  try {
    const { resources } = await commentsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.initiativeId = @id ORDER BY c.createdAt DESC',
        parameters: [{ name: '@id', value: initiativeId }],
      })
      .fetchAll();
    res.json(resources);
  } catch (err: any) {
    console.error(`GET comments error:`, err.message);
    res.status(500).json({ error: 'No se pudieron cargar los comentarios', detail: err.message });
  }
});

/** POST /api/initiatives/:initiativeId/comments — crear.
 *  Si el request lleva token de sesión, se ignoran nombre/apellido del body
 *  y se usa el del usuario autenticado (anti-suplantación + auditoría). */
commentsRouter.post('/:initiativeId/comments', commentLimiter, async (req, res) => {
  const { initiativeId } = req.params;

  // Detectar sesión (opcional — los comentarios son públicos pero pueden venir firmados)
  let session: SessionPayload | null = null;
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    session = verifyToken(token);
  }

  // Si está logueado, validamos solo el contenido (nombre viene del token)
  if (session && session.userName) {
    const ContentOnly = z.object({
      contenido: z.string().trim().min(3, 'Comentario muy corto').max(2000, 'Comentario muy largo'),
    });
    const parsedC = ContentOnly.safeParse(req.body);
    if (!parsedC.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detail: parsedC.error.issues.map(i => i.message).join('; '),
      });
    }

    // Verificar iniciativa existe
    const { resources: found } = await initiativesContainer.items
      .query({
        query: 'SELECT VALUE c.id FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: initiativeId }],
      })
      .fetchAll();
    if (!found.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

    const parts = session.userName.split(' ');
    const nombre = parts[0] ?? '';
    const apellido = parts.slice(1).join(' ') || nombre;
    const now = new Date().toISOString();

    const comment = {
      id: randomUUID(),
      initiativeId,
      nombre,
      apellido,
      contenido: parsedC.data.contenido,
      createdAt: now,
      // Auditoría
      authenticated: true,
      userId: session.userId ?? null,
      userRole: session.role,
      ipHash: hashIp(req.ip ?? req.socket.remoteAddress ?? 'unknown'),
    };
    try {
      const { resource } = await commentsContainer.items.create(comment);
      return res.status(201).json(resource);
    } catch (err: any) {
      console.error('POST comment (auth) error:', err.message);
      return res.status(500).json({ error: 'No se pudo guardar el comentario', detail: err.message });
    }
  }

  // Sin sesión: validar nombre/apellido/contenido como antes
  const parsed = NewCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detail: parsed.error.issues.map(i => i.message).join('; '),
    });
  }

  const { resources: found } = await initiativesContainer.items
    .query({
      query: 'SELECT VALUE c.id FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: initiativeId }],
    })
    .fetchAll();
  if (!found.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

  const now = new Date().toISOString();
  const ipRaw = req.ip ?? req.socket.remoteAddress ?? 'unknown';

  const comment = {
    id: randomUUID(),
    initiativeId,
    nombre: parsed.data.nombre,
    apellido: parsed.data.apellido,
    contenido: parsed.data.contenido,
    createdAt: now,
    authenticated: false,
    ipHash: hashIp(ipRaw),
  };

  try {
    const { resource } = await commentsContainer.items.create(comment);
    res.status(201).json(resource);
  } catch (err: any) {
    console.error('POST comment error:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el comentario', detail: err.message });
  }
});

/** DELETE /api/initiatives/:initiativeId/comments/:commentId — moderación admin */
commentsRouter.delete('/:initiativeId/comments/:commentId', requireAdmin, async (req, res) => {
  const initiativeId = String(req.params.initiativeId);
  const commentId = String(req.params.commentId);

  try {
    // Primero localizar el doc con query (el SDK falla con .item() en algunos casos)
    const { resources } = await commentsContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.initiativeId = @iid',
        parameters: [
          { name: '@id', value: commentId },
          { name: '@iid', value: initiativeId },
        ],
      })
      .fetchAll();

    if (!resources.length) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // El partition key del container comments es /initiativeId
    await commentsContainer.item(commentId, initiativeId).delete();
    res.json({ ok: true, deletedId: commentId });
  } catch (err: any) {
    if (err.code === 404) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    console.error(`DELETE comment ${commentId} error:`, err.message);
    res.status(500).json({ error: 'No se pudo borrar el comentario', detail: err.message });
  }
});

/** Hash simple para no almacenar IPs en claro (privacidad básica) */
function hashIp(ip: string): string {
  // Hash determinístico simple — solo para rate-limit/auditoría, no para seguridad
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = ((h << 5) - h + ip.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
