/**
 * Feed de actividad agregada — sin nuevo container, compila eventos desde:
 *   - initiatives: _created_by, _updated_by, approvalBy
 *   - comments: comentarios autenticados
 *
 * Endpoints:
 *   GET /api/admin/activity        — todos los eventos (admin)
 *   GET /api/users/me/activity     — solo los eventos del usuario logueado
 */
import { Router } from 'express';
import { initiativesContainer, commentsContainer } from '../lib/cosmos.js';
import { requireAuth, requireAdmin, type SessionPayload } from '../lib/auth.js';

export const activityRouter = Router();

export type ActivityType = 'create' | 'update' | 'approval' | 'comment';

interface ActivityEvent {
  type: ActivityType;
  initiativeId: string;
  initiativeTitle?: string;
  by: string;                 // nombre
  byRole?: 'admin' | 'manager';
  at: string;                 // ISO timestamp
  detail?: string;            // descripción adicional (ej. "Aprobado", "Comentó: ...")
  meta?: Record<string, any>;
}

/** Construye el feed agregando todas las fuentes en memoria */
async function buildFeed(opts: { userName?: string; limit?: number }): Promise<ActivityEvent[]> {
  const limit = opts.limit ?? 100;
  const events: ActivityEvent[] = [];

  // 1) Iniciativas (creaciones, updates, aprobaciones)
  const { resources: inits } = await initiativesContainer.items
    .query("SELECT * FROM c WHERE (NOT IS_DEFINED(c.type)) OR c.type = 'initiative'")
    .fetchAll();

  for (const i of inits) {
    if (i._created_by && i._created_at) {
      events.push({
        type: 'create',
        initiativeId: i.id,
        initiativeTitle: i.titulo,
        by: i._created_by,
        byRole: i._created_by_role,
        at: i._created_at,
        detail: 'Creó el hallazgo',
      });
    }
    if (i._updated_by && i._updated_at && i._updated_at !== i._created_at) {
      events.push({
        type: 'update',
        initiativeId: i.id,
        initiativeTitle: i.titulo,
        by: i._updated_by,
        byRole: i._updated_by_role,
        at: i._updated_at,
        detail: 'Editó campos',
      });
    }
    if (i.approvalBy && i.approvalAt && i.approvalStatus) {
      const label = i.approvalStatus === 'aprobado' ? 'Aprobado' :
                    i.approvalStatus === 'a-evaluar' ? 'A Evaluar' : 'Pendiente';
      events.push({
        type: 'approval',
        initiativeId: i.id,
        initiativeTitle: i.titulo,
        by: i.approvalBy,
        byRole: i.approvalByRole,
        at: i.approvalAt,
        detail: `Marcó como "${label}"`,
        meta: { status: i.approvalStatus },
      });
    }
  }

  // 2) Comentarios autenticados
  const { resources: comments } = await commentsContainer.items
    .query('SELECT * FROM c WHERE c.authenticated = true')
    .fetchAll();

  // Map de id -> título de iniciativa
  const titleById = new Map<string, string>(inits.map((i: any) => [i.id, i.titulo]));

  for (const c of comments) {
    const name = `${c.nombre} ${c.apellido}`.trim();
    events.push({
      type: 'comment',
      initiativeId: c.initiativeId,
      initiativeTitle: titleById.get(c.initiativeId),
      by: name,
      byRole: c.userRole,
      at: c.createdAt,
      detail: c.contenido?.length > 80 ? c.contenido.slice(0, 80) + '…' : c.contenido,
    });
  }

  // 3) Filtrar por usuario si aplica + ordenar desc + limitar
  let filtered = events;
  if (opts.userName) {
    filtered = events.filter(e => e.by === opts.userName);
  }
  filtered.sort((a, b) => (a.at < b.at ? 1 : -1));
  return filtered.slice(0, limit);
}

/** GET /api/admin/activity — todos los eventos (solo admin) */
activityRouter.get('/admin/activity', requireAdmin, async (_req, res) => {
  try {
    const feed = await buildFeed({ limit: 200 });
    res.json(feed);
  } catch (err: any) {
    console.error('GET /admin/activity error:', err.message);
    res.status(500).json({ error: 'No se pudo construir el feed', detail: err.message });
  }
});

/** GET /api/users/me/activity — solo eventos del usuario logueado */
activityRouter.get('/users/me/activity', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;
  try {
    const feed = await buildFeed({
      userName: session.userName ?? session.role,
      limit: 50,
    });
    res.json(feed);
  } catch (err: any) {
    console.error('GET /me/activity error:', err.message);
    res.status(500).json({ error: 'No se pudo construir el feed', detail: err.message });
  }
});
