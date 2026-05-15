import { CosmosClient, Container } from '@azure/cosmos';
import 'dotenv/config';

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = process.env.COSMOS_DATABASE ?? 'portfolio-db';
const initiativesContainerId = process.env.COSMOS_CONTAINER_INITIATIVES ?? 'initiatives';
const commentsContainerId = process.env.COSMOS_CONTAINER_COMMENTS ?? 'comments';

if (!endpoint || !key) {
  console.error('❌ Falta COSMOS_ENDPOINT o COSMOS_KEY en .env');
  process.exit(1);
}

export const cosmosClient = new CosmosClient({ endpoint, key });
export const database = cosmosClient.database(databaseId);
export const initiativesContainer: Container = database.container(initiativesContainerId);
export const commentsContainer: Container = database.container(commentsContainerId);

/** Alias para ser usado por users + attachments (almacenan tipo=user/attachment en este container) */
export const usersContainer = initiativesContainer;
export const attachmentsContainer = initiativesContainer;

export const cosmosConfig = {
  endpoint,
  databaseId,
  initiativesContainerId,
  commentsContainerId,
};

/** Verifica conectividad con Cosmos. Llamado al arrancar el server. */
export async function pingCosmos() {
  try {
    const { resource } = await database.read();
    console.log(`✅ Cosmos conectado · database "${resource?.id}"`);
    return true;
  } catch (err: any) {
    console.error('❌ No se pudo conectar a Cosmos:', err.message);
    return false;
  }
}
