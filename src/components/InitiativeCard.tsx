import React from 'react';
import { MapPin, User, Bell } from 'lucide-react';
import type { Iniciativa } from '../types';
import { DimensionBadge, PrioridadDot, CostoBadge } from './ui/Badge';
import { useIsUnseen } from '../hooks/useUnseen';

interface Props {
  iniciativa: Iniciativa;
  onClick: (i: Iniciativa) => void;
}

/** Considera "anónimo" los solicitantes tipo "Recurso externo 18", "NA - ...", vacío, o solo número */
function isAnonSolicitante(s: string | undefined | null): boolean {
  if (!s) return true;
  const v = s.trim();
  if (!v) return true;
  if (/^recurso\s+externo/i.test(v)) return true;
  if (/^na\b/i.test(v)) return true;
  if (/^\d+$/.test(v)) return true;
  return false;
}

export function InitiativeCard({ iniciativa: i, onClick }: Props) {
  const unseen = useIsUnseen(i.id, (i as any).lastModifiedAt);
  return (
    <div
      onClick={() => onClick(i)}
      className={`card-hover bg-white border rounded-xl p-3.5 cursor-pointer select-none hover:border-brand-300 relative ${
        unseen ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{i.id}</span>
        <div className="flex items-center gap-1">
          {unseen && (
            <span
              className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full"
              title={`Modificado ${new Date((i as any).lastModifiedAt).toLocaleString('es-ES')} por ${(i as any).lastModifiedBy ?? 'alguien'}`}
            >
              <Bell size={9} className="animate-pulse" />
              Nuevo
            </span>
          )}
          <PrioridadDot label={i.prioridad} />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-gray-800 leading-tight mb-2 line-clamp-2">{i.titulo}</h4>

      {/* Meta */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
        <MapPin size={10} className="shrink-0" />
        <span className="truncate">{i.empresa}</span>
        {i.area && <><span>·</span><span className="truncate">{i.area}</span></>}
      </div>
      {!isAnonSolicitante(i.solicitante) && (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2.5">
          <User size={10} className="shrink-0" />
          <span className="truncate">{i.solicitante}</span>
        </div>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-2">
        <DimensionBadge label={i.frameworkDimension ?? i.dimension} />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-1">
        <CostoBadge label={i.costoEstimado} />
        {i.tiempoRequerido && (
          <span className="text-[10px] text-gray-400">{i.tiempoRequerido}</span>
        )}
      </div>
    </div>
  );
}
