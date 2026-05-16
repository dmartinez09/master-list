import { Router } from 'express';
import { z } from 'zod';
import { initiativesContainer } from '../lib/cosmos.js';
import { requireAdmin, requireAuth, type SessionPayload } from '../lib/auth.js';

export const initiativesRouter = Router();

/* ─── Cache en memoria de la lista completa ───────────────────
   Cosmos cross-partition queries son lentas (~6s para 174 docs).
   Cacheamos por 60s. Cualquier PATCH invalida el cache.
─────────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 60_000;
let cachedList: { data: any[]; expiresAt: number } | null = null;

function invalidateCache() {
  cachedList = null;
}

async function getInitiativesCached(): Promise<any[]> {
  const now = Date.now();
  if (cachedList && cachedList.expiresAt > now) {
    return cachedList.data;
  }
  const t0 = Date.now();
  // Excluye docs internos (users, attachments) que comparten container
  const { resources } = await initiativesContainer.items
    .query("SELECT * FROM c WHERE (NOT IS_DEFINED(c.type)) OR c.type = 'initiative'")
    .fetchAll();
  const sorted = resources.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  cachedList = { data: sorted, expiresAt: now + CACHE_TTL_MS };
  console.log(`   ✓ Cache poblado: ${sorted.length} hallazgos en ${Date.now() - t0}ms`);
  return sorted;
}

/** Whitelist de campos editables (cualquier otro campo se ignora) */
const EditableFields = z.object({
  titulo: z.string().min(3).max(500).optional(),
  descripcion: z.string().max(8000).optional(),
  objetivos: z.string().max(4000).optional(),
  puntosDolor: z.string().max(4000).optional(),
  planAccion: z.string().max(4000).optional(),
  cuellosBottela: z.string().max(4000).optional(),
  bloqueadores: z.string().max(4000).optional(),
  estado: z.string().min(1).max(60).optional(),
  prioridad: z.string().min(1).max(30).optional(),
  empresa: z.string().min(1).max(80).optional(),
  area: z.string().max(80).optional(),
  subArea: z.string().max(80).optional(),
  solicitante: z.string().max(120).optional(),
  categoria: z.string().max(80).optional(),
  tipo: z.string().max(60).optional(),
  costoEstimado: z.string().max(40).optional(),
  costoReal: z.string().max(40).optional(),
  ahorro: z.string().max(40).optional(),
  tiempoRequerido: z.string().max(80).optional(),
  complejidad: z.string().max(40).optional(),
  fechaInicioProy: z.string().max(40).optional(),
  fechaInicioReal: z.string().max(40).optional(),
  fechaTerminoReal: z.string().max(40).optional(),
  recursosFuera: z.string().max(2000).optional(),
  recursosTA: z.string().max(2000).optional(),
  recursosNuevos: z.string().max(2000).optional(),
  sistemas: z.string().max(2000).optional(),
  dimension: z.string().max(80).optional(),
  nivelMadurez: z.string().max(80).optional(),
  nivelImpacto: z.string().max(80).optional(),
  /** Atribución del ticket (admin puede asignarlo) — string o array para compartido */
  attributedTo: z.union([z.string().max(200), z.array(z.string().max(80)).max(10)]).optional(),
});

/** Generar próximo ID disponible (ID-001, ID-002, ...) */
async function nextId(): Promise<string> {
  const data = await getInitiativesCached();
  let max = 0;
  for (const d of data) {
    const m = /^ID-(\d+)$/i.exec(d.id ?? '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ID-${String(max + 1).padStart(3, '0')}`;
}

/** POST /api/initiatives — admin o manager crea un nuevo hallazgo */
initiativesRouter.post('/', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;

  // Reutilizamos el mismo whitelist + titulo y empresa obligatorios
  const CreateSchema = EditableFields.extend({
    titulo: z.string().min(3, 'Título obligatorio').max(500),
    empresa: z.string().min(1, 'Empresa obligatoria').max(80),
  });
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
  }

  try {
    const id = await nextId();
    const now = new Date().toISOString();
    const isManager = session.role === 'manager';

    const who = session.userName ?? session.role;
    const doc = {
      id,
      ...parsed.data,
      // Managers SIEMPRE crean en "Solicitado / A validar". Admin puede elegir.
      estado: isManager ? 'Solicitado / A validar' : (parsed.data.estado ?? 'Solicitado / A validar'),
      prioridad: parsed.data.prioridad ?? 'Media',
      // Atribución por defecto al creador (admin puede cambiar luego)
      attributedTo: parsed.data.attributedTo ?? who,
      _created_at: now,
      _updated_at: now,
      _updated_by: who,
      _updated_by_role: session.role,
      _created_by: who,
      _created_by_role: session.role,
      lastModifiedAt: now,
      lastModifiedBy: who,
    };
    const { resource } = await initiativesContainer.items.create(doc);
    invalidateCache();
    res.status(201).json(resource);
  } catch (err: any) {
    console.error('POST /initiatives error:', err.message);
    res.status(500).json({ error: 'No se pudo crear', detail: err.message });
  }
});

/** GET /api/initiatives — lista completa (con cache 60s) */
initiativesRouter.get('/', async (_req, res) => {
  try {
    const data = await getInitiativesCached();
    res.json(data);
  } catch (err: any) {
    console.error('GET /initiatives error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los hallazgos', detail: err.message });
  }
});

/** GET /api/initiatives/:id — detalle */
initiativesRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { resources } = await initiativesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });
    res.json(resources[0]);
  } catch (err: any) {
    console.error(`GET /initiatives/${id} error:`, err.message);
    res.status(500).json({ error: 'Error consultando el hallazgo', detail: err.message });
  }
});

/** PATCH /api/initiatives/:id — admin edita uno o más campos */
initiativesRouter.patch('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  // Validar el body — solo se aceptan los campos del whitelist
  const parsed = EditableFields.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
  }

  const patch = parsed.data;
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  try {
    // 1) Leer el documento actual (necesario para upsert con todos los campos)
    const { resources } = await initiativesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

    const current = resources[0];

    // 2) Merge con metadatos de auditoría
    const session: SessionPayload = (req as any).session;
    const who = session?.userName ?? session?.role ?? 'admin';
    const now = new Date().toISOString();
    const updated = {
      ...current,
      ...patch,
      _updated_at: now,
      _updated_by: who,
      _updated_by_role: session?.role ?? 'admin',
      lastModifiedAt: now,
      lastModifiedBy: who,
    };

    // 3) Upsert + invalidar cache
    const { resource } = await initiativesContainer.items.upsert(updated);
    invalidateCache();
    res.json(resource);
  } catch (err: any) {
    console.error(`PATCH /initiatives/${id} error:`, err.message);
    res.status(500).json({ error: 'No se pudo actualizar', detail: err.message });
  }
});

/** PATCH /api/initiatives/:id/approval — admin o manager marca Aprobado / A Evaluar */
initiativesRouter.patch('/:id/approval', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;
  const id = String(req.params.id);

  const ApprovalSchema = z.object({
    approvalStatus: z.enum(['aprobado', 'a-evaluar', 'pendiente']),
  });
  const parsed = ApprovalSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    const { resources } = await initiativesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

    const current = resources[0];
    const now = new Date().toISOString();
    const who = session.userName ?? session.role;

    // Auto-mover estado del kanban según la decisión:
    //  · Aprobado    → "En Espera de TI / TA"
    //  · A evaluar   → "Fuera del Plan"
    //  · Pendiente   → no cambia estado
    let nextEstado = current.estado;
    if (parsed.data.approvalStatus === 'aprobado') {
      nextEstado = 'En Espera de TI / TA';
    } else if (parsed.data.approvalStatus === 'a-evaluar') {
      nextEstado = 'Fuera del Plan';
    }

    // Atribución automática: la persona que aprueba/evalúa queda atribuida
    // (si no había atribución previa o el admin no la fijó manualmente)
    const newAttribution = current.attributedTo ?? who;

    const updated = {
      ...current,
      estado: nextEstado,
      approvalStatus: parsed.data.approvalStatus,
      approvalBy: who,
      approvalByRole: session.role,
      approvalAt: now,
      attributedTo: newAttribution,
      _updated_at: now,
      _updated_by: who,
      _updated_by_role: session.role,
      lastModifiedAt: now,
      lastModifiedBy: who,
    };
    const { resource } = await initiativesContainer.items.upsert(updated);
    invalidateCache();
    res.json(resource);
  } catch (err: any) {
    console.error(`PATCH /initiatives/${id}/approval error:`, err.message);
    res.status(500).json({ error: 'No se pudo actualizar aprobación', detail: err.message });
  }
});

/** DELETE /api/initiatives/:id — admin elimina un hallazgo */
initiativesRouter.delete('/:id', requireAdmin, async (req, res) => {
  const id = String(req.params.id);
  try {
    // Verificar que existe (workaround SDK)
    const { resources } = await initiativesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

    await initiativesContainer.item(id, id).delete();
    invalidateCache();
    res.json({ ok: true, deletedId: id });
  } catch (err: any) {
    if (err.code === 404) return res.status(404).json({ error: 'Hallazgo no encontrado' });
    console.error(`DELETE /initiatives/${id} error:`, err.message);
    res.status(500).json({ error: 'No se pudo borrar', detail: err.message });
  }
});
