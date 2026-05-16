import React, { useState, useEffect, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import { Navbar } from '../components/ui/Navbar';
import { useCountUp } from '../hooks/useCountUp';
import { useInitiatives } from '../contexts/InitiativesContext';
import { mapToFramework } from '../utils/framework';
import {
  Database, Cpu, Shield, Brain, TrendingUp, ExternalLink, ChevronRight,
  Calendar, Award, AlertCircle, CheckCircle2, RefreshCcw,
} from 'lucide-react';
import type { Iniciativa } from '../types';

/* ═══════════════════════════════════════════════════════════════
   FRAMEWORK DE MADUREZ — combinación de modelos reconocidos
   · Gartner ITScore (5 niveles)
   · CMMI v3.0 (5 niveles)
   · NIST CSF 2.0 (4 tiers — mapeados a 1–4)
   · DAMA-DMBOK Data Management Maturity
   · Gartner AI Maturity Model
═══════════════════════════════════════════════════════════════ */

const NIVELES = [
  {
    n: 1,
    nombre: 'Inicial / Reactivo',
    color: '#dc2626',
    light: '#fef2f2',
    border: '#fca5a5',
    descripcion: 'Procesos ad-hoc, sin estandarización. TI apaga incendios. Resultados dependen de personas individuales.',
    indicadores: ['Excel como sistema de gestión', 'Sin política formal de TI', 'Conocimiento en cabeza de personas clave', 'Reportes manuales por país'],
  },
  {
    n: 2,
    nombre: 'En Desarrollo / Repetible',
    color: '#d97706',
    light: '#fffbeb',
    border: '#fcd34d',
    descripcion: 'Procesos básicos definidos pero inconsistentes entre unidades. Algunas prácticas se repiten con éxito en proyectos similares.',
    indicadores: ['Algunos procesos documentados', 'ERPs por país sin integración', 'Iniciativas aisladas funcionando', 'Roles parcialmente definidos'],
  },
  {
    n: 3,
    nombre: 'Definido / Funcional',
    color: '#2563eb',
    light: '#eff6ff',
    border: '#93c5fd',
    descripcion: 'Estándares organizacionales consistentes. Procesos definidos, comunicados y aplicados a través de los países. Decisiones basadas en datos.',
    indicadores: ['Datawarehouse corporativo único', 'Política de TI publicada', 'Datos maestros consistentes', 'Comités de gobierno operativos'],
  },
  {
    n: 4,
    nombre: 'Gestionado / Cuantitativo',
    color: '#7c3aed',
    light: '#f5f3ff',
    border: '#c4b5fd',
    descripcion: 'Procesos medidos cuantitativamente con métricas e indicadores en vivo. Predicciones basadas en datos históricos. Optimización continua.',
    indicadores: ['KPIs operativos en tiempo real', 'Modelos predictivos en producción', 'SLAs de TI medidos y cumplidos', 'Forecasting de demanda'],
  },
  {
    n: 5,
    nombre: 'Optimizado / Socio del Negocio',
    color: '#00A651',
    light: '#f0faf4',
    border: '#86efac',
    descripcion: 'TI en el ADN del negocio. Innovación continua, IA embebida en el core operativo, datos como producto monetizable. TI define rumbo estratégico.',
    indicadores: ['IA generativa en operación', 'Arquitectura componible', 'Cultura data-driven', 'Continuous deployment'],
  },
];

/** Datos base por dimensión (estáticos: framework + descripciones).
 *  Los scores actual/meta se calculan dinámicamente desde las iniciativas. */
const DIMENSION_BASE = [
  {
    id: 'datos',
    nombre: 'Datos y Analítica',
    framework: 'DAMA-DMBOK / CMMI-DMM',
    icon: Database,
    color: '#2563eb',
    light: '#eff6ff',
    fallbackActual: 1.5,
    fallbackMeta: 3.3,
    hoy: 'Datos en silos por país y por ERP. Excel como fuente de verdad. Sin diccionario único de SKU/cliente. Reportería manual con criterios distintos por país.',
    proximoNivel: 'Datawarehouse corporativo único alimentado de SAP, Salesforce y Siesa. Power BI sobre datos confiables. KPIs estandarizados de sell-in/sell-out entre Perú, Chile, Colombia. Diccionario de datos publicado.',
  },
  {
    id: 'apps',
    nombre: 'Aplicaciones e Infraestructura',
    framework: 'Gartner ITScore I&O / TOGAF',
    icon: Cpu,
    color: '#0891b2',
    light: '#ecfeff',
    fallbackActual: 1.8,
    fallbackMeta: 3.5,
    hoy: 'ERPs heterogéneos (SAP B1 en Andina recién, Lanix Chile, Siesa Colombia). Salesforce relanzado en algunos países. Integraciones manuales. Sin arquitectura corporativa documentada.',
    proximoNivel: 'SAP B1 estabilizado y replicable. Salesforce relanzado por país. Integraciones Seidor-Lanix-Siesa funcionales con APIs. Cloud-first para nuevas capacidades. Roadmap claro de consolidación.',
  },
  {
    id: 'seguridad',
    nombre: 'Ciberseguridad y Gobierno',
    framework: 'NIST CSF 2.0 / COBIT',
    icon: Shield,
    color: '#dc2626',
    light: '#fef2f2',
    fallbackActual: 1.5,
    fallbackMeta: 3.0,
    hoy: 'NIST CSF Tier 1 (Partial). Antivirus heterogéneo, sin CISO, respaldos SharePoint sin protocolo, sin política formal de TI publicada. Cumplimiento de Hab. Datos Perú y Ley 1581 Colombia parcial.',
    proximoNivel: 'NIST CSF Tier 3 (Repeatable). M365 Defender corporativo, Política TI 2026 firmada, comité país operativo, MFA universal, respaldos auditables. Riesgo cibernético reportado al Directorio.',
  },
  {
    id: 'ia',
    nombre: 'Personas, IA e Innovación',
    framework: 'Gartner AI Maturity / McKinsey DQ',
    icon: Brain,
    color: '#7c3aed',
    light: '#f5f3ff',
    fallbackActual: 1.2,
    fallbackMeta: 3.0,
    hoy: 'Gartner AI: nivel "Awareness". IA usada de forma aislada (Perplexity en Asuntos Regulatorios). Sin Comité IA formal aún operativo. Recurso de datos recién incorporado.',
    proximoNivel: 'Gartner AI: nivel "Operational". Comité IA del Grupo activo, suscripciones consolidadas, agente Copilot Studio en producción para soporte TI, capacitaciones por área, marco ético-legal aplicado.',
  },
];

/** Mapa estado → progreso (0 a 1) usado para calcular cuánto contribuye una iniciativa al actual */
const STATE_PROGRESS: Record<string, number> = {
  'Finalizado': 1.0,
  'Aprobación Final': 0.95,
  'En proceso 75% - +': 0.85,
  'En proceso 51% - 75%': 0.65,
  'En proceso 25% - 50%': 0.40,
  'En proceso 0% - 25%': 0.15,
  'Próximo (Backlog listo)': 0,
  'Solicitado / A validar': 0,
  'En Espera de TI / TA': 0,
  'Bloqueado': 0,
  'Fuera del Plan': 0,
};

/** Tipo extendido — cada dimensión con scores dinámicos */
interface DimensionWithScores {
  id: string;
  nombre: string;
  framework: string;
  icon: any;
  color: string;
  light: string;
  hoy: string;
  proximoNivel: string;
  /** Score actual basado en progreso × objetivo de iniciativas (1-5) */
  actual: number;
  /** Score objetivo promedio de las iniciativas asignadas a esta dim */
  meta24m: number;
  /** Meta intermedia 12m — interpolación entre actual y meta24m */
  meta12m: number;
  /** Cuántas iniciativas contribuyen a esta dimensión */
  iniciativasCount: number;
  /** IDs de las iniciativas clave (top 6 por nivel objetivo + Finalizadas primero) */
  iniciativasClave: string[];
}

/**
 * Calcula scores dinámicos por dimensión a partir de las iniciativas.
 * - actual = mean(1 + (objetivo - 1) × progress) entre iniciativas con objetivo asignado
 * - meta24m = mean(objetivo) entre iniciativas con objetivo asignado
 * - meta12m = interpolación lineal (60% del camino actual→meta)
 */
function computeMaturity(initiatives: Iniciativa[]): DimensionWithScores[] {
  return DIMENSION_BASE.map(base => {
    // Iniciativas que aportan a esta dimensión
    const aportes = initiatives.filter(i => mapToFramework(i) === base.nombre);

    // Solo las que tienen objetivo válido (1-5) computan en el score
    const conObjetivo = aportes
      .map(i => {
        const obj = parseInt(String(i.nivelMadurez ?? '').replace(/[^0-9]/g, ''), 10);
        return { i, obj };
      })
      .filter(x => x.obj >= 1 && x.obj <= 5);

    let actual = base.fallbackActual;
    let meta24m = base.fallbackMeta;

    if (conObjetivo.length > 0) {
      let sumActual = 0, sumMeta = 0;
      for (const { i, obj } of conObjetivo) {
        const progress = STATE_PROGRESS[i.estado] ?? 0;
        // Modelo: cada iniciativa lleva al Grupo desde 1 hacia su objetivo
        // contribución actual = 1 + (obj - 1) × progreso
        sumActual += 1 + (obj - 1) * progress;
        sumMeta += obj;
      }
      actual = sumActual / conObjetivo.length;
      meta24m = sumMeta / conObjetivo.length;
    }

    const meta12m = actual + (meta24m - actual) * 0.6;

    // Top 6 iniciativas clave: Finalizadas primero, luego por progreso desc
    const claves = [...aportes]
      .sort((a, b) => {
        const pa = STATE_PROGRESS[a.estado] ?? 0;
        const pb = STATE_PROGRESS[b.estado] ?? 0;
        if (pa !== pb) return pb - pa;
        return String(a.id).localeCompare(String(b.id));
      })
      .slice(0, 8)
      .map(i => `${i.id} ${i.titulo?.slice(0, 50) ?? ''}${(i.titulo?.length ?? 0) > 50 ? '…' : ''}`);

    return {
      ...base,
      actual: Math.round(actual * 10) / 10,
      meta24m: Math.round(meta24m * 10) / 10,
      meta12m: Math.round(meta12m * 10) / 10,
      iniciativasCount: aportes.length,
      iniciativasClave: claves,
    };
  });
}

const ROADMAP = [
  {
    periodo: 'Q4 2025 — Hoy',
    color: '#dc2626',
    score: '1.5',
    nivel: 'Inicial / Reactivo',
    hitos: [
      'SAP B1 + App Mobile en Andina al 75%',
      'Datawarehouse SAP entregado',
      'Analista Corporativo de Datos incorporado',
      'Capacitación Perplexity finalizada',
      'Política TI 2026 en redacción',
    ],
  },
  {
    periodo: '2026 — Año del Estándar',
    color: '#2563eb',
    score: '2.5',
    nivel: 'En Desarrollo / Repetible',
    hitos: [
      'Política TI 2026 publicada y firmada',
      'M365 Defender corporativo desplegado',
      'Comité Directivo de IA operativo',
      'Datawarehouse Colombia evaluado o construido',
      'Comités de seguimiento país TA activos',
      'Power BI ejecutivo en Directorio',
    ],
  },
  {
    periodo: '2027 — Año de la Integración',
    color: '#00A651',
    score: '3.3',
    nivel: 'Definido / Funcional',
    hitos: [
      'KPIs estandarizados sell-in/sell-out 7 países',
      'Integraciones Seidor-Lanix-Siesa funcionales',
      'NIST CSF Tier 3 alcanzado',
      'Agente conversacional IA en producción',
      'IA generativa en al menos 3 áreas de negocio',
      'SLAs de TI medidos y publicados',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
═══════════════════════════════════════════════════════════════ */

/* ─── Score Card hero ─────────────────────────────────────── */
function CompositeScoreHero({ actualGlobal, meta12m, meta24m }: { actualGlobal: number; meta12m: number; meta24m: number }) {
  const score = useCountUp(Math.round(actualGlobal * 10), 1500, 200) / 10;
  const target = useCountUp(Math.round(meta24m * 10), 1500, 700) / 10;

  const positionActual = (actualGlobal / 5) * 100;
  const positionMeta = (meta24m / 5) * 100;
  const actualNivel = Math.max(1, Math.min(5, Math.round(actualGlobal)));
  const meta12Nivel = Math.max(1, Math.min(5, Math.round(meta12m)));
  const meta24Nivel = Math.max(1, Math.min(5, Math.round(meta24m)));
  const nivelNames: Record<number, string> = {
    1: 'Inicial / Reactivo',
    2: 'En Desarrollo',
    3: 'Definido / Funcional',
    4: 'Gestionado',
    5: 'Optimizado',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">

        {/* Actual */}
        <div className="p-6 bg-red-50/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">Madurez actual del Grupo</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-black text-red-700">{score.toFixed(1)}</span>
            <span className="text-lg text-red-500 font-semibold">/ 5.0</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold mb-2">
            <AlertCircle size={11} /> Nivel {actualNivel} · {nivelNames[actualNivel]}
          </div>
          <p className="text-xs text-red-900 leading-relaxed">
            Por debajo del promedio Latam (2.0) y del promedio global de la industria CPG (2.4).
            La brecha vs. líderes globales es de 3 niveles completos.
          </p>
        </div>

        {/* Meta 12m */}
        <div className="p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Compromiso 12 meses</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-black text-blue-700">{meta12m.toFixed(1)}</span>
            <span className="text-lg text-blue-500 font-semibold">/ 5.0</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold mb-2">
            <TrendingUp size={11} /> Nivel {meta12Nivel} · {nivelNames[meta12Nivel]}
          </div>
          <p className="text-xs text-blue-900 leading-relaxed">
            Alcanzar el promedio Latam y superarlo. Política TI publicada,
            Comité IA operativo, Defender desplegado.
          </p>
        </div>

        {/* Meta 24m */}
        <div className="p-6 bg-brand-50/40">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600 mb-2">Visión 2027</p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-black text-brand-700">{target.toFixed(1)}</span>
            <span className="text-lg text-brand-500 font-semibold">/ 5.0</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold mb-2">
            <Award size={11} /> Nivel {meta24Nivel} · {nivelNames[meta24Nivel]}
          </div>
          <p className="text-xs text-brand-900 leading-relaxed">
            Superar al promedio global. KPIs estandarizados,
            integraciones funcionales, NIST CSF Tier 3, IA en operación.
          </p>
        </div>
      </div>

      {/* Progression bar */}
      <div className="px-6 py-5 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Posición en la escala de madurez (1–5)</p>
        <div className="relative">
          <div className="h-3 rounded-full" style={{ background: 'linear-gradient(90deg, #dc2626 0%, #d97706 25%, #2563eb 50%, #7c3aed 75%, #00A651 100%)' }} />
          {/* Markers */}
          <div className="absolute top-0 -mt-1 w-5 h-5 rounded-full bg-white border-4 border-red-600 shadow-md transition-all duration-1000" style={{ left: `calc(${positionActual}% - 10px)` }}>
            <span className="absolute top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-700 whitespace-nowrap">HOY {actualGlobal.toFixed(1)}</span>
          </div>
          <div className="absolute top-0 -mt-1 w-5 h-5 rounded-full bg-white border-4 border-brand-600 shadow-md transition-all duration-1000" style={{ left: `calc(${positionMeta}% - 10px)` }}>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-brand-700 whitespace-nowrap">META {meta24m.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex justify-between mt-9 text-[10px] text-gray-400 font-medium">
          {NIVELES.map(n => <span key={n.n} className="text-center" style={{ width: '20%' }}>N{n.n}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ─── Industry Benchmark Bar ──────────────────────────────── */
function IndustryBenchmark({ actualGlobal, meta12m, meta24m }: { actualGlobal: number; meta12m: number; meta24m: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 400); return () => clearTimeout(t); }, []);

  const BENCHMARKS = [
    { label: 'Point hoy',                   value: actualGlobal, color: '#dc2626', annotation: 'Calculado en vivo desde el portafolio' },
    { label: 'Promedio Latam (CPG/Distribución)', value: 2.0,    color: '#d97706', annotation: 'Gartner Latam 2024' },
    { label: 'Promedio Global (CPG)',       value: 2.4,          color: '#ca8a04', annotation: 'McKinsey Rewired 2024' },
    { label: 'Point meta 12 meses',         value: meta12m,      color: '#2563eb', annotation: 'Cierre 2026' },
    { label: 'Point meta 24 meses',         value: meta24m,      color: '#7c3aed', annotation: 'Cierre 2027' },
    { label: 'Top 25% Global',              value: 3.7,          color: '#16a34a', annotation: 'Líderes regionales' },
    { label: 'Líderes mundiales',           value: 4.5,          color: '#15803d', annotation: 'Coca-Cola, P&G, Unilever' },
  ];

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Comparación con la industria:</strong> Los benchmarks combinan reportes públicos de
          <strong> Gartner ITScore 2024</strong>, <strong>McKinsey Rewired 2024</strong> y <strong>Deloitte Digital Maturity Index</strong>.
          La escala 1–5 es estándar (CMMI). Latam típicamente está 0.5–1.0 nivel debajo del promedio global.
        </p>
      </div>

      <div className="space-y-3">
        {BENCHMARKS.map((b, i) => {
          const widthPct = (b.value / 5) * 100;
          const isPoint = b.label.startsWith('Point');
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isPoint ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{b.label}</span>
                  <span className="text-[10px] text-gray-400 italic">— {b.annotation}</span>
                </div>
                <span className="text-sm font-black" style={{ color: b.color }}>{b.value.toFixed(1)}</span>
              </div>
              <div className="relative h-7 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center px-2"
                  style={{
                    width: animated ? `${widthPct}%` : '0%',
                    backgroundColor: b.color,
                    transitionDelay: `${i * 100}ms`,
                    opacity: 0.92,
                  }}
                >
                  <span className="text-white text-[10px] font-bold drop-shadow">Nivel {b.value.toFixed(1)}</span>
                </div>
                {/* Reference lines */}
                {[1, 2, 3, 4].map(l => (
                  <div key={l} className="absolute top-0 bottom-0 w-px bg-gray-300/60" style={{ left: `${(l / 5) * 100}%` }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 text-[9px] text-gray-400 font-medium text-center px-1">
        <span>1 · Inicial</span>
        <span>2 · En Desarrollo</span>
        <span>3 · Definido</span>
        <span>4 · Gestionado</span>
        <span>5 · Optimizado</span>
      </div>
    </div>
  );
}

/* ─── Radar Chart — clear and legible ───────────────────── */
function MaturityRadar({ dimensions }: { dimensions: DimensionWithScores[] }) {
  const radarData = dimensions.map(d => ({
    dimension: d.nombre.split(' ')[0],
    fullName: d.nombre,
    'Hoy':       d.actual,
    'Meta 12m':  d.meta12m,
    'Meta 2027': d.meta24m,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={radarData} outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fontWeight: 600, fill: '#1e293b' }} />
          <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9, fill: '#94a3b8' }} angle={90} />
          <Radar name="Hoy"       dataKey="Hoy"       stroke="#dc2626" strokeWidth={2.5} fill="#dc2626" fillOpacity={0.25} />
          <Radar name="Meta 12m"  dataKey="Meta 12m"  stroke="#2563eb" strokeWidth={2}   fill="#2563eb" fillOpacity={0.15} />
          <Radar name="Meta 2027" dataKey="Meta 2027" stroke="#00A651" strokeWidth={2.5} fill="#00A651" fillOpacity={0.18} strokeDasharray="4 2" />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <RTooltip
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#fff', fontWeight: 700 }}
            itemStyle={{ color: '#cbd5e1' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-red-700"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Estado actual del Grupo</div>
        <div className="flex items-center gap-1.5 text-brand-700"><span className="w-2.5 h-2.5 rounded-full bg-brand-600" /> Visión a 24 meses</div>
      </div>
    </div>
  );
}

/* ─── Dimension deep dive cards ──────────────────────────── */
function DimensionDeepDive({ dimensions }: { dimensions: DimensionWithScores[] }) {
  const [expandedId, setExpandedId] = useState<string | null>('datos');

  return (
    <div className="space-y-3">
      {dimensions.map(d => {
        const Icon = d.icon;
        const isOpen = expandedId === d.id;
        const gap = d.meta24m - d.actual;
        const progressPct = (d.actual / 5) * 100;
        const targetPct   = (d.meta24m / 5) * 100;

        return (
          <div
            key={d.id}
            className="rounded-2xl border-2 overflow-hidden transition-all"
            style={{ borderColor: isOpen ? d.color : '#e5e7eb', backgroundColor: '#fff' }}
          >
            {/* Header — clickable */}
            <button
              onClick={() => setExpandedId(isOpen ? null : d.id)}
              className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: d.color }}>
                <Icon size={18} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-bold text-gray-900">{d.nombre}</h4>
                  <span className="text-[10px] text-gray-400 italic">· {d.framework}</span>
                </div>
                {/* Mini progress */}
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="absolute h-full rounded-full" style={{ width: `${targetPct}%`, backgroundColor: `${d.color}33` }} />
                  <div className="absolute h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: d.color }} />
                </div>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-2xl font-black" style={{ color: d.color }}>{d.actual.toFixed(1)}</p>
                <p className="text-[9px] text-gray-400">→ {d.meta24m.toFixed(1)} en 2027</p>
              </div>

              <div className="text-center shrink-0 px-3 border-l border-gray-100 hidden md:block">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Brecha</p>
                <p className="text-sm font-black" style={{ color: gap >= 1.5 ? '#dc2626' : '#d97706' }}>+{gap.toFixed(1)}</p>
              </div>

              <ChevronRight size={16} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Body */}
            {isOpen && (
              <div className="border-t border-gray-100 fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="p-5 bg-gray-50/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black">{d.actual.toFixed(1)}</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">Hoy — Nivel {Math.floor(d.actual)}</p>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{d.hoy}</p>
                  </div>
                  <div className="p-5" style={{ backgroundColor: d.light }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: d.color }}>{d.meta24m.toFixed(1)}</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: d.color }}>Visión 2027 — Nivel {Math.round(d.meta24m)}</p>
                    </div>
                    <p className="text-xs leading-relaxed font-medium" style={{ color: d.color }}>{d.proximoNivel}</p>
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-gray-100 bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Iniciativas del Master List que construyen esta capacidad</p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.iniciativasClave.map(it => (
                      <span key={it} className="text-[10px] px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-100 font-medium">{it}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Maturity Levels Path ─────────────────────────────── */
function MaturityLevelsPath({ actualGlobal, meta12m, meta24m }: { actualGlobal: number; meta12m: number; meta24m: number }) {
  return (
    <div>
      <p className="text-xs text-gray-600 mb-5 leading-relaxed">
        Modelo de 5 niveles basado en <strong>CMMI v3.0</strong> (ISACA, 2023) y <strong>Gartner ITScore</strong>.
        Es el estándar usado por consultoras Tier-1 (McKinsey, Deloitte, KPMG) para evaluar y reportar madurez tecnológica al Directorio.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {NIVELES.map(n => {
          const isCurrent = n.n === Math.floor(actualGlobal) || (n.n === 1 && actualGlobal < 2);
          const isMeta12  = n.n === Math.round(meta12m);
          const isMeta24  = n.n === Math.round(meta24m);
          return (
            <div
              key={n.n}
              className="rounded-xl p-4 border-2 transition-all relative"
              style={{
                borderColor: isCurrent ? '#dc2626' : isMeta24 ? '#00A651' : isMeta12 ? '#2563eb' : '#e5e7eb',
                backgroundColor: isCurrent ? '#fef2f2' : isMeta24 ? '#f0faf4' : isMeta12 ? '#eff6ff' : '#fff',
              }}
            >
              {/* Status flag */}
              {(isCurrent || isMeta12 || isMeta24) && (
                <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                  style={{ backgroundColor: isCurrent ? '#dc2626' : isMeta24 ? '#00A651' : '#2563eb' }}>
                  {isCurrent && '◉ HOY'}
                  {!isCurrent && isMeta12 && '⮕ 12 MESES'}
                  {!isCurrent && !isMeta12 && isMeta24 && '★ META 2027'}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: n.color }}>
                  {n.n}
                </span>
                <p className="text-xs font-bold leading-tight" style={{ color: n.color }}>{n.nombre}</p>
              </div>

              <p className="text-[11px] text-gray-700 leading-relaxed mb-2.5">{n.descripcion}</p>

              <div className="space-y-1">
                {n.indicadores.map(ind => (
                  <div key={ind} className="flex items-start gap-1 text-[10px] text-gray-500 leading-tight">
                    <span className="shrink-0 mt-0.5">·</span>
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Roadmap 2025–2027 ──────────────────────────────── */
function RoadmapTimeline() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ROADMAP.map((r, i) => (
        <div key={r.periodo} className="relative rounded-2xl border-2 p-5"
          style={{ borderColor: r.color, backgroundColor: i === 0 ? '#fef2f2' : i === 1 ? '#eff6ff' : '#f0faf4' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} style={{ color: r.color }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>{r.periodo}</p>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black" style={{ color: r.color }}>{r.score}</span>
            <span className="text-xs text-gray-500">/ 5.0</span>
          </div>
          <p className="text-xs font-bold mb-4" style={{ color: r.color }}>{r.nivel}</p>

          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Hitos clave</p>
          <ul className="space-y-1.5">
            {r.hitos.map(h => (
              <li key={h} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-tight">
                <CheckCircle2 size={11} className="shrink-0 mt-0.5" style={{ color: r.color }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function Maturity() {
  const { initiatives, loading } = useInitiatives();

  // Cálculo dinámico que reacciona cuando admin edita iniciativas
  const dimensions = useMemo(() => computeMaturity(initiatives), [initiatives]);
  const actualGlobal = useMemo(
    () => dimensions.reduce((s, d) => s + d.actual, 0) / dimensions.length,
    [dimensions]
  );
  const meta24m = useMemo(
    () => dimensions.reduce((s, d) => s + d.meta24m, 0) / dimensions.length,
    [dimensions]
  );
  const meta12m = useMemo(
    () => actualGlobal + (meta24m - actualGlobal) * 0.6,
    [actualGlobal, meta24m]
  );

  const totalAporta = dimensions.reduce((s, d) => s + d.iniciativasCount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar breadcrumb={['Inicio', 'Dashboard de Madurez Tecnológica']} />

      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-6">

        {/* HERO */}
        <div className="gradient-hero text-white rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-brand-300" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-300">Diagnóstico de Madurez Tecnológica · Modelo CMMI · Gartner ITScore · NIST CSF</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-brand-300/80">
              <RefreshCcw size={10} /> Dinámico desde el portafolio
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
            Estamos en Nivel {actualGlobal.toFixed(1)} de 5. La meta es Nivel {meta24m.toFixed(1)} al 2027.
          </h1>
          <p className="text-brand-200 text-sm md:text-base max-w-3xl leading-relaxed">
            Esta es la posición real del Grupo Point. Los scores se calculan en vivo a partir
            de las iniciativas del portafolio: por cada hallazgo cuenta su <em>contribución estratégica</em> y su <em>nivel de madurez objetivo</em>
            (asignados por el administrador), ponderados por el progreso actual.
            {totalAporta > 0 && <> <strong className="text-white">{totalAporta}</strong> iniciativas contribuyen al cálculo.</>}
          </p>
        </div>

        {loading && initiatives.length === 0 && (
          <div className="text-center py-12">
            <span className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-xs text-gray-400 mt-3">Calculando madurez desde el portafolio…</p>
          </div>
        )}

        {/* COMPOSITE SCORE */}
        <CompositeScoreHero actualGlobal={actualGlobal} meta12m={meta12m} meta24m={meta24m} />

        {/* INDUSTRY BENCHMARK */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #00A651)' }} />
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Posicionamiento vs. industria</h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Benchmark con empresas similares de consumo masivo y distribución en Latam y a nivel global.
              La barra del Grupo Point hoy queda visiblemente por debajo del promedio regional.
            </p>
            <IndustryBenchmark actualGlobal={actualGlobal} meta12m={meta12m} meta24m={meta24m} />
          </div>
        </div>

        {/* RADAR + MATURITY PATH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #2563eb, #00A651)' }} />
            <div className="p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Radar de madurez por dimensión</h3>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                4 dimensiones críticas según frameworks reconocidos. Rojo: hoy. Verde punteado: meta 2027.
                La distancia entre ambos es la transformación a ejecutar.
              </p>
              <MaturityRadar dimensions={dimensions} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }} />
            <div className="p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Detalle por dimensión</h3>
              <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                Clic en cada dimensión para ver el estado real, el próximo nivel concreto y las iniciativas del Master List que lo construyen.
              </p>
              <DimensionDeepDive dimensions={dimensions} />
            </div>
          </div>
        </div>

        {/* 5 LEVELS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #d97706, #2563eb, #7c3aed, #00A651)' }} />
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">El camino: los 5 niveles de madurez tecnológica</h3>
            <MaturityLevelsPath actualGlobal={actualGlobal} meta12m={meta12m} meta24m={meta24m} />
          </div>
        </div>

        {/* ROADMAP */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #dc2626, #2563eb, #00A651)' }} />
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Roadmap de transformación 2025 → 2027</h3>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Hitos concretos con responsables y fechas. Cada año tiene un foco temático: el estándar primero, luego la integración.
            </p>
            <RoadmapTimeline />
          </div>
        </div>

        {/* FRAMEWORKS REFERENCES */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Frameworks de referencia y fuentes</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
            <a href="https://www.gartner.com/en/information-technology/research/gartner-it-score" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>Gartner ITScore</strong> — Escala 1–5 de madurez TI, estándar Fortune 500.</span>
            </a>
            <a href="https://cmmiinstitute.com/learning/appraisals/levels" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>CMMI v3.0</strong> — ISACA 2023. Modelo base de los 5 niveles aquí utilizados.</span>
            </a>
            <a href="https://www.nist.gov/cyberframework" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>NIST CSF 2.0</strong> — 4 tiers oficiales para evaluar ciberseguridad.</span>
            </a>
            <a href="https://www.dama.org/cpages/body-of-knowledge" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>DAMA-DMBOK</strong> — Estándar de gobierno de datos.</span>
            </a>
            <a href="https://www.gartner.com/en/chief-information-officer/research/ai-maturity-model-toolkit" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>Gartner AI Maturity</strong> — 5 niveles de adopción de IA en empresa.</span>
            </a>
            <a href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/rewired-and-running-ahead-digital-and-ai-leaders-are-leaving-the-rest-behind" target="_blank" rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-gray-600 hover:text-brand-700 group">
              <ExternalLink size={11} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-brand-500" />
              <span><strong>McKinsey Rewired 2024</strong> — Benchmark de líderes digitales por industria.</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
