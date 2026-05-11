import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import type { Filters, Iniciativa } from '../../types';
import { EMPTY_FILTERS } from '../../utils/filters';
import { FRAMEWORK_DIMENSIONS } from '../../utils/framework';

interface FilterGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  colorMap?: Record<string, string>;
}

function FilterGroup({ label, options, selected, onChange }: FilterGroupProps) {
  const [open, setOpen] = useState(true);
  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  return (
    <div className="border-b border-gray-100 pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2 text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-800"
      >
        {label}
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="space-y-1 mt-1">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-brand-500 w-3.5 h-3.5 rounded"
              />
              <span className="text-xs text-gray-600 group-hover:text-gray-900 leading-tight">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  data: Iniciativa[];
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function Sidebar({ data, filters, onChange }: SidebarProps) {
  const u = (key: keyof Filters, vals: string[]) => onChange({ ...filters, [key]: vals });
  const uniqueVals = (key: keyof Iniciativa) =>
    [...new Set(data.map(i => String(i[key] ?? '').trim()).filter(Boolean))].sort();

  const activeCount = Object.entries(filters)
    .filter(([k, v]) => k !== 'search' && Array.isArray(v) && v.length > 0).length;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-100 overflow-y-auto scrollbar-thin h-full" data-tour="sidebar-filters">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">Filtros</h2>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            <X size={12} /> Limpiar ({activeCount})
          </button>
        )}
      </div>
      <div className="px-4 py-3">
        {/* Search */}
        <div className="mb-3">
          <input
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar iniciativa..."
            className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50"
          />
        </div>
        <div className="space-y-1">
          <FilterGroup label="País / Empresa" options={uniqueVals('empresa')} selected={filters.empresa} onChange={v => u('empresa', v)} />
          <FilterGroup label="Área de Negocio" options={uniqueVals('area')} selected={filters.area} onChange={v => u('area', v)} />
          <FilterGroup label="Sub Área" options={uniqueVals('subArea')} selected={filters.subArea} onChange={v => u('subArea', v)} />
          <FilterGroup label="Estado" options={uniqueVals('estado')} selected={filters.estado} onChange={v => u('estado', v)} />
          <FilterGroup label="Capacidad estratégica" options={FRAMEWORK_DIMENSIONS.map(d => d.name)} selected={filters.dimension} onChange={v => u('dimension', v)} />
          <FilterGroup label="Categoría" options={uniqueVals('categoria')} selected={filters.categoria} onChange={v => u('categoria', v)} />
          <FilterGroup label="Tipo" options={uniqueVals('tipo')} selected={filters.tipo} onChange={v => u('tipo', v)} />
          <FilterGroup label="Prioridad" options={uniqueVals('prioridad')} selected={filters.prioridad} onChange={v => u('prioridad', v)} />
          <FilterGroup label="Costo Estimado" options={[...new Set(data.map(i => (i.costoEstimado ?? '').trim()).filter(Boolean))].sort()} selected={filters.costoEstimado} onChange={v => u('costoEstimado', v)} />
          <FilterGroup label="Madurez Objetivo" options={uniqueVals('nivelMadurez')} selected={filters.nivelMadurez} onChange={v => u('nivelMadurez', v)} />
        </div>
      </div>
    </aside>
  );
}
