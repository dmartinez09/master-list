/**
 * Gestión de usuarios (managers del equipo).
 * Los usuarios pueden:
 *   - Crear nuevas tareas (siempre en "Solicitado / A validar")
 *   - Aprobar o marcar a evaluar
 *   - Adjuntar documentos
 *   - Ver todo el portafolio
 * NO pueden mover tareas en el kanban ni editar el estado (eso es admin).
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { usersContainer } from './cosmos.js';

/** Datos del usuario almacenados en Cosmos.
 *  Comparte el container 'initiatives' (campo `type='user'` discrimina). */
export interface UserDoc {
  id: string;             // slug con prefijo: "user-scot-von-bergen"
  type: 'user';
  name: string;
  passwordHash: string;
  order: number;
  role: 'manager';
  createdAt: string;
  passwordChangedAt?: string;
}

/** Usuarios seed según orden y jerarquía solicitada.
 *  Los IDs llevan prefijo "user-" para no colisionar con los IDs de hallazgos (ID-XXX) */
const SEED_USERS: Array<{ id: string; name: string; order: number }> = [
  { id: 'user-scot-von-bergen',   name: 'Scot von Bergen',   order: 1 },
  { id: 'user-facundo-ganin',     name: 'Facundo Ganin',     order: 2 },
  { id: 'user-marina-von-bergen', name: 'Marina von Bergen', order: 3 },
  { id: 'user-suldery-chaguendo', name: 'Suldery Chaguendo', order: 4 },
];

const DEFAULT_PASSWORD = 'Point2026';

/* ─── Password hashing con scrypt (built-in Node) ──────────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hashHex] = stored.split(':');
    if (!salt || !hashHex) return false;
    const computed = scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hashHex, 'hex');
    if (computed.length !== storedBuf.length) return false;
    return timingSafeEqual(computed, storedBuf);
  } catch {
    return false;
  }
}

/* ─── CRUD ──────────────────────────────────────────────────── */

/** Siembra los 4 usuarios si no existen. Idempotente. */
export async function ensureUsersSeeded() {
  const { resources } = await usersContainer.items
    .query("SELECT VALUE c.id FROM c WHERE c.type = 'user'")
    .fetchAll();
  const existing = new Set(resources.map(String));

  let created = 0;
  for (const seed of SEED_USERS) {
    if (!existing.has(seed.id)) {
      const doc: UserDoc = {
        id: seed.id,
        type: 'user',
        name: seed.name,
        passwordHash: hashPassword(DEFAULT_PASSWORD),
        order: seed.order,
        role: 'manager',
        createdAt: new Date().toISOString(),
      };
      await usersContainer.items.create(doc);
      created++;
    }
  }
  if (created > 0) {
    console.log(`   ✓ ${created} usuarios sembrados con password por defecto "${DEFAULT_PASSWORD}"`);
  }
}

export async function listUsersPublic(): Promise<Array<{ id: string; name: string; order: number }>> {
  const { resources } = await usersContainer.items
    .query("SELECT c.id, c.name, c[\"order\"] FROM c WHERE c.type = 'user' ORDER BY c[\"order\"]")
    .fetchAll();
  return resources as Array<{ id: string; name: string; order: number }>;
}

export async function findUser(id: string): Promise<UserDoc | null> {
  const { resources } = await usersContainer.items
    .query({
      query: "SELECT * FROM c WHERE c.id = @id AND c.type = 'user'",
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();
  return (resources[0] as UserDoc) ?? null;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<UserDoc | null> {
  const user = await findUser(id);
  if (!user) return null;
  const updated: UserDoc = {
    ...user,
    passwordHash: hashPassword(newPassword),
    passwordChangedAt: new Date().toISOString(),
  };
  const { resource } = await usersContainer.items.upsert(updated);
  return resource as unknown as UserDoc;
}
