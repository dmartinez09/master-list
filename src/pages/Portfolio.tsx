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
import { LayoutGrid, Table2, Download, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Settings2, X } from 'lucide-react';
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

function loadColOrder(): string[] {
  try { return JSON.parse(localStorage.getItem('ta_pipeline_cols_order') ?? 'null') ?? [...PIPELINE_ORDER]; }
  catch { return [...PIPELINE_ORDER]; }
}
function loadHiddenCols(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem('ta_pipeline_cols_hidden') ?? '[]')); }
  catch { return new Set<string>(); }
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

  // Column order & visibility
  const [colOrder, setColOrder] = useState<string[]>(loadColOrder);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(loadHiddenCols);
  const [showColMgr, setShowColMgr] = useState(false);

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

  // Persist column preferences
  useEffect(() => {
    localStorage.setItem('ta_pipeline_cols_order', JSON.stringify(colOrder));
  }, [colOrder]);
  useEffect(() => {
    localStorage.setItem('ta_pipeline_cols_hidden', JSON.stringify([...hiddenCols]));
  }, [hiddenCols]);

  const moveCol = (colName: string, dir: -1 | 1) => {
    setColOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(colName);
      if (from === -1) return prev;
      // Find nearest visible neighbour in that direction
      let to = from + dir;
      while (to >= 0 && to < next.length && hiddenCols.has(next[to])) to += dir;
      if (to < 0 || to >= next.length) return prev;
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const moveColByIndex = (idx: number, dir: -1 | 1) => {
    setColOrder(prev => {
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const toggleCol = (col: string) => {
    setHiddenCols(prev => {
      const n = new Set(prev);
      n.has(col) ? n.delete(col) : n.add(col);
      return n;
    });
  };

  const resetCols = () => {
    setColOrder([...PIPELINE_ORDER]);
    setHiddenCols(new Set());
  };

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
    const visibleOrder = colOrder.filter(e => !hiddenCols.has(e));
    const firstFourEmpty = visibleOrder.slice(0, 4).every(e => (byEstado[e] ?? []).length === 0);
    if (filtered.length > 0 && firstFourEmpty) {
      setShowScrollHint(true);
      const track = getTrack();
      if (track) track.scrollLeft = 0;
    } else {
      setShowScrollHint(false);
    }
  }, [byEstado, view, filtered.length, colOrder, hiddenCols]);

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

              {/* Column manager button — only in Kanban */}
              {view === 'pipeline' && (
                <div className="relative">
                  <button
                    onClick={() => setShowColMgr(s => !s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg font-medium transition-colors ${
                      showColMgr
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Settings2 size={13} />
                    Columnas
                    {hiddenCols.size > 0 && (
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full ml-0.5 ${showColMgr ? 'bg-white/25' : 'bg-brand-100 text-brand-700'}`}>
                        -{hiddenCols.size}
                      </span>
                    )}
                  </button>
                  {showColMgr && (
                    <ColumnManager
                      colOrder={colOrder}
                      hiddenCols={hiddenCols}
                      onToggle={toggleCol}
                      onMove={moveColByIndex}
                      onReset={resetCols}
                      onClose={() => setShowColMgr(false)}
                    />
                  )}
                </div>
              )}

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
              <PipelineView
                byEstado={byEstado}
                onSelect={setSelected}
                colOrder={colOrder}
                hiddenCols={hiddenCols}
                onMoveCol={moveCol}
              />
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
            const visibleOrder = colOrder.filter(e => !hiddenCols.has(e));
            const firstNonEmptyIdx = visibleOrder.findIndex(e => (byEstado[e] ?? []).length > 0);
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

/* ── Column manager panel ───────────────────────────────────────── */
function ColumnManager({
  colOrder, hiddenCols, onToggle, onMove, onReset, onClose,
}: {
  colOrder: string[];
  hiddenCols: Set<string>;
  onToggle: (col: string) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const visibleCount = colOrder.filter(c => !hiddenCols.has(c)).length;
  return (
    <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 flex flex-col max-h-[480px]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-800">Gestionar columnas Kanban</span>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold">
            Restablecer
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 py-1">
        {colOrder.map((col, idx) => (
          <div
            key={col}
            className={`flex items-center gap-2 px-4 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
              hiddenCols.has(col) ? 'opacity-50' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={!hiddenCols.has(col)}
              onChange={() => onToggle(col)}
              className="accent-brand-500 w-3.5 h-3.5 shrink-0 cursor-pointer"
            />
            <span className="flex-1 text-xs text-gray-700 leading-tight">{col}</span>
            <div className="flex gap-0.5 shrink-0">
              <button
                onClick={() => onMove(idx, -1)}
                disabled={idx === 0}
                className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                title="Subir"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={() => onMove(idx, 1)}
                disabled={idx === colOrder.length - 1}
                className="p-1 rounded text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors"
                title="Bajar"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between">
        <span>{visibleCount} de {colOrder.length} columnas visibles</span>
        <span className="text-gray-300">Los cambios se guardan automáticamente</span>
      </div>
    </div>
  );
}

/* ── Pipeline / Kanban view ─────────────────────────────────────── */
function PipelineView({
  byEstado, onSelect, colOrder, hiddenCols, onMoveCol,
}: {
  byEstado: Record<string, Iniciativa[]>;
  onSelect: (i: Iniciativa) => void;
  colOrder: string[];
  hiddenCols: Set<string>;
  onMoveCol: (colName: string, dir: -1 | 1) => void;
}) {
  const visible = colOrder.filter(e => !hiddenCols.has(e));

  return (
    <div className="pipeline-track">
      {visible.map((estado, idx) => {
        const cols = byEstado[estado] ?? [];
        const isFirst = idx === 0;
        const isLast = idx === visible.length - 1;
        return (
          <div key={estado} className="pipeline-col">
            <div className="flex items-center gap-1.5 mb-3">
              <EstadoBadge label={estado} />
              <span className="text-xs text-gray-400 font-bold">{cols.length}</span>
              <div className="ml-auto flex items-center gap-0">
                <button
                  onClick={() => onMoveCol(estado, -1)}
                  disabled={isFirst}
                  className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors rounded"
                  title="Mover a la izquierda"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => onMoveCol(estado, 1)}
                  disabled={isLast}
                  className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20 transition-colors rounded"
                  title="Mover a la derecha"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
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
