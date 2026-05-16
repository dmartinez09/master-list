/**
 * Hook para detectar si una iniciativa fue modificada después de la última vez
 * que el usuario actual la vio. La "marca de visto" se guarda en localStorage,
 * por usuario (admin o cada manager) para que sea independiente.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_PREFIX = 'ta_seen';

function getKey(viewer: string): string {
  return `${STORAGE_PREFIX}_${viewer}`;
}

function readMap(viewer: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(getKey(viewer)) ?? '{}'); }
  catch { return {}; }
}

function writeMap(viewer: string, map: Record<string, string>) {
  localStorage.setItem(getKey(viewer), JSON.stringify(map));
  window.dispatchEvent(new Event('ta:seen-changed'));
}

export function getViewerKey(session: { role: string; userId?: string } | null): string {
  if (!session) return 'guest';
  if (session.role === 'admin') return 'admin';
  return session.userId ?? 'guest';
}

/** Devuelve true si la iniciativa fue modificada después de la última vez que se vio */
export function useIsUnseen(initiativeId: string, lastModifiedAt?: string | null): boolean {
  const { session } = useAuth();
  const viewer = getViewerKey(session);
  const [unseen, setUnseen] = useState(false);

  useEffect(() => {
    if (!lastModifiedAt) { setUnseen(false); return; }
    const recompute = () => {
      const map = readMap(viewer);
      const seenAt = map[initiativeId];
      setUnseen(!seenAt || lastModifiedAt > seenAt);
    };
    recompute();
    const handler = () => recompute();
    window.addEventListener('ta:seen-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('ta:seen-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, [initiativeId, lastModifiedAt, viewer]);

  return unseen;
}

/** Marca la iniciativa como vista por el usuario actual */
export function useMarkSeen() {
  const { session } = useAuth();
  return (initiativeId: string, lastModifiedAt?: string | null) => {
    const viewer = getViewerKey(session);
    const map = readMap(viewer);
    map[initiativeId] = lastModifiedAt ?? new Date().toISOString();
    writeMap(viewer, map);
  };
}
