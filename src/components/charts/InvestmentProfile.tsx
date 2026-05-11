import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const BANDS = [
  {
    label: 'Sin inversión', value: '$0k', count: 114,
    pct: 65, color: '#00A651',
    msg: 'Usando MS 365, Power BI y ERPs ya instalados',
  },
  {
    label: 'Inversión mínima', value: '<$5k', count: 48,
    pct: 28, color: '#2563eb',
    msg: 'Licencias puntuales o consultorías acotadas',
  },
  {
    label: 'Inversión media', value: '$5–10k', count: 9,
    pct: 5, color: '#7c3aed',
    msg: 'Proyectos con alcance definido y retorno medible',
  },
  {
    label: 'Inversión alta', value: '>$10k', count: 2,
    pct: 1, color: '#dc2626',
    msg: 'Solo 2 iniciativas: SAP B1 Andina y Datawarehouse',
  },
];

export function InvestmentProfile() {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      {/* Headline */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-brand-50 border border-brand-200 rounded-xl">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-800">93% del portafolio: inversión cero o mínima</p>
          <p className="text-xs text-brand-600">Máxima transformación con el presupuesto existente</p>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {BANDS.map((b, i) => (
          <div
            key={b.value}
            onMouseEnter={() => setHovered(b.value)}
            onMouseLeave={() => setHovered(null)}
            className="group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                <span className="text-xs font-semibold text-gray-700">{b.label}</span>
                <span className="text-xs text-gray-400 font-mono">{b.value}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: b.color }}>{b.count} inic.</span>
                <span className="text-xs text-gray-400">{b.pct}%</span>
              </div>
            </div>
            <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg flex items-center pl-2 transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${b.pct}%` : '0%',
                  backgroundColor: b.color,
                  transitionDelay: `${i * 120}ms`,
                  opacity: 0.9,
                }}
              >
                {b.pct > 15 && (
                  <span className="text-[10px] text-white font-semibold truncate">{b.pct}%</span>
                )}
              </div>
              {/* Shimmer on hover */}
              {hovered === b.value && (
                <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />
              )}
            </div>
            {hovered === b.value && (
              <p className="text-[10px] text-gray-500 mt-1 pl-4 fade-in">{b.msg}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Las 2 inversiones altas (+$10k) son las más críticas del Grupo: SAP B1 Andina y el Datawarehouse corporativo.
      </p>
    </div>
  );
}
