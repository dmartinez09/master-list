export type Estado =
  | 'Solicitado / A validar'
  | 'En Espera de TI / TA'
  | 'Próximo (Backlog listo)'
  | 'En proceso 0% - 25%'
  | 'En proceso 25% - 50%'
  | 'En proceso 51% - 75%'
  | 'En proceso 75% - +'
  | 'Aprobación Final'
  | 'Finalizado'
  | 'Fuera del Plan'
  | 'Bloqueado';

export type Rol = 'Foundation' | 'Enabler' | 'Outcome' | 'Hygiene';
export type Dimension =
  | 'Transformación Digital'
  | 'Capacidad Organizacional'
  | 'Gobierno y Procesos'
  | 'Cumplimiento y Riesgo'
  | 'Experiencia';

export type NivelImpacto = 'L1 - Estructural' | 'L2 - Habilitador' | 'L3 - Mejora puntual';
export type Prioridad = 'Alta' | 'Media' | 'Baja';
export type Complejidad = 'Alta' | 'Media' | 'Baja';
export type Tipo = 'Iniciativa corporativa' | 'Proyecto' | 'Tarea';
export type Categoria =
  | 'Automatización & BI'
  | 'ERP & Sistemas'
  | 'Integración & Desarrollo'
  | 'CRM & Ventas'
  | 'Capacitación & Gestión del Cambio'
  | 'Infraestructura'
  | 'Procesos & Documentación';

export interface Iniciativa {
  id: string;
  subArea: string;
  estado: Estado;
  empresa: string;
  area: string;
  solicitante: string;
  titulo: string;
  descripcion: string;
  objetivos: string;
  puntosDolor: string;
  planAccion: string;
  cuellosBottela: string;
  bloqueadores: string;
  solicitudTipo: string;
  categoria: Categoria | string;
  tipo: Tipo | string;
  prioridad: Prioridad | string;
  tiempoRequerido: string;
  fechaInicioProy: string;
  fechaInicioReal: string;
  fechaTerminoReal: string;
  complejidad: Complejidad | string;
  recursosFuera: string;
  recursosTA: string;
  recursosNuevos: string;
  sistemas: string;
  costoEstimado: string;
  costoReal: string;
  ahorro: string;
  dimension: Dimension | string;
  nivelMadurez: string;
  nivelImpacto: NivelImpacto | string;
  rol: Rol | string;
  frameworkDimension?: string;
}

export interface EstadoCatalog {
  estado: Estado;
  significado: string;
  avance: string;
  avancePct: number;
}

export interface DimensionCatalog {
  nombre: Dimension;
  queRobustece: string;
  preguntasResponde: string;
  estadoActual: string;
  nivelActual: number;
  objetivo2027: number;
  brecha: string;
  cuello: string;
}

export interface NivelMadurezCatalog {
  nivel: number;
  nombre: string;
  descripcion: string;
  comoSeVe: string;
}

export interface NivelImpactoCatalog {
  nivel: NivelImpacto;
  significado: string;
  ejemplos: string;
}

export interface RolCatalog {
  rol: Rol;
  queSignifica: string;
  comoIdentificarla: string;
}

export interface CategoriaCatalog {
  nombre: Categoria | string;
  significado: string;
}

export interface Filters {
  empresa: string[];
  area: string[];
  subArea: string[];
  estado: string[];
  categoria: string[];
  tipo: string[];
  dimension: string[];
  nivelMadurez: string[];
  prioridad: string[];
  costoEstimado: string[];
  search: string;
}
