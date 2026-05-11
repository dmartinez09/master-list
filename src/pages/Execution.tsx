import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip as RTooltip,
} from 'recharts';
import {
  CheckCircle2, Activity, AlertTriangle, Clock, ArrowRight,
  Filter, Trophy, Layers, Target, Zap, MapPin,
} from 'lucide-react';
import { Navbar } from '../components/ui/Navbar';
import { initiatives } from '../data/initiatives';
import { ESTADOS, PIPELINE_ORDER } from '../data/catalogs';
import { useCountUp } from '../hooks/useCountUp';
import type { Iniciativa } from '../types';

/* ═══════════════════════════════════════════════════════════════
   COMPUTED DATA — toda la página opera sobre `initiatives` directamente
═══════════════════════════════════════════════════════════════ */

type EstadoBucket = {
  estado: string;
  count: number;
  pct: number;
  color: string;
  textColor: string;
  meaning: string;
  group: 'completado' | 'progreso' | 'pendiente' | 'bloqueado' | 'descartado';
};

const ESTADO_COLORS: Record<string, { color: string; textColor: string; group: EstadoBucket['group'] }> = {
  'Solicitado / A validar':  { color: '#cbd5e1', textColor: '#1e293b', group: 'pendiente' },
  'En Espera de TI / TA':    { color: '#94a3b8', textColor: '#fff',    group: 'pendiente' },
  'Próximo (Backlog listo)': { color: '#7c3aed', textColor: '#fff',    group: 'pendiente' },
  'En proceso 0% - 25%':     { color: '#bfdbfe', textColor: '#1e3a8a', group: 'progreso' },
  'En proceso 25% - 50%':    { color: '#60a5fa', textColor: '#fff',    group: 'progreso' },
  'En proceso 51% - 75%':    { color: '#3b82f6', textColor: '#fff',    group: 'progreso' },
  'En proceso 75% - +':      { color: '#1d4ed8', textColor: '#fff',    group: 'progreso' },
  'Aprobación Final':        { color: '#10b981', textColor: '#fff',    group: 'progreso' },
  'Finalizado':              { color: '#00A651', textColor: '#fff',    group: 'completado' },
  'Bloqueado':               { color: '#dc2626', textColor: '#fff',    group: 'bloqueado' },
  'Fuera del Plan':          { color: '#e2e8f0', textColor: '#475569', group: 'descartado' },
};

/* ═══════════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════════ */
function ChartCard({ title, subtitle, children, accent, info }: {
  title: string; subtitle?: string; children: React.ReactNode; accent?: string; info?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {accent && <div className="h-1" style={{ background: accent }} />}
      <div className="p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{subtitle}</p>}
        {info && (
          <div className="flex items-start gap-1.5 text-[10px] text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-2 py-1.5 mb-3">
            <Filter size={10} className="shrink-0 mt-0.5" />
            <span className="leading-relaxed">{info}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function AnimatedKpi({ value, label, sub, color = '#00A651', delay = 0, suffix = '', onClick }:
  { value: number; label: string; sub?: string; color?: string; delay?: number; suffix?: string; onClick?: () => void }) {
  const v = useCountUp(value, 1300, delay);
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={`flex flex-col items-center text-center p-4 transition-all ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''} w-full`}
    >
      <span className="text-4xl md:text-5xl font-black leading-none mb-1" style={{ color }}>{v}{suffix}</span>
      <span className="text-xs font-bold text-gray-700 mb-0.5">{label}</span>
      {sub && <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>}
    </Comp>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 1 — EMBUDO COMPLETO DE LOS 11 ESTADOS
═══════════════════════════════════════════════════════════════ */
function FullPipelineFunnel({ data, navigate }: { data: EstadoBucket[]; navigate: (estados: string[]) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 250); return () => clearTimeout(t); }, []);

  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-1.5">
      {data.map((b, i) => {
        const widthPct = (b.count / max) * 100;
        const isHot = hovered === b.estado;
        return (
          <div
            key={b.estado}
            onMouseEnter={() => setHovered(b.estado)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate([b.estado])}
            className="cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-transform"
                style={{ backgroundColor: b.color, color: b.textColor, transform: isHot ? 'scale(1.08)' : 'scale(1)' }}
              >
                {b.count}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-700 truncate">{b.estado}</span>
                  <span className="text-[10px] text-gray-400 ml-2 shrink-0">{b.pct}%</span>
                </div>
                <div className="relative h-5 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out"
                    style={{
                      width: animated ? `${Math.max(widthPct, 4)}%` : '0%',
                      backgroundColor: b.color,
                      transitionDelay: `${i * 60}ms`,
                      opacity: 0.92,
                    }}
                  />
                </div>
              </div>

              <ArrowRight size={13} className="text-gray-300 shrink-0 group-hover:text-brand-500 transition-colors" />
            </div>

            {isHot && (
              <div className="ml-15 mt-1 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg leading-relaxed fade-in" style={{ marginLeft: '60px' }}>
                {b.meaning}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 2 — PROGRESS DETAIL (avance % bucket)
═══════════════════════════════════════════════════════════════ */
function ProgressDetail({ buckets, navigate }: { buckets: EstadoBucket[]; navigate: (estados: string[]) => void }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const stages = buckets.filter(b => b.estado.startsWith('En proceso') || b.estado === 'Aprobación Final');
  const total = stages.reduce((s, b) => s + b.count, 0);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <p className="text-xs font-semibold text-gray-600">Cómo avanzan las {total} iniciativas en ejecución activa</p>
        <span className="text-[10px] text-gray-400">% de progreso →</span>
      </div>

      {/* Progressive horizontal flow */}
      <div className="relative">
        <div className="flex h-12 rounded-xl overflow-hidden shadow-inner">
          {stages.map((s, i) => (
            <div
              key={s.estado}
              onClick={() => navigate([s.estado])}
              className="flex flex-col items-center justify-center cursor-pointer transition-all hover:brightness-110 group"
              style={{
                width: animated ? `${(s.count / total) * 100}%` : '0%',
                backgroundColor: s.color,
                transitionProperty: 'width',
                transitionDuration: '700ms',
                transitionDelay: `${i * 100}ms`,
                minWidth: 60,
              }}
            >
              <span className="text-base font-black text-white drop-shadow">{s.count}</span>
              <span className="text-[9px] text-white/90 font-medium drop-shadow">
                {s.estado.replace('En proceso ', '').replace(' - +', '+').replace('Aprobación', 'Aprob.')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend table */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stages.map(s => (
          <button
            key={s.estado}
            onClick={() => navigate([s.estado])}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[11px] text-gray-700 flex-1 truncate">{s.estado}</span>
            <span className="text-xs font-bold" style={{ color: s.color }}>{s.count}</span>
            <ArrowRight size={11} className="text-gray-300 group-hover:text-brand-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 3 — PRIORITIZATION FLOW (cómo se priorizan)
═══════════════════════════════════════════════════════════════ */
function PrioritizationMatrix({ navigate }: { navigate: (filters: { prioridad?: string[]; estado?: string[] }) => void }) {
  const matrix = useMemo(() => {
    const PRIO = ['Alta', 'Media', 'Baja'];
    const COLS: Array<{ name: string; estados: string[]; color: string }> = [
      { name: 'Completada',   estados: ['Finalizado'], color: '#00A651' },
      { name: 'En Ejecución', estados: ['En proceso 0% - 25%', 'En proceso 25% - 50%', 'En proceso 51% - 75%', 'En proceso 75% - +', 'Aprobación Final'], color: '#2563eb' },
      { name: 'Pendiente',    estados: ['Solicitado / A validar', 'Próximo (Backlog listo)', 'En Espera de TI / TA', 'Fuera del Plan'], color: '#94a3b8' },
      { name: 'Bloqueada',    estados: ['Bloqueado'], color: '#dc2626' },
    ];

    return PRIO.map(p => {
      const rowTotal = initiatives.filter(i => (i.prioridad ?? '').startsWith(p)).length;
      const cells = COLS.map(c => {
        const count = initiatives.filter(i =>
          (i.prioridad ?? '').startsWith(p) && c.estados.includes(i.estado)
        ).length;
        return {
          col: c.name,
          color: c.color,
          estados: c.estados,
          count,
          pct: rowTotal > 0 ? Math.round((count / rowTotal) * 100) : 0,
        };
      });
      return { prio: p, total: rowTotal, cells };
    });
  }, []);

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1.5 pr-3 text-gray-500 font-semibold w-32">Prioridad</th>
              {matrix[0].cells.map(c => (
                <th key={c.col} className="text-center py-1.5 px-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${c.color}15`, color: c.color }}>{c.col}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => {
              const prioColor = ri === 0 ? '#dc2626' : ri === 1 ? '#d97706' : '#64748b';
              return (
                <tr key={row.prio} className="border-t border-gray-50">
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => navigate({ prioridad: [row.prio] })}
                      className="font-bold hover:underline"
                      style={{ color: prioColor }}
                    >
                      {row.prio} ({row.total})
                    </button>
                  </td>
                  {row.cells.map(cell => {
                    const k = `${row.prio}-${cell.col}`;
                    const isHot = hovered === k;
                    const intensity = cell.pct / 100;
                    return (
                      <td key={cell.col} className="py-2 px-2 text-center">
                        <button
                          onMouseEnter={() => setHovered(k)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => navigate({ prioridad: [row.prio], estado: cell.estados })}
                          className="w-full rounded-xl p-2.5 cursor-pointer transition-all hover:scale-105"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${cell.color} ${Math.round(intensity * 35)}%, white)`,
                            border: isHot ? `2px solid ${cell.color}` : '2px solid transparent',
                            boxShadow: isHot ? `0 4px 12px ${cell.color}33` : 'none',
                          }}
                        >
                          <div className="text-xl font-black" style={{ color: cell.color }}>{cell.count}</div>
                          <div className="text-[9px]" style={{ color: cell.color, opacity: 0.7 }}>{cell.pct}%</div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 4 — VELOCITY POR PAÍS
═══════════════════════════════════════════════════════════════ */
function CountryVelocity({ navigate }: { navigate: (empresa: string) => void }) {
  const data = useMemo(() => {
    const map: Record<string, { total: number; finalizado: number; ejecucion: number; pendiente: number; bloqueado: number }> = {};
    initiatives.forEach(i => {
      const e = i.empresa.trim();
      if (!map[e]) map[e] = { total: 0, finalizado: 0, ejecucion: 0, pendiente: 0, bloqueado: 0 };
      map[e].total += 1;
      if (i.estado === 'Finalizado') map[e].finalizado += 1;
      else if (i.estado.startsWith('En proceso') || i.estado === 'Aprobación Final') map[e].ejecucion += 1;
      else if (i.estado === 'Bloqueado') map[e].bloqueado += 1;
      else map[e].pendiente += 1;
    });
    return Object.entries(map)
      .map(([empresa, v]) => ({
        empresa,
        ...v,
        cumplimiento: v.total > 0 ? Math.round(((v.finalizado + v.ejecucion) / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, []);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {[
          { label: 'Finalizado',  color: '#00A651' },
          { label: 'En Ejecución', color: '#2563eb' },
          { label: 'Pendiente',   color: '#cbd5e1' },
          { label: 'Bloqueado',   color: '#dc2626' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          onClick={(e: any) => e?.activeLabel && navigate(e.activeLabel)}
        >
          <XAxis dataKey="empresa" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <RTooltip
            cursor={{ fill: 'rgba(0,166,81,0.06)' }}
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#fff', fontWeight: 700 }}
            itemStyle={{ color: '#cbd5e1' }}
          />
          <Bar dataKey="finalizado" name="Finalizado" stackId="a" fill="#00A651" />
          <Bar dataKey="ejecucion"  name="En Ejecución" stackId="a" fill="#2563eb" />
          <Bar dataKey="pendiente"  name="Pendiente"  stackId="a" fill="#cbd5e1" />
          <Bar dataKey="bloqueado"  name="Bloqueado"  stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.slice(0, 6).map(d => (
          <button
            key={d.empresa}
            onClick={() => navigate(d.empresa)}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-brand-300 hover:bg-brand-50/40 text-left transition-all group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 truncate">
                <MapPin size={10} className="shrink-0 text-gray-400" />
                <span className="truncate">{d.empresa}</span>
              </div>
              <span className="text-[10px] text-gray-400">{d.total} iniciativas · {d.cumplimiento}% con tracción</span>
            </div>
            <ArrowRight size={12} className="text-gray-300 group-hover:text-brand-500 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 5 — APROBACIÓN FINAL (a punto de cerrarse)
═══════════════════════════════════════════════════════════════ */
function AboutToClose({ items, navigate }: { items: Iniciativa[]; navigate: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-900 leading-relaxed">
          <strong>{items.length} iniciativas</strong> en Aprobación Final + En proceso 75%+ están a un paso del cierre.
          Estas son las próximas victorias del año.
        </p>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
        {items.map(i => (
          <div
            key={i.id}
            className="px-3 py-2 rounded-lg bg-white border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">{i.id}</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                style={{
                  backgroundColor: i.estado === 'Aprobación Final' ? '#d1fae5' : '#dbeafe',
                  color: i.estado === 'Aprobación Final' ? '#065f46' : '#1e3a8a',
                }}
              >
                {i.estado.replace('En proceso ', '')}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto shrink-0">{i.empresa}</span>
            </div>
            <p className="text-xs text-gray-800 font-medium leading-tight truncate">{i.titulo}</p>
          </div>
        ))}
      </div>
      <button
        onClick={navigate}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold py-1.5"
      >
        Ver las {items.length} en el portafolio <ArrowRight size={11} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHART 6 — IMPACTO DE FINALIZADAS (texto literal del cierre)
═══════════════════════════════════════════════════════════════ */
const TOP_FINALIZADAS = [
  { id: 'ID-002', titulo: 'SAP Business One + App Mobile en Point Andina', impacto: 'Pedidos comerciales, márgenes, bonificaciones y stock automatizados desde la app móvil. Reemplaza Contanet.', pais: 'Point Andina', categoria: 'ERP & Sistemas' },
  { id: 'ID-005', titulo: 'Relanzamiento estratégico de Salesforce', impacto: 'Cuentas de ex-empleados eliminadas, CRM personalizado, proceso Agroindustria diseñado e integrado.', pais: 'Point Andina', categoria: 'CRM & Ventas' },
  { id: 'ID-030', titulo: 'Líneas de crédito automáticas Chile', impacto: 'Conversión UF→CLP automática y envío del reporte sin intervención humana. Liberó horas del equipo financiero.', pais: 'Chile', categoria: 'Automatización & BI' },
  { id: 'ID-088', titulo: 'Analista Corporativo de Datos contratado', impacto: 'Capacidad propia incorporada al equipo. Acelera reportería y automatización en todo el Grupo.', pais: 'Grupo Point', categoria: 'Capacitación' },
  { id: 'ID-113', titulo: 'Datawarehouse seguro con extracción desde SAP', impacto: 'Flujo de datos automatizado desde SAP. Cartera y ventas disponibles para análisis sin tocar el ERP.', pais: 'Point Andina', categoria: 'Automatización & BI' },
  { id: 'ID-116', titulo: 'Bot de envío de facturas SharePoint→Cliente', impacto: 'Bot parametrizable automatiza el envío de letras y facturas — antes el cuello de botella mensual.', pais: 'Point Andina', categoria: 'Automatización & BI' },
  { id: 'ID-118', titulo: 'Capacitación Perplexity Asuntos Regulatorios', impacto: 'IA generativa en producción para búsquedas regulatorias. Edith Mora solicita extender al equipo.', pais: 'Grupo Point', categoria: 'Capacitación' },
  { id: 'ID-152', titulo: 'Cerradura digital oficina Point Andina', impacto: 'Control de acceso digital implementado. Claves asignadas a usuarios autorizados, mejora seguridad física.', pais: 'Point Andina', categoria: 'Infraestructura' },
];

function ImpactGrid({ navigate }: { navigate: () => void }) {
  return (
    <div>
      <div className="flex items-start gap-2 bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4">
        <Trophy size={14} className="text-brand-600 shrink-0 mt-0.5" />
        <p className="text-xs text-brand-900 leading-relaxed">
          <strong>33 iniciativas finalizadas</strong> con valor real entregado. Estas son las 8 más significativas
          — texto extraído de la columna "Cierre y Logros Obtenidos" del Master List.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TOP_FINALIZADAS.map(w => (
          <div
            key={w.id}
            onClick={navigate}
            className="cursor-pointer p-3.5 rounded-xl border border-gray-100 bg-white hover:border-brand-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{w.id}</span>
              <span className="text-[9px] text-gray-400">· {w.pais}</span>
              <span className="text-[9px] text-gray-400">· {w.categoria}</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">✓ Cerrada</span>
            </div>
            <p className="text-xs font-bold text-gray-900 mb-1 leading-tight">{w.titulo}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{w.impacto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Execution() {
  const navigate = useNavigate();

  // Compute estado buckets from real data
  const estadoBuckets: EstadoBucket[] = useMemo(() => {
    const counts: Record<string, number> = {};
    initiatives.forEach(i => { counts[i.estado] = (counts[i.estado] ?? 0) + 1; });
    const total = initiatives.length;
    return PIPELINE_ORDER.map(estado => {
      const meta = ESTADO_COLORS[estado];
      const def = ESTADOS.find(e => e.estado === estado);
      const count = counts[estado] ?? 0;
      return {
        estado,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: meta?.color ?? '#94a3b8',
        textColor: meta?.textColor ?? '#fff',
        meaning: def?.significado ?? '',
        group: meta?.group ?? 'pendiente',
      };
    });
  }, []);

  const finalizadas = estadoBuckets.find(b => b.estado === 'Finalizado')?.count ?? 0;
  const enEjecucion = estadoBuckets.filter(b => b.group === 'progreso').reduce((s, b) => s + b.count, 0);
  const bloqueadas  = estadoBuckets.find(b => b.estado === 'Bloqueado')?.count ?? 0;
  const pendientes  = estadoBuckets.filter(b => b.group === 'pendiente').reduce((s, b) => s + b.count, 0);

  const aboutToClose = useMemo(() =>
    initiatives
      .filter(i => i.estado === 'Aprobación Final' || i.estado === 'En proceso 75% - +' || i.estado === 'En proceso 51% - 75%')
      .sort((a, b) => {
        const order = ['Aprobación Final', 'En proceso 75% - +', 'En proceso 51% - 75%'];
        return order.indexOf(a.estado) - order.indexOf(b.estado);
      })
      .slice(0, 12),
    []
  );

  // Helpers de navegación con filtros
  const goPortfolio = (filters: Partial<{ estado: string[]; prioridad: string[]; empresa: string[]; view: 'pipeline' | 'table' }>) => {
    navigate('/portafolio', { state: filters });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar breadcrumb={['Inicio', 'Cómo Trabajamos · Ejecución']} />

      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6">

        {/* HERO */}
        <div className="gradient-hero text-white rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-brand-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Dashboard de Ejecución · Cómo trabajamos</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
            Cómo se ejecuta el plan en el día a día
          </h1>
          <p className="text-brand-200 text-sm md:text-base max-w-3xl leading-relaxed">
            Vista operativa del Master List: cuántas iniciativas están en cada estado, cómo avanzan,
            cómo se priorizan y qué impacto tienen al cerrarse. Cada gráfico es interactivo —
            <strong className="text-white"> haz clic en cualquier elemento</strong> para abrir el portafolio
            con los filtros aplicados.
          </p>
        </div>

        {/* KPI STRIP */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-gray-100">
            <AnimatedKpi value={initiatives.length} label="Iniciativas totales" sub="Master List completo" delay={0}
              onClick={() => goPortfolio({})} />
            <AnimatedKpi value={finalizadas} label="Finalizadas" sub="Valor real entregado" color="#00A651" delay={100}
              onClick={() => goPortfolio({ estado: ['Finalizado'], view: 'table' })} />
            <AnimatedKpi value={enEjecucion} label="En ejecución" sub="Avance medible" color="#2563eb" delay={200}
              onClick={() => goPortfolio({ estado: ['En proceso 0% - 25%','En proceso 25% - 50%','En proceso 51% - 75%','En proceso 75% - +','Aprobación Final'] })} />
            <AnimatedKpi value={pendientes} label="Pendientes" sub="Backlog y solicitudes" color="#7c3aed" delay={300}
              onClick={() => goPortfolio({ estado: ['Solicitado / A validar','Próximo (Backlog listo)','En Espera de TI / TA'] })} />
            <AnimatedKpi value={bloqueadas} label="Bloqueadas" sub="Decisiones C-Suite" color="#dc2626" delay={400}
              onClick={() => goPortfolio({ estado: ['Bloqueado'] })} />
          </div>
        </div>

        {/* FUNNEL DE 11 ESTADOS */}
        <ChartCard
          title="¿En qué estado está cada iniciativa? — los 11 estados del pipeline"
          subtitle="Embudo completo. Cada barra muestra cuántas iniciativas hay en ese estado y qué significa. Pasa el cursor para ver la definición. Clic = abrir el portafolio filtrado por ese estado."
          info="Click en cualquier estado abre el Portafolio con el filtro de ese estado preaplicado."
          accent="linear-gradient(90deg, #cbd5e1, #2563eb, #00A651)"
        >
          <FullPipelineFunnel data={estadoBuckets} navigate={(estados) => goPortfolio({ estado: estados })} />
        </ChartCard>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Progress detail */}
          <ChartCard
            title="¿Cómo avanza lo que está en progreso?"
            subtitle="Distribución de las iniciativas que están en ejecución activa según su porcentaje de avance — desde los inicios hasta la aprobación final."
            info="Click en cada tramo abre el portafolio con ese rango de avance."
            accent="linear-gradient(90deg, #bfdbfe, #1d4ed8, #10b981)"
          >
            <ProgressDetail buckets={estadoBuckets} navigate={(estados) => goPortfolio({ estado: estados })} />
          </ChartCard>

          {/* Prioritization */}
          <ChartCard
            title="¿Cómo se priorizan? — Matriz Prioridad × Estado"
            subtitle="Cruce entre la prioridad asignada (Alta/Media/Baja) y el estado de ejecución. Muestra si TA enfoca su capacidad en lo crítico."
            info="Click en cualquier celda abre el portafolio con prioridad + estado preaplicados."
            accent="linear-gradient(90deg, #dc2626, #d97706, #2563eb, #00A651)"
          >
            <PrioritizationMatrix navigate={(f) => goPortfolio(f)} />
          </ChartCard>
        </div>

        {/* Velocity por país */}
        <ChartCard
          title="¿Quién ejecuta más? — Velocidad por país"
          subtitle="Distribución apilada por país: cuántas finalizadas, en ejecución, pendientes y bloqueadas. Identifica los países más rápidos y los que necesitan apoyo."
          info="Click en cualquier país (barra o card) abre el portafolio filtrado por esa empresa."
          accent="linear-gradient(90deg, #00A651, #0891b2)"
        >
          <CountryVelocity navigate={(empresa) => goPortfolio({ empresa: [empresa] })} />
        </ChartCard>

        {/* About to close + Impact grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="¿Qué se entrega pronto? — Aprobación Final + 75%+"
            subtitle="Las 12 iniciativas más cercanas al cierre. Estas son las próximas victorias del trimestre."
            accent="linear-gradient(90deg, #10b981, #00A651)"
          >
            <AboutToClose
              items={aboutToClose}
              navigate={() => goPortfolio({ estado: ['Aprobación Final', 'En proceso 75% - +', 'En proceso 51% - 75%'], view: 'table' })}
            />
          </ChartCard>

          <ChartCard
            title="¿Cuál es el impacto de lo que ya se cerró?"
            subtitle="Las 8 victorias más significativas con texto literal del cierre. Cada una resuelve un dolor concreto."
            accent="linear-gradient(90deg, #00A651, #16a34a)"
          >
            <ImpactGrid navigate={() => goPortfolio({ estado: ['Finalizado'], view: 'table' })} />
          </ChartCard>
        </div>

        {/* Footer help */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
              <Filter size={16} className="text-brand-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Todos los gráficos están conectados al Portafolio</p>
              <p className="text-[11px] text-gray-500">Cualquier clic abre la vista detallada con los filtros correctos preaplicados — listos para profundizar o exportar.</p>
            </div>
          </div>
          <button
            onClick={() => goPortfolio({})}
            className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Layers size={12} /> Ir al Portafolio completo
          </button>
        </div>

      </div>
    </div>
  );
}
