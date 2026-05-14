import { Router } from 'express';
import { z } from 'zod';
import { initiativesContainer } from '../lib/cosmos.js';
import { requireAdmin } from '../lib/auth.js';

export const initiativesRouter = Router();

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
});

/** GET /api/initiatives — lista completa */
initiativesRouter.get('/', async (_req, res) => {
  try {
    const { resources } = await initiativesContainer.items
      .query('SELECT * FROM c ORDER BY c.id')
      .fetchAll();
    res.json(resources);
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
    const updated = {
      ...current,
      ...patch,
      _updated_at: new Date().toISOString(),
      _updated_by: 'admin',
    };

    // 3) Upsert
    const { resource } = await initiativesContainer.items.upsert(updated);
    res.json(resource);
  } catch (err: any) {
    console.error(`PATCH /initiatives/${id} error:`, err.message);
    res.status(500).json({ error: 'No se pudo actualizar', detail: err.message });
  }
});
