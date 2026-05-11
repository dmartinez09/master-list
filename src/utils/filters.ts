import type { Iniciativa, Filters } from '../types';

export function applyFilters(data: Iniciativa[], filters: Filters): Iniciativa[] {
  return data.filter((i) => {
    if (filters.empresa.length && !filters.empresa.some(e => i.empresa.includes(e))) return false;
    if (filters.area.length && !filters.area.includes(i.area)) return false;
    if (filters.subArea.length && !filters.subArea.includes(i.subArea)) return false;
    if (filters.estado.length && !filters.estado.includes(i.estado)) return false;
    if (filters.categoria.length && !filters.categoria.includes(i.categoria)) return false;
    if (filters.tipo.length && !filters.tipo.includes(i.tipo)) return false;
    if (filters.dimension.length && !filters.dimension.includes(i.frameworkDimension ?? '')) return false;
    if (filters.nivelMadurez.length && !filters.nivelMadurez.includes(i.nivelMadurez)) return false;
    if (filters.prioridad.length && !filters.prioridad.some(p => i.prioridad.startsWith(p))) return false;
    if (filters.costoEstimado.length && !filters.costoEstimado.includes(i.costoEstimado.trim())) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = `${i.id} ${i.titulo} ${i.area} ${i.empresa} ${i.solicitante} ${i.descripcion}`.toLowerCase();
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
