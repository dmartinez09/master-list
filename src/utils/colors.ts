export const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Finalizado':              { bg: 'bg-brand-100', text: 'text-brand-800', dot: 'bg-brand-500' },
  'En proceso 75% - +':     { bg: 'bg-brand-100', text: 'text-brand-700', dot: 'bg-brand-400' },
  'Aprobación Final':        { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'En proceso 51% - 75%':   { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  'En proceso 25% - 50%':   { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'En proceso 0% - 25%':    { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Próximo (Backlog listo)': { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  'En Espera de TI / TA':   { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  'Solicitado / A validar':  { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  'Bloqueado':               { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  'Fuera del Plan':          { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export const ROL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Foundation: { bg: 'bg-brand-600', text: 'text-white', border: 'border-brand-700' },
  Enabler:    { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' },
  Outcome:    { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700' },
  Hygiene:    { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
};

export const DIMENSION_COLORS: Record<string, { accent: string; light: string }> = {
  'Transformación Digital':    { accent: '#00A651', light: '#f0faf4' },
  'Capacidad Organizacional':  { accent: '#2563eb', light: '#eff6ff' },
  'Gobierno y Procesos':       { accent: '#7c3aed', light: '#f5f3ff' },
  'Cumplimiento y Riesgo':     { accent: '#dc2626', light: '#fef2f2' },
  'Experiencia':               { accent: '#d97706', light: '#fffbeb' },
};

export const DIMENSION_BADGE: Record<string, string> = {
  'Transformación Digital':    'bg-brand-100 text-brand-800',
  'Capacidad Organizacional':  'bg-blue-100 text-blue-800',
  'Gobierno y Procesos':       'bg-violet-100 text-violet-800',
  'Cumplimiento y Riesgo':     'bg-red-100 text-red-800',
  'Experiencia':               'bg-amber-100 text-amber-800',
};

export const PRIORIDAD_COLORS: Record<string, string> = {
  Alta:  'text-red-600 font-semibold',
  Media: 'text-amber-600 font-medium',
  Baja:  'text-slate-500',
};

export const COSTO_COLORS: Record<string, string> = {
  '$0k':     'bg-gray-100 text-gray-600',
  '<$5k':    'bg-brand-50 text-brand-700',
  '$5–10k':  'bg-blue-50 text-blue-700',
  '=>$10k':  'bg-violet-50 text-violet-700',
  ' =>$10k': 'bg-violet-50 text-violet-700',
};

export const RECHARTS_PALETTE = [
  '#00A651', '#2563eb', '#7c3aed', '#dc2626', '#d97706',
  '#0891b2', '#059669', '#9333ea', '#ea580c', '#64748b',
];
