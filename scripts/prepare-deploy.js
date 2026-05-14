#!/usr/bin/env node
/**
 * prepare-deploy.js
 *
 * Ejecutar después de:
 *   - npm run build:frontend  (genera ./dist con el bundle de React)
 *   - npm run build:backend   (genera ./backend/dist con los .js compilados)
 *
 * Este script:
 *   1. Copia el bundle del frontend (./dist) dentro de ./backend/public
 *   2. Verifica que ./backend tenga todo lo necesario para correr en Azure
 *
 * Estructura final lista para deploy:
 *   backend/
 *     dist/              ← código backend compilado (.js)
 *     public/            ← bundle frontend (index.html + assets)
 *     node_modules/      ← dependencias backend
 *     package.json
 */
import { existsSync, rmSync, cpSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const frontendDist = join(ROOT, 'dist');
const backendDist = join(ROOT, 'backend', 'dist');
const backendPublic = join(ROOT, 'backend', 'public');

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) total += dirSize(p);
    else total += st.size;
  }
  return total;
}

console.log('\n🔧 Preparando paquete de deploy...\n');

// 1. Validar que frontend está construido
if (!existsSync(frontendDist)) {
  console.error(`❌ Falta el bundle del frontend en: ${frontendDist}`);
  console.error('   Corre "npm run build:frontend" antes.');
  process.exit(1);
}

// 2. Validar que backend está compilado
if (!existsSync(backendDist)) {
  console.error(`❌ Falta el código compilado del backend en: ${backendDist}`);
  console.error('   Corre "npm run build:backend" antes.');
  process.exit(1);
}

// 3. Limpiar y copiar
if (existsSync(backendPublic)) {
  rmSync(backendPublic, { recursive: true, force: true });
}
mkdirSync(backendPublic, { recursive: true });
cpSync(frontendDist, backendPublic, { recursive: true });

const frontendSize = dirSize(backendPublic);
const backendSize = dirSize(backendDist);

console.log(`   ✓ Frontend copiado:  backend/public/ (${fmtSize(frontendSize)})`);
console.log(`   ✓ Backend compilado: backend/dist/   (${fmtSize(backendSize)})`);
console.log('\n✅ Listo para deploy. El artifact a subir es la carpeta "backend/".');
console.log('   Azure ejecutará: node dist/server.js\n');
