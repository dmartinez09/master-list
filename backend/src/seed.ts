/**
 * Script de migración: lee initiatives_raw.json del frontend y carga los 174 hallazgos
 * en Cosmos DB. Idempotente — usa upsert, así que se puede correr múltiples veces.
 *
 * Uso: npm run seed
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cosmosClient, cosmosConfig, initiativesContainer, commentsContainer } from './lib/cosmos.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, '../../src/data/initiatives_raw.json');

interface RawInitiative {
  id: string;
  [key: string]: any;
}

async function ensureDatabaseAndContainers() {
  console.log('🔧 Asegurando que database y containers existen...');

  // Crea database si no existe
  const { database } = await cosmosClient.databases.createIfNotExists({
    id: cosmosConfig.databaseId,
  });
  console.log(`   ✓ Database "${database.id}"`);

  // Containers (si ya existen, no falla)
  const { container: c1 } = await database.containers.createIfNotExists({
    id: cosmosConfig.initiativesContainerId,
    partitionKey: { paths: ['/id'] },
  });
  console.log(`   ✓ Container "${c1.id}" (partition: /id)`);

  const { container: c2 } = await database.containers.createIfNotExists({
    id: cosmosConfig.commentsContainerId,
    partitionKey: { paths: ['/initiativeId'] },
  });
  console.log(`   ✓ Container "${c2.id}" (partition: /initiativeId)`);
}

async function migrateInitiatives() {
  console.log(`\n📂 Leyendo ${JSON_PATH}...`);
  const raw = readFileSync(JSON_PATH, 'utf-8');
  const items: RawInitiative[] = JSON.parse(raw);
  const valid = items.filter(i => i.id && i.id.startsWith('ID-'));
  console.log(`   Encontrados ${valid.length} hallazgos válidos (de ${items.length} totales)\n`);

  let ok = 0;
  let failed = 0;

  for (const item of valid) {
    try {
      // Agregamos metadatos de auditoría
      const doc = {
        ...item,
        _migrated_at: new Date().toISOString(),
      };
      await initiativesContainer.items.upsert(doc);
      ok++;
      if (ok % 25 === 0) process.stdout.write(`   ✓ ${ok}/${valid.length} cargados\n`);
    } catch (err: any) {
      failed++;
      console.error(`   ✗ ${item.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ Migración completada: ${ok} cargados, ${failed} fallidos\n`);
}

async function main() {
  console.log('🚀 Migración a Cosmos DB\n');
  console.log(`   Endpoint: ${cosmosConfig.endpoint}`);
  console.log(`   Database: ${cosmosConfig.databaseId}\n`);

  try {
    await ensureDatabaseAndContainers();
    await migrateInitiatives();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Error fatal:', err.message);
    if (err.code) console.error(`   Cosmos code: ${err.code}`);
    process.exit(1);
  }
}

main();
