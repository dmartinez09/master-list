import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { pingCosmos } from './lib/cosmos.js';
import { ensureUsersSeeded } from './lib/users.js';
import { initiativesRouter } from './routes/initiatives.js';
import { commentsRouter } from './routes/comments.js';
import { adminRouter } from './routes/admin.js';
import { usersRouter } from './routes/users.js';
import { attachmentsRouter, ensureAttachmentsContainer } from './routes/attachments.js';
import { activityRouter } from './routes/activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const NODE_ENV = (process.env.NODE_ENV ?? 'development').trim();
const isProduction = NODE_ENV === 'production';

const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5174')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ─── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// En producción servimos frontend desde el mismo origen → no necesitamos CORS
// En dev permitimos los orígenes configurados
if (!isProduction) {
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || CORS_ORIGINS.includes(origin)) cb(null, true);
      else cb(new Error(`Origen no permitido: ${origin}`));
    },
    credentials: true,
  }));
}

// Trust proxy (necesario para rate-limit detrás de Azure App Service)
app.set('trust proxy', 1);

// Log compacto en prod
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// ─── Rutas API ──────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  });
});

app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);
app.use('/api/initiatives', initiativesRouter);
app.use('/api/initiatives', commentsRouter);
app.use('/api/initiatives', attachmentsRouter);
app.use('/api', activityRouter); // expone /api/admin/activity y /api/users/me/activity

// 404 para rutas /api/*
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// ─── Static frontend (producción) ────────────────────────────
// En producción servimos el bundle del frontend desde ./public (o ../public)
// Estructura esperada: backend/dist/server.js + backend/public/index.html
const STATIC_DIR = path.resolve(__dirname, '../public');

if (isProduction && existsSync(STATIC_DIR)) {
  console.log(`📦 Sirviendo frontend desde: ${STATIC_DIR}`);
  app.use(express.static(STATIC_DIR, {
    index: false,
    maxAge: '1h',
  }));

  // SPA catch-all: cualquier ruta NO-api devuelve index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
} else if (isProduction) {
  console.warn(`⚠️  STATIC_DIR no existe: ${STATIC_DIR}`);
  console.warn(`    El frontend no se servirá. Solo el API responderá.`);
}

// Error handler (debe ir al final)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
});

// ─── Arranque ────────────────────────────────────────────────
async function start() {
  console.log(`\n🚀 Master List · arrancando en modo ${NODE_ENV}...\n`);
  const ok = await pingCosmos();
  if (!ok) {
    console.error('   Saliendo. Revisa las credenciales (COSMOS_ENDPOINT, COSMOS_KEY)\n');
    process.exit(1);
  }

  // Seeds (idempotentes — no hacen nada si ya existen)
  try {
    await ensureUsersSeeded();
    await ensureAttachmentsContainer();
  } catch (err: any) {
    console.error('⚠️  Error en seeds:', err.message);
  }

  app.listen(PORT, () => {
    if (isProduction) {
      console.log(`\n✅ Servidor listo en puerto ${PORT}`);
      console.log(`   Frontend + API en el mismo origen`);
    } else {
      console.log(`\n✅ API lista en http://localhost:${PORT}`);
      console.log(`   CORS permitido: ${CORS_ORIGINS.join(', ')}`);
      console.log(`\n   Endpoints públicos:`);
      console.log(`   GET  /api/health`);
      console.log(`   GET  /api/initiatives`);
      console.log(`   GET  /api/initiatives/:id`);
      console.log(`   GET  /api/initiatives/:id/comments`);
      console.log(`   POST /api/initiatives/:id/comments`);
      console.log(`\n   Endpoints admin:`);
      console.log(`   POST   /api/admin/login`);
      console.log(`   GET    /api/admin/verify (requiere Bearer)`);
      console.log(`   PATCH  /api/initiatives/:id (requiere Bearer)`);
      console.log(`   DELETE /api/initiatives/:id/comments/:cid (requiere Bearer)\n`);
    }
  });
}

start();
