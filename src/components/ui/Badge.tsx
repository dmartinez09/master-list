import React from 'react';
import { ESTADO_COLORS, ROL_COLORS } from '../../utils/colors';
import { FRAMEWORK_BADGE } from '../../utils/framework';

interface BadgeProps { label?: string | null; className?: string; }

/** Normaliza el label a string, nunca undefined. Defensa contra registros con campos faltantes. */
function safeLabel(label: string | null | undefined): string {
  if (label === null || label === undefined) return '';
  return String(label).trim();
}

export function EstadoBadge({ label }: BadgeProps) {
  const l = safeLabel(label);
  const c = ESTADO_COLORS[l] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {l || '—'}
    </span>
  );
}

export function RolBadge({ label }: BadgeProps) {
  const l = safeLabel(label);
  const c = ROL_COLORS[l] ?? { bg: 'bg-gray-200', text: 'text-gray-700', border: '' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${c.bg} ${c.text}`}>
      {l || '—'}
    </span>
  );
}

export function DimensionBadge({ label }: BadgeProps) {
  const l = safeLabel(label);
  if (!l) return null;
  const c = (FRAMEWORK_BADGE as Record<string, string>)[l] ?? 'bg-gray-100 text-gray-700 border border-gray-200';
  const short: Record<string, string> = {
    'Datos y Analítica':              'Datos & Analítica',
    'Aplicaciones e Infraestructura': 'Apps & Infra',
    'Ciberseguridad y Gobierno':      'Seguridad & Gobierno',
    'Personas, IA e Innovación':      'Personas & IA',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c}`}>
      {short[l] ?? l}
    </span>
  );
}

export function PrioridadDot({ label }: BadgeProps) {
  const l = safeLabel(label);
  const colors: Record<string, string> = { Alta: 'bg-red-500', Media: 'bg-amber-400', Baja: 'bg-slate-300' };
  const key = l.startsWith('Alta') ? 'Alta' : l;
  return <span className={`w-2 h-2 rounded-full ${colors[key] ?? 'bg-gray-300'}`} title={`Prioridad: ${l || 'sin asignar'}`} />;
}

export function CostoBadge({ label }: BadgeProps) {
  const l = safeLabel(label);
  if (!l) return null;
  const map: Record<string, string> = {
    '$0k': 'bg-gray-100 text-gray-500', '<$5k': 'bg-brand-50 text-brand-700',
    '$5–10k': 'bg-blue-50 text-blue-700', '=>$10k': 'bg-violet-50 text-violet-700',
    ' =>$10k': 'bg-violet-50 text-violet-700',
  };
  const cls = map[l] ?? 'bg-gray-100 text-gray-500';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{l}</span>;
}

export function ImpactoBadge({ label }: BadgeProps) {
  const l = safeLabel(label);
  if (!l) return null;
  const map: Record<string, string> = {
    'L1 - Estructural': 'bg-red-50 text-red-700 border border-red-200',
    'L2 - Habilitador': 'bg-blue-50 text-blue-700 border border-blue-200',
    'L3 - Mejora puntual': 'bg-slate-50 text-slate-600 border border-slate-200',
  };
  const key = Object.keys(map).find(k => l.includes(k.substring(0,5))) ?? '';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[key] ?? 'bg-gray-100 text-gray-600'}`}>
      {l.includes('L1') ? 'L1 Estructural' : l.includes('L2') ? 'L2 Habilitador' : l.includes('L3') ? 'L3 Mejora' : l}
    </span>
  );
}
