import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../components/ui/Navbar';
import { Sidebar } from '../components/ui/Sidebar';
import { InitiativeCard } from '../components/InitiativeCard';
import { InitiativeModal } from '../components/InitiativeModal';
import { initiatives } from '../data/initiatives';
import { PIPELINE_ORDER } from '../data/catalogs';
import { applyFilters, EMPTY_FILTERS } from '../utils/filters';
import type { Filters, Iniciativa } from '../types';
import { EstadoBadge } from '../components/ui/Badge';
import { LayoutGrid, Table2, Download, ChevronRight } from 'lucide-react';
import { PortfolioTour } from '../components/ui/Tour';

type ViewMode = 'pipeline' | 'table';

function exportCSV(data: Iniciativa[]) {
  const cols: (keyof Iniciativa)[] = [
    'id', 'titulo', 'empresa', 'area', 'estado', 'prioridad', 'frameworkDimension',
    'costoEstimado', 'tiempoRequerido', 'solicitante',
  ];
  const header = ['ID','Título','País','Área','Estado','Prioridad','Capacidad','Costo','Tiempo','Solicitante'];
  const rows = data.map(i => cols.map(c => `"${String(i[c] ?? '').replace(/"/g, '""')}"`).join(','));
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'portafolio-ta.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Portfolio() {
  const location = useLocation();
  const initialFilters: Filters = {
    ...EMPTY_FILTERS,
    ...((location.state as Partial<Filters>) ?? {}),
  };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [view, setView] = useState<ViewMode>(
    ((location.state as { view?: ViewMode })?.view) ?? 'pipeline'
  );
  const [selected, setSelected] = useState<Iniciativa | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const kanbanRef = useRef<HTMLDivElement>(null);

  const getTrack = () =>
    kanbanRef.current?.querySelector<HTMLElement>('.pipeline-track') ?? null;

  // Apply navigation state when arriving with new filters
  useEffect(() => {
    const s = location.state as Partial<Filters> & { view?: ViewMode } | null;
    if (s) {
      setFilters({ ...EMPTY_FILTERS, ...s });
      if (s.view) setView(s.view);
    }
    window.scrollTo(0, 0);
    if (kanbanRef.current) kanbanRef.current.scrollTop = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const filtered = useMemo(() => applyFilters(initiatives, filters), [filters]);

  const byEstado = useMemo(() => {
    const map: Record<string, Iniciativa[]> = {};
    PIPELINE_ORDER.forEach(e => { map[e] = []; });
    filtered.forEach(i => {
      if (map[i.estado]) map[i.estado].push(i);
      else map['Solicitado / A validar'].push(i);
    });
    return map;
  }, [filtered]);

  // Show scroll hint when results exist but are hidden in far-right columns
  useEffect(() => {
    if (view !== 'pipeline') { setShowScrollHint(false); return; }
    const firstFourEmpty = PIPELINE_ORDER.slice(0, 4).every(e => (byEstado[e] ?? []).length === 0);
    if (filtered.length > 0 && firstFourEmpty) {
      setShowScrollHint(true);
      const track = getTrack();
      if (track) track.scrollLeft = 0;
    } else {
      setShowScrollHint(false);
    }
  }, [byEstado, view, filtered.length]);

  // Hide hint when user scrolls the pipeline-track
  useEffect(() => {
    if (!showScrollHint) return;
    const track = getTrack();
    if (!track) return;
    const hide = () => setShowScrollHint(false);
    track.addEventListener('scroll', hide);
    return () => track.removeEventListener('scroll', hide);
  }, [showScrollHint]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar breadcrumb={['Inicio', 'Portafolio de Iniciativas']} />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <Sidebar data={initiatives} filters={filters} onChange={setFilters} />

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shrink-0">
            <div>
              <h1 className="text-sm font-bold text-gray-800">Portafolio de Iniciativas TA</h1>
              <p className="text-xs text-gray-500">{filtered.length} de {initiatives.length} iniciativas</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(filtered)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-medium"
              >
                <Download size={13} /> Exportar CSV
              </button>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden" data-tour="view-toggle">
                {(['pipeline', 'table'] as ViewMode[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      view === v ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {v === 'pipeline' ? <><LayoutGrid size={13} /> Kanban</> : <><Table2 size={13} /> Tabla</>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            ref={kanbanRef}
            className="flex-1 overflow-auto scrollbar-thin p-4"
          >
            {view === 'pipeline' ? (
              <PipelineView byEstado={byEstado} onSelect={setSelected} />
            ) : (
              <TableView data={filtered} onSelect={setSelected} />
            )}
          </div>
        </main>
      </div>

      <PortfolioTour />
      {selected && <InitiativeModal iniciativa={selected} onClose={() => setSelected(null)} />}

      {/* Scroll hint arrow */}
      {showScrollHint && view === 'pipeline' && (
        <button
          onClick={() => {
            const track = getTrack();
            if (!track) return;
            const firstNonEmptyIdx = PIPELINE_ORDER.findIndex(e => (byEstado[e] ?? []).length > 0);
            if (firstNonEmptyIdx < 0) return;
            const cols = track.querySelectorAll<HTMLElement>('.pipeline-col');
            const targetCol = cols[firstNonEmptyIdx];
            if (targetCol) {
              const scrollTo = targetCol.offsetLeft - (track.clientWidth / 2) + (targetCol.offsetWidth / 2);
              track.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
            }
          }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1.5 animate-pulse"
          title="Ver resultados"
        >
          <div className="bg-red-500/60 hover:bg-red-500/80 transition-colors text-white rounded-full p-3 shadow-2xl">
            <ChevronRight size={32} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold text-red-600 bg-white/95 px-2 py-0.5 rounded-full shadow">
            Ver resultados
          </span>
        </button>
      )}
    </div>
  );
}

/* ── Pipeline / Kanban view ─────────────────────────────────────── */
function PipelineView({ byEstado, onSelect }: { byEstado: Record<string, Iniciativa[]>; onSelect: (i: Iniciativa) => void }) {
  return (
    <div className="pipeline-track">
      {PIPELINE_ORDER.map(estado => {
        const cols = byEstado[estado] ?? [];
        return (
          <div key={estado} className="pipeline-col">
            <div className="flex items-center gap-2 mb-3">
              <EstadoBadge label={estado} />
              <span className="text-xs text-gray-400 font-bold">{cols.length}</span>
            </div>
            <div className="space-y-2">
              {cols.map(i => (
                <InitiativeCard key={i.id} iniciativa={i} onClick={onSelect} />
              ))}
              {cols.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-300">
                  Sin iniciativas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Table view ─────────────────────────────────────────────────── */
function TableView({ data, onSelect }: { data: Iniciativa[]; onSelect: (i: Iniciativa) => void }) {
  const cols = ['ID', 'Título', 'País', 'Área', 'Estado', 'Prioridad', 'Capacidad', 'Costo', 'Solicitante'];
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {cols.map(c => (
                <th key={c} className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((i, idx) => (
              <tr
                key={i.id}
                onClick={() => onSelect(i)}
                className={`border-b border-gray-50 cursor-pointer hover:bg-brand-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
              >
                <td className="px-3 py-2 font-mono font-bold text-brand-600">{i.id}</td>
                <td className="px-3 py-2 font-medium text-gray-800 max-w-[220px]">
                  <span className="block truncate" title={i.titulo}>{i.titulo}</span>
                </td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{i.empresa}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{i.area}</td>
                <td className="px-3 py-2 whitespace-nowrap"><EstadoBadge label={i.estado} /></td>
                <td className="px-3 py-2 text-gray-600">{i.prioridad}</td>
                <td className="px-3 py-2 text-gray-600 whitespace-nowrap max-w-[140px] truncate">{i.frameworkDimension}</td>
                <td className="px-3 py-2 text-gray-600">{i.costoEstimado}</td>
                <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{i.solicitante}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            No se encontraron iniciativas con los filtros aplicados.
          </div>
        )}
      </div>
    </div>
  );
}
