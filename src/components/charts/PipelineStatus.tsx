import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STAGES = [
  { label: 'Completadas', count: 33, color: '#00A651', pct: 19, estado: 'Finalizado', icon: '✓' },
  { label: 'En ejecución', count: 31, color: '#2563eb', pct: 18, estado: 'En proceso 75% - +', icon: '▶' },
  { label: 'Próximas', count: 20, color: '#7c3aed', pct: 11, estado: 'Próximo (Backlog listo)', icon: '◎' },
  { label: 'Pipeline', count: 83, color: '#94a3b8', pct: 48, estado: 'Solicitado / A validar', icon: '○' },
  { label: 'Bloqueadas', count: 7, color: '#dc2626', pct: 4, estado: 'Bloqueado', icon: '⊘' },
];

const TOTAL = 174;

function SegmentedBar({ animated }: { animated: boolean }) {
  return (
    <div className="flex h-5 rounded-xl overflow-hidden gap-0.5">
      {STAGES.map((s, i) => (
        <div
          key={s.label}
          className="relative overflow-hidden transition-all duration-700 ease-out flex items-center justify-center"
          style={{
            width: animated ? `${s.pct}%` : '0%',
            backgroundColor: s.color,
            transitionDelay: `${i * 80}ms`,
          }}
          title={`${s.label}: ${s.count}`}
        >
          {s.pct > 8 && (
            <span className="text-[9px] font-bold text-white">{s.pct}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function PipelineStatus() {
  const [animated, setAnimated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const enEjecucion = 31;
  const completadas = 33;

  return (
    <div>
      {/* Segmented bar */}
      <SegmentedBar animated={animated} />

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {STAGES.map(s => (
          <button
            key={s.label}
            onClick={() => navigate('/portafolio')}
            className="flex items-center gap-2 p-2.5 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-left group"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs"
              style={{ backgroundColor: s.color }}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 group-hover:text-gray-900">{s.count}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
        <p className="text-xs text-gray-600">
          <strong className="text-brand-700">{completadas + enEjecucion}</strong> de <strong>{TOTAL}</strong> iniciativas completadas o en ejecución activa —{' '}
          <strong className="text-brand-700">{Math.round(((completadas + enEjecucion) / TOTAL) * 100)}%</strong> del portafolio con tracción real.
        </p>
      </div>
    </div>
  );
}
