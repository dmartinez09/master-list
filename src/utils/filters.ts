import type { Iniciativa, Filters } from '../types';

/** Helper para acceder a campos string de forma segura (defensiva contra undefined) */
const s = (v: any): string => v == null ? '' : String(v);

export function applyFilters(data: Iniciativa[], filters: Filters): Iniciativa[] {
  return data.filter((i) => {
    if (filters.empresa.length && !filters.empresa.some(e => s(i.empresa).includes(e))) return false;
    if (filters.area.length && !filters.area.includes(s(i.area))) return false;
    if (filters.subArea.length && !filters.subArea.includes(s(i.subArea))) return false;
    if (filters.estado.length && !filters.estado.includes(s(i.estado))) return false;
    if (filters.categoria.length && !filters.categoria.includes(s(i.categoria))) return false;
    if (filters.tipo.length && !filters.tipo.includes(s(i.tipo))) return false;
    if (filters.dimension.length && !filters.dimension.includes(s(i.frameworkDimension))) return false;
    if (filters.nivelMadurez.length && !filters.nivelMadurez.includes(s(i.nivelMadurez))) return false;
    if (filters.prioridad.length && !filters.prioridad.some(p => s(i.prioridad).startsWith(p))) return false;
    if (filters.costoEstimado.length && !filters.costoEstimado.includes(s(i.costoEstimado).trim())) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${s(i.id)} ${s(i.titulo)} ${s(i.area)} ${s(i.empresa)} ${s(i.solicitante)} ${s(i.descripcion)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const EMPTY_FILTERS: Filters = {
  empresa: [], area: [], subArea: [], estado: [], categoria: [],
  tipo: [], dimension: [], nivelMadurez: [],
  prioridad: [], costoEstimado: [], search: '',
};

export function countBy<T extends string>(data: Iniciativa[], key: keyof Iniciativa): Record<string, number> {
  const out: Record<string, number> = {};
  data.forEach((i) => {
    const v = String(i[key] ?? '').trim();
    if (v) out[v] = (out[v] ?? 0) + 1;
  });
  return out;
}
