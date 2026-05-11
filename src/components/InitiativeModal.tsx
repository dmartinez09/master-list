import React from 'react';
import { X, MapPin, User, Clock, DollarSign, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';
import type { Iniciativa } from '../types';
import { EstadoBadge, DimensionBadge, CostoBadge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { ESTADOS, NIVELES_MADUREZ } from '../data/catalogs';
import { FRAMEWORK_DIMENSIONS } from '../utils/framework';

interface Props { iniciativa: Iniciativa; onClose: () => void; }

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded bg-brand-50 flex items-center justify-center">
          <Icon size={13} className="text-brand-600" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '') return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 flex-1">{value}</span>
    </div>
  );
}

function BulletText({ text }: { text: string }) {
  if (!text) return null;
  const bullets = text.split(/[•\n]/).map(s => s.trim()).filter(s => s.length > 10);
  if (bullets.length <= 1) {
    return <p className="text-sm text-gray-700 leading-relaxed">{text}</p>;
  }
  return (
    <ul className="space-y-2">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
          <span className="leading-relaxed">{b}</span>
        </li>
      ))}
    </ul>
  );
}

export function InitiativeModal({ iniciativa: i, onClose }: Props) {
  const fwName = i.frameworkDimension ?? '';
  const fwDef = FRAMEWORK_DIMENSIONS.find(d => d.name === fwName);
  const estadoDef = ESTADOS.find(e => e.estado === i.estado);
  const madurezNum = parseInt(i.nivelMadurez ?? '0');
  const madurezDef = NIVELES_MADUREZ.find(m => m.nivel === madurezNum);

  const pctMap: Record<string, number> = {
    'Finalizado': 100, 'Aprobación Final': 99,
    'En proceso 75% - +': 82, 'En proceso 51% - 75%': 62,
    'En proceso 25% - 50%': 37, 'En proceso 0% - 25%': 12,
  };
  const avancePct = pctMap[i.estado] ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto scrollbar-thin fade-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{i.id}</span>
                <EstadoBadge label={i.estado} />
              </div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">{i.titulo}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={11}/>{i.empresa}</span>
                {i.area && <span>{i.area}</span>}
                {i.solicitante && <span className="flex items-center gap-1"><User size={11}/>{i.solicitante}</span>}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Progress bar */}
          {avancePct > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Avance</span><span>{estadoDef?.avance ?? '—'}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${avancePct}%` }} />
              </div>
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Tooltip content={<span>{fwDef?.descripcion}</span>}>
              <DimensionBadge label={fwName} />
            </Tooltip>
            <CostoBadge label={i.costoEstimado} />
          </div>
        </div>

        <div className="px-6 py-5 flex-1">
          {/* 1. Resumen ejecutivo */}
          <Section title="Resumen Ejecutivo" icon={Zap}>
            <div className="bg-brand-50 rounded-xl p-4 mb-3">
              <p className="text-sm text-brand-900 leading-relaxed font-medium">{i.descripcion}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Objetivo de negocio</p>
              <p className="text-sm text-gray-700 leading-relaxed">{i.objetivos}</p>
            </div>
          </Section>

          {/* 2. Problema de negocio */}
          <Section title="Problema de Negocio" icon={AlertTriangle}>
            <BulletText text={i.puntosDolor} />
          </Section>

          {/* 3. Solución propuesta */}
          <Section title="Solución Propuesta" icon={CheckCircle}>
            <BulletText text={i.planAccion} />
          </Section>

          {/* 4. Riesgos y cuellos de botella */}
          {(i.cuellosBottela || i.bloqueadores) && (
            <Section title="Riesgos y Cuellos de Botella" icon={AlertTriangle}>
              {i.cuellosBottela && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-amber-600 mb-1">Cuellos de botella identificados</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{i.cuellosBottela}</p>
                </div>
              )}
              {i.bloqueadores && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Estado actual y logros</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{i.bloqueadores}</p>
                </div>
              )}
            </Section>
          )}

          {/* 5. Contribución estratégica */}
          <Section title="Contribución Estratégica" icon={Target}>
            <div className="grid grid-cols-1 gap-3">
              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  Capacidad estratégica que construye
                  {fwDef && <span className="ml-1 text-[10px] text-gray-400 italic">· {fwDef.framework}</span>}
                </p>
                <p className="text-sm font-bold" style={{ color: fwDef?.color ?? '#1f2937' }}>{fwName}</p>
                {fwDef && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{fwDef.descripcion}</p>}
              </div>

              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Madurez Objetivo</p>
                <p className="text-lg font-black text-brand-700">{madurezNum > 0 ? `Nv. ${madurezNum}` : i.nivelMadurez}</p>
                {madurezDef && <p className="text-[10px] text-gray-500">{madurezDef.nombre}</p>}
              </div>
            </div>
          </Section>

          {/* 6. Esfuerzo, costos y plazos */}
          <Section title="Esfuerzo, Costos y Plazos" icon={Clock}>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <InfoRow label="Tipo" value={i.tipo} />
              <InfoRow label="Prioridad" value={i.prioridad} />
              <InfoRow label="Complejidad" value={i.complejidad} />
              <InfoRow label="Tiempo requerido" value={i.tiempoRequerido} />
              <InfoRow label="Inicio proyectado" value={i.fechaInicioProy} />
              <InfoRow label="Inicio real" value={i.fechaInicioReal} />
              <InfoRow label="Término real" value={i.fechaTerminoReal} />
              <InfoRow label="Costo estimado" value={<CostoBadge label={i.costoEstimado} />} />
              {i.costoReal && <InfoRow label="Costo real (USD)" value={i.costoReal} />}
              {i.ahorro && <InfoRow label="Ahorro estimado" value={i.ahorro} />}
              <InfoRow label="Sistemas involucrados" value={i.sistemas} />
              <InfoRow label="Sub Área" value={i.subArea} />
            </div>
          </Section>

          {/* Recursos */}
          {(i.recursosFuera || i.recursosTA || i.recursosNuevos) && (
            <Section title="Recursos Requeridos" icon={User}>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <InfoRow label="Recursos externos a TA" value={i.recursosFuera} />
                <InfoRow label="Recursos de TA" value={i.recursosTA} />
                <InfoRow label="Nuevos recursos" value={i.recursosNuevos} />
              </div>
            </Section>
          )}

          {/* ¿Qué necesita del C-suite? */}
          {i.bloqueadores && i.bloqueadores.toLowerCase().includes('requiere') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">¿Qué necesita del C-suite?</p>
              <p className="text-sm text-red-900">{i.bloqueadores}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
