import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Navbar } from '../components/ui/Navbar';
import { InitiativeCard } from '../components/InitiativeCard';
import { InitiativeModal } from '../components/InitiativeModal';
import { useInitiatives } from '../contexts/InitiativesContext';
import { FRAMEWORK_DIMENSIONS } from '../utils/framework';
import type { Iniciativa } from '../types';

const PRIO_ORDER = ['Alta', 'Media', 'Baja'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

function HeatmapCell({ count, max, color }: { count: number; max: number; color: string }) {
  const intensity = max > 0 ? count / max : 0;
  // Generate gradient from white to the dimension's accent color
  const bg = intensity === 0
    ? '#f9fafb'
    : `color-mix(in srgb, ${color} ${Math.round(intensity * 75 + 10)}%, white)`;
  const textColor = intensity > 0.55 ? '#fff' : '#1a1f2e';
  return (
    <div
      className="flex items-center justify-center text-xs font-bold rounded transition-all"
      style={{ backgroundColor: bg, color: textColor, height: 36 }}
    >
      {count > 0 ? count : ''}
    </div>
  );
}

export default function Countries() {
  const { initiatives, loading } = useInitiatives();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [modalInit, setModalInit] = useState<Iniciativa | null>(null);

  const EMPRESAS = useMemo(() => [...new Set(initiatives.map(i => i.empresa.trim()))].sort(), [initiatives]);
  const AREAS = useMemo(() => [...new Set(initiatives.map(i => i.area.trim()).filter(Boolean))].sort(), [initiatives]);

  const filtered = useMemo(() =>
    initiatives.filter(i =>
      (!selectedEmpresa || i.empresa.trim() === selectedEmpresa) &&
      (!selectedArea || i.area.trim() === selectedArea)
    ), [initiatives, selectedEmpresa, selectedArea]
  );

  // Distribution by framework dimension
  const byDim = useMemo(() => {
    const map: Record<string, number> = {};
    FRAMEWORK_DIMENSIONS.forEach(d => { map[d.name] = 0; });
    filtered.forEach(i => {
      const fd = i.frameworkDimension;
      if (fd && map[fd] !== undefined) map[fd] += 1;
    });
    return FRAMEWORK_DIMENSIONS.map(d => ({
      name: d.short,
      fullName: d.name,
      framework: d.framework,
      value: map[d.name] ?? 0,
      color: d.color,
    }));
  }, [filtered]);

  // Heatmap: área vs framework dimension
  const heatmapAreas = useMemo(() => selectedEmpresa
    ? [...new Set(filtered.map(i => i.area.trim()).filter(Boolean))].sort()
    : AREAS,
  [selectedEmpresa, filtered, AREAS]);

  const heatmap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    heatmapAreas.forEach(a => {
      map[a] = {};
      FRAMEWORK_DIMENSIONS.forEach(d => { map[a][d.name] = 0; });
    });
    initiatives
      .filter(i => !selectedEmpresa || i.empresa.trim() === selectedEmpresa)
      .forEach(i => {
        const a = i.area.trim();
        const d = i.frameworkDimension;
        if (map[a] && d) map[a][d] = (map[a][d] ?? 0) + 1;
      });
    return map;
  }, [initiatives, selectedEmpresa, heatmapAreas]);

  const heatmapMax = useMemo(() => {
    let max = 0;
    Object.values(heatmap).forEach(row => Object.values(row).forEach(v => { if (v > max) max = v; }));
    return max;
  }, [heatmap]);

  const sortedInitiatives = useMemo(() =>
    [...filtered].sort((a, b) => {
      const pa = PRIO_ORDER.indexOf(a.prioridad.startsWith('Alta') ? 'Alta' : a.prioridad.startsWith('Media') ? 'Media' : 'Baja');
      const pb = PRIO_ORDER.indexOf(b.prioridad.startsWith('Alta') ? 'Alta' : b.prioridad.startsWith('Media') ? 'Media' : 'Baja');
      return pa - pb;
    }), [filtered]
  );

  if (loading && initiatives.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar breadcrumb={['Inicio', 'Visión por País y Área']} />
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-block w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar breadcrumb={['Inicio', 'Visión por País y Área']} />

      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-4 items-end shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">País / Empresa</label>
            <select
              value={selectedEmpresa}
              onChange={e => setSelectedEmpresa(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todos los países</option>
              {EMPRESAS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Área Funcional</label>
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todas las áreas</option>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {(selectedEmpresa || selectedArea) && (
            <button
              onClick={() => { setSelectedEmpresa(''); setSelectedArea(''); }}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          )}
          <div className="ml-auto text-xs text-gray-500">
            <strong className="text-gray-800">{filtered.length}</strong> iniciativas
          </div>
        </div>

        {/* By framework dimension */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Iniciativas por capacidad estratégica</h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Distribución según el framework de madurez tecnológica del Grupo (Gartner ITScore + CMMI + NIST CSF + DAMA-DMBOK + Gartner AI).
            Cada barra representa una de las 4 capacidades que se construyen en simultáneo.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDim} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Iniciativas" radius={[6, 6, 0, 0]}>
                {byDim.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend with framework references */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {byDim.map(d => (
              <div key={d.fullName} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `${d.color}14` }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: d.color }} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold leading-tight" style={{ color: d.color }}>{d.fullName}</p>
                  <p className="text-[9px] text-gray-500 italic">{d.framework}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Mapa de calor — Área de negocio × capacidad estratégica</h3>
          <p className="text-xs text-gray-500 mb-4">
            Identifica qué área concentra más iniciativas en cada capacidad. Color más intenso = mayor concentración.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 font-semibold text-gray-500 w-44">Área</th>
                  {FRAMEWORK_DIMENSIONS.map(d => (
                    <th key={d.name} className="text-center py-2 px-1 font-semibold" style={{ minWidth: 110 }}>
                      <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.short}</span>
                      <br />
                      <span className="text-[9px] text-gray-400 font-normal">{d.framework}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapAreas.map(area => (
                  <tr key={area}>
                    <td className="pr-3 py-0.5 text-gray-700 font-medium whitespace-nowrap">{area}</td>
                    {FRAMEWORK_DIMENSIONS.map(d => (
                      <td key={d.name} className="px-1 py-0.5">
                        <HeatmapCell count={heatmap[area]?.[d.name] ?? 0} max={heatmapMax} color={d.color} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
            <span className="font-medium">Cómo leer:</span>
            <span>cada celda muestra el número de iniciativas del área en esa capacidad. Sin valor = 0.</span>
          </div>
        </div>

        {/* Prioritized list */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-1">Lista priorizada de iniciativas</h3>
          <p className="text-xs text-gray-500 mb-4">Ordenadas por prioridad (Alta primero). Clic para ver detalle ejecutivo.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedInitiatives.slice(0, 30).map(i => (
              <InitiativeCard key={i.id} iniciativa={i} onClick={setModalInit} />
            ))}
          </div>
          {sortedInitiatives.length > 30 && (
            <p className="text-xs text-gray-400 mt-4 text-center">Mostrando 30 de {sortedInitiatives.length}. Usa filtros para refinar.</p>
          )}
        </div>
      </div>

      {modalInit && <InitiativeModal iniciativa={modalInit} onClose={() => setModalInit(null)} />}
    </div>
  );
}
