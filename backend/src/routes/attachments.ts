/**
 * Adjuntos por iniciativa (cotizaciones PDF / Excel / Word).
 * Guardados como base64 en Cosmos. Límite 4MB por archivo.
 */
import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { attachmentsContainer, initiativesContainer } from '../lib/cosmos.js';
import { requireAuth, type SessionPayload } from '../lib/auth.js';

export const attachmentsRouter = Router();

/** Tipos MIME aceptados */
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
]);

const MAX_BASE64_SIZE = 6 * 1024 * 1024; // 6MB base64 ≈ 4.5MB binario

/** No-op por ahora — los attachments se guardan en el container 'initiatives' con type='attachment' */
export async function ensureAttachmentsContainer() {
  /* container ya existe (se reutiliza initiatives) */
}

const NewAttachmentSchema = z.object({
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(200),
  base64: z.string().min(1).max(MAX_BASE64_SIZE),
});

/** GET /api/initiatives/:initiativeId/attachments — lista metadata (sin base64) */
attachmentsRouter.get('/:initiativeId/attachments', async (req, res) => {
  const { initiativeId } = req.params;
  try {
    const { resources } = await attachmentsContainer.items
      .query({
        query: "SELECT c.id, c.initiativeId, c.filename, c.mimeType, c.sizeBytes, c.uploadedBy, c.uploadedByRole, c.uploadedAt FROM c WHERE c.type = 'attachment' AND c.initiativeId = @id ORDER BY c.uploadedAt DESC",
        parameters: [{ name: '@id', value: initiativeId }],
      })
      .fetchAll();
    res.json(resources);
  } catch (err: any) {
    console.error('GET attachments error:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los adjuntos' });
  }
});

/** GET /api/initiatives/:initiativeId/attachments/:id/download — devuelve base64 + metadata */
attachmentsRouter.get('/:initiativeId/attachments/:attachmentId/download', async (req, res) => {
  const { initiativeId, attachmentId } = req.params;
  try {
    const { resources } = await attachmentsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.initiativeId = @iid AND c.type = 'attachment'",
        parameters: [
          { name: '@id', value: attachmentId },
          { name: '@iid', value: initiativeId },
        ],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Adjunto no encontrado' });
    const doc = resources[0];
    res.json({
      id: doc.id,
      filename: doc.filename,
      mimeType: doc.mimeType,
      base64: doc.base64,
      sizeBytes: doc.sizeBytes,
    });
  } catch (err: any) {
    console.error('GET download error:', err.message);
    res.status(500).json({ error: 'Error al descargar' });
  }
});

/** POST /api/initiatives/:initiativeId/attachments — subir archivo (auth) */
attachmentsRouter.post('/:initiativeId/attachments', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;
  const { initiativeId } = req.params;

  const parsed = NewAttachmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detail: parsed.error.issues.map(i => i.message).join('; '),
    });
  }

  if (!ALLOWED_MIMES.has(parsed.data.mimeType)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido. Solo PDF, Word o Excel.' });
  }

  // Verificar que la iniciativa exista
  const { resources: found } = await initiativesContainer.items
    .query({
      query: 'SELECT VALUE c.id FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: initiativeId }],
    })
    .fetchAll();
  if (!found.length) return res.status(404).json({ error: 'Hallazgo no encontrado' });

  const sizeBytes = Math.floor(parsed.data.base64.length * 3 / 4);
  const now = new Date().toISOString();

  const doc = {
    id: `att-${randomUUID()}`,
    type: 'attachment' as const,
    initiativeId,
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    base64: parsed.data.base64,
    sizeBytes,
    uploadedBy: session.userName ?? session.role,
    uploadedByRole: session.role,
    uploadedAt: now,
  };

  try {
    const { resource } = await attachmentsContainer.items.create(doc);
    // No devolvemos base64 en la respuesta para no inflar
    const { base64, ...meta } = resource as any;
    res.status(201).json(meta);
  } catch (err: any) {
    console.error('POST attachment error:', err.message);
    res.status(500).json({ error: 'No se pudo guardar el archivo', detail: err.message });
  }
});

/** DELETE — admin o el usuario que lo subió */
attachmentsRouter.delete('/:initiativeId/attachments/:attachmentId', requireAuth, async (req, res) => {
  const session: SessionPayload = (req as any).session;
  const initiativeId = String(req.params.initiativeId);
  const attachmentId = String(req.params.attachmentId);

  try {
    const { resources } = await attachmentsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.initiativeId = @iid AND c.type = 'attachment'",
        parameters: [
          { name: '@id', value: attachmentId },
          { name: '@iid', value: initiativeId },
        ],
      })
      .fetchAll();
    if (!resources.length) return res.status(404).json({ error: 'Adjunto no encontrado' });

    const doc = resources[0];
    // Admin puede borrar cualquiera; manager solo los propios
    if (session.role !== 'admin' && doc.uploadedBy !== session.userName) {
      return res.status(403).json({ error: 'Solo puedes borrar tus propios adjuntos' });
    }

    // Container 'initiatives' tiene partition key /id, no /initiativeId
    await attachmentsContainer.item(attachmentId, attachmentId).delete();
    res.json({ ok: true, deletedId: attachmentId });
  } catch (err: any) {
    if (err.code === 404) return res.status(404).json({ error: 'Adjunto no encontrado' });
    console.error('DELETE attachment error:', err.message);
    res.status(500).json({ error: 'No se pudo borrar', detail: err.message });
  }
});
