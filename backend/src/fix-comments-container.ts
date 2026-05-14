/**
 * Recrea el container `comments` con partition key correcta /initiativeId.
 * Los comentarios actuales se respaldan, se borra el container y se vuelve a crear
 * con la configuración correcta, luego se re-insertan.
 */
import { cosmosClient, cosmosConfig } from './lib/cosmos.js';

async function main() {
  const database = cosmosClient.database(cosmosConfig.databaseId);
  const oldContainer = database.container(cosmosConfig.commentsContainerId);

  console.log('1. Leyendo comentarios actuales...');
  const { resources } = await oldContainer.items
    .query('SELECT * FROM c')
    .fetchAll();
  console.log(`   ${resources.length} comentarios encontrados`);

  // Filtrar campos internos antes de re-insertar
  const cleanComments = resources.map((c: any) => {
    const { _rid, _self, _etag, _attachments, _ts, ...rest } = c;
    return rest;
  });

  console.log('\n2. Inspeccionando partition key actual...');
  const { resource: def } = await oldContainer.read();
  console.log(`   Path actual: ${JSON.stringify(def?.partitionKey?.paths)}`);

  if (def?.partitionKey?.paths?.[0] === '/initiativeId') {
    console.log('\n✅ El container ya tiene la PK correcta. Nada que hacer.');
    process.exit(0);
  }

  console.log('\n3. Eliminando container antiguo...');
  await oldContainer.delete();
  console.log('   ✓ Container "comments" eliminado');

  console.log('\n4. Creando container con PK correcta /initiativeId...');
  const { container: newContainer } = await database.containers.createIfNotExists({
    id: cosmosConfig.commentsContainerId,
    partitionKey: { paths: ['/initiativeId'] },
  });
  console.log(`   ✓ Container "${newContainer.id}" creado`);

  console.log('\n5. Re-insertando comentarios...');
  let ok = 0;
  for (const c of cleanComments) {
    try {
      await newContainer.items.create(c);
      ok++;
      console.log(`   ✓ ${c.id} (${c.initiativeId})`);
    } catch (err: any) {
      console.error(`   ✗ ${c.id}: ${err.message}`);
    }
  }

  console.log(`\n✅ Listo. ${ok}/${cleanComments.length} comentarios recuperados.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
