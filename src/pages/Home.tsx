import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts';
import {
  ArrowRight, TrendingUp, AlertTriangle, ChevronRight, BookOpen,
  Database, Zap, Brain, Building2, Shield, Compass, CheckCircle2, Target,
} from 'lucide-react';
import { Navbar } from '../components/ui/Navbar';
import { useCountUp } from '../hooks/useCountUp';

/* ═══════════════════════════════════════════════════════════════
   DATA — extraída del Master List (174 iniciativas)
═══════════════════════════════════════════════════════════════ */

const TOTAL = 174;

const PIPELINE_STAGES = [
  { label: 'Completadas',     count: 33,  color: '#00A651', textColor: '#fff', pct: 19, meaning: 'Entregadas y cerradas. Valor real en manos del área solicitante.' },
  { label: 'En Ejecución',    count: 31,  color: '#2563eb', textColor: '#fff', pct: 18, meaning: 'Con avance medible: 0% → 25% → 50% → 75% → Aprobación Final.' },
  { label: 'Próximas',        count: 20,  color: '#7c3aed', textColor: '#fff', pct: 11, meaning: 'Backlog refinado. Listas para arrancar al liberar capacidad.' },
  { label: 'Pipeline',        count: 80,  color: '#e2e8f0', textColor: '#475569', pct: 46, meaning: 'Solicitadas o en validación. Demanda futura confirmada por el negocio.' },
  { label: 'Bloqueadas',      count: 7,   color: '#dc2626', textColor: '#fff', pct: 4,  meaning: 'Necesitan decisión del C-Suite o aval de área. No es falta de capacidad TA.' },
  { label: 'Fuera del Plan',  count: 3,   color: '#f1f5f9', textColor: '#94a3b8', pct: 2,  meaning: 'Descartadas o postergadas. Se revisarán en próximo ciclo.' },
];

const PRIO_MATRIX = {
  rows: ['Alta (68)', 'Media (47)', 'Baja (59)'],
  cols: ['Completada', 'En Ejecución', 'Pendiente', 'Bloqueada'],
  data: [
    [19, 20, 25, 4],
    [5,  9,  31, 2],
    [9,  2,  47, 1],
  ],
  pcts: [
    [28, 29, 37, 6],
    [11, 19, 66, 4],
    [15, 3,  80, 2],
  ],
};

const COUNTRY_DATA = [
  { name: 'Point Andina', completada: 18, ejecucion: 12, pendiente: 17, bloqueada: 2 },
  { name: 'Grupo Point',  completada: 5,  ejecucion: 11, pendiente: 23, bloqueada: 3 },
  { name: 'Colombia',     completada: 4,  ejecucion: 5,  pendiente: 30, bloqueada: 1 },
  { name: 'Chile',        completada: 4,  ejecucion: 2,  pendiente: 18, bloqueada: 1 },
  { name: 'Ecuador',      completada: 0,  ejecucion: 0,  pendiente: 15, bloqueada: 0 },
  { name: 'Uruguay',      completada: 1,  ejecucion: 1,  pendiente: 0,  bloqueada: 0 },
  { name: 'Venezuela',    completada: 1,  ejecucion: 0,  pendiente: 0,  bloqueada: 0 },
];

/* ═══════════════════════════════════════════════════════════════
   ANÁLISIS PROFUNDO — 6 CAPACIDADES QUE LLEVAN AL SIGUIENTE NIVEL
   Cada eje es la lectura agregada de iniciativas reales del Master List
═══════════════════════════════════════════════════════════════ */
type CapItem = { id: string; titulo: string; estado: string; pais?: string };
type Capacidad = {
  eje: string;
  icon: any;
  color: string;
  light: string;
  border: string;
  hoy: string;
  proximoNivel: string;
  totalIniciativas: number;
  entregadas: number;
  enEjecucion: number;
  iniciativas: CapItem[];
  porQueImporta: string;
};

const CAPACIDADES: Capacidad[] = [
  {
    eje: 'Datos confiables y decisiones por evidencia',
    icon: Database,
    color: '#2563eb',
    light: '#eff6ff',
    border: '#93c5fd',
    hoy: 'Cada país produce reportes en Excel manuales, con criterios distintos y conocimiento concentrado en personas. Los datos llegan tarde y no se cruzan entre operaciones.',
    proximoNivel: 'Un Datawarehouse corporativo conectado a SAP, Salesforce y Siesa. Power BI sobre datos confiables — no sobre Excel — que el Directorio consulta en tiempo real para decidir.',
    totalIniciativas: 18,
    entregadas: 4,
    enEjecucion: 6,
    porQueImporta: 'Sin datos confiables, todo lo demás es opinión. Es el punto de apoyo de cualquier siguiente nivel.',
    iniciativas: [
      { id: 'ID-113', titulo: 'Datawarehouse seguro con extracción automatizada desde SAP', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-104', titulo: 'Acceso a reporte diario Power BI para Gerentes Generales', estado: 'Finalizado', pais: 'Uruguay' },
      { id: 'ID-126', titulo: 'Automatización reporte diario de ventas y facturación', estado: 'Finalizado', pais: 'Andina/Uruguay' },
      { id: 'ID-070', titulo: 'Actualización de reportería personalizada desde ERP Siesa', estado: 'Aprobación Final', pais: 'Colombia' },
      { id: 'ID-075', titulo: 'Tableros Power BI inventario, OTIF y entregas en tiempo real', estado: 'Aprobación Final', pais: 'Colombia' },
      { id: 'ID-110', titulo: 'Reportería automatizada de cartera y cobranza para Directorio', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-172', titulo: 'Visibilidad diaria de ventas Andina para Uruguay', estado: 'En proceso 75%+', pais: 'Uruguay' },
      { id: 'ID-001', titulo: 'Diagnóstico de riesgos por dependencia de Excel', estado: 'Bloqueado', pais: 'Grupo' },
      { id: 'ID-053', titulo: 'Evaluación de Datawarehouse del proveedor ERP Siesa', estado: 'Bloqueado', pais: 'Colombia' },
      { id: 'ID-003', titulo: 'Automatización de reportes corporativos', estado: 'Bloqueado', pais: 'Grupo' },
      { id: 'ID-144', titulo: 'Tablero Power BI consolidado del Master List TA', estado: 'Próximo', pais: 'Grupo' },
      { id: 'ID-044', titulo: 'Reporte consolidado de ventas Power BI', estado: 'Próximo', pais: 'Chile' },
    ],
  },
  {
    eje: 'Operación digital end-to-end',
    icon: Zap,
    color: '#00A651',
    light: '#f0faf4',
    border: '#86efac',
    hoy: 'Procesos comerciales, contables y logísticos con muchas tareas manuales: pedidos en papel, conciliaciones diarias, revisiones de márgenes a mano, envíos uno a uno.',
    proximoNivel: 'Operación digital con SAP B1 + App Mobile, márgenes y bonificaciones validados en tiempo real, conciliaciones automáticas, bots para tareas repetitivas y alertas inteligentes que avisan antes de que algo se rompa.',
    totalIniciativas: 14,
    entregadas: 9,
    enEjecucion: 3,
    porQueImporta: 'Cada hora liberada de tarea manual es una hora dedicada a decisiones. Es el ROI más visible del portafolio.',
    iniciativas: [
      { id: 'ID-009', titulo: 'Automatización de captura de pedidos comerciales en ERP', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-010', titulo: 'Validación automática de márgenes y bonificaciones', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-014', titulo: 'Visibilidad de stock y gestión comercial en SAP Mobile', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-030', titulo: 'Actualización diaria automática de líneas de crédito', estado: 'Finalizado', pais: 'Chile' },
      { id: 'ID-031', titulo: 'Centralización contable diaria automática en ERP', estado: 'Finalizado', pais: 'Chile' },
      { id: 'ID-116', titulo: 'Bot de envío de facturas SharePoint → Cliente', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-122', titulo: 'App Mobile SAP en equipo comercial', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-148', titulo: 'Licencia SAP Logística para supervisión de bodega', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-117', titulo: 'Campos personalizados SAP para coordinadoras comerciales', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-106', titulo: 'Automatización del envío de cartas y facturas electrónicas', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-022', titulo: 'Optimización de gestión de cartera y cobranzas', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-151', titulo: 'Automatización alertas comerciales SAP con Power Automate', estado: 'En proceso', pais: 'Andina' },
    ],
  },
  {
    eje: 'IA aplicada al negocio con gobernanza',
    icon: Brain,
    color: '#7c3aed',
    light: '#f5f3ff',
    border: '#c4b5fd',
    hoy: 'IA usada de forma aislada por algunas personas. Cada quien con su licencia, sin marco común, sin medir resultados, sin reglas de uso seguro.',
    proximoNivel: 'Comité Directivo de IA del Grupo operativo, suscripciones consolidadas, capacitaciones por área, agente conversacional propio para soporte y un marco ético-legal antes que cada país improvise.',
    totalIniciativas: 8,
    entregadas: 1,
    enEjecucion: 4,
    porQueImporta: 'IA sin gobernanza es el atajo más rápido a un incidente reputacional o legal. La diferencia entre liderar el sector o seguirlo se decide aquí.',
    iniciativas: [
      { id: 'ID-118', titulo: 'Capacitación Perplexity para gestión documental regulatoria', estado: 'Finalizado', pais: 'Grupo' },
      { id: 'ID-092', titulo: 'Conformación del Comité Directivo de IA', estado: 'En proceso 75%+', pais: 'Grupo' },
      { id: 'ID-099', titulo: 'Capacitación en IA generativa para Asuntos Regulatorios', estado: 'En proceso 51-75%', pais: 'Grupo' },
      { id: 'ID-006', titulo: 'Modelo corporativo de gestión del cambio y adopción de IA', estado: 'En proceso 25-50%', pais: 'Grupo' },
      { id: 'ID-107', titulo: 'Agente conversacional de soporte TI con Copilot Studio', estado: 'En proceso', pais: 'Andina' },
      { id: 'ID-090', titulo: 'Consolidación de suscripciones corporativas de IA', estado: 'Solicitado', pais: 'Grupo' },
      { id: 'ID-094', titulo: 'Exploración de seminario sectorial sobre IA', estado: 'Próximo', pais: 'Grupo' },
      { id: 'ID-095', titulo: 'Plataforma de IA para investigación en Asuntos Regulatorios', estado: 'Solicitado', pais: 'Grupo' },
    ],
  },
  {
    eje: 'ERPs y sistemas core estabilizados',
    icon: Building2,
    color: '#0891b2',
    light: '#ecfeff',
    border: '#67e8f9',
    hoy: 'Tres ERPs distintos: SAP B1 (Andina), Lanix (Chile) y Siesa (Colombia). Salesforce con cuentas y procesos no estandarizados. Integraciones débiles entre sistemas.',
    proximoNivel: 'SAP B1 estabilizado en Andina con todas las observaciones cerradas, Salesforce relanzado por país con procesos locales, integraciones Seidor-Lanix-Siesa funcionales y plan claro para evaluar consolidación.',
    totalIniciativas: 12,
    entregadas: 5,
    enEjecucion: 4,
    porQueImporta: 'Los ERPs son la columna vertebral. Sin ellos estables y bien integrados, todo lo demás se construye sobre arena.',
    iniciativas: [
      { id: 'ID-005', titulo: 'Relanzamiento estratégico de Salesforce', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-029', titulo: 'Relanzamiento de Salesforce con procesos locales', estado: 'Finalizado', pais: 'Perú' },
      { id: 'ID-046', titulo: 'Coordinación TA en integraciones con Seidor y Lanix', estado: 'Finalizado', pais: 'Chile' },
      { id: 'ID-150', titulo: 'Servidor de prueba para facturación electrónica Estela', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-124', titulo: 'Integración de consultas Hana-SAP al repositorio corporativo', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-002', titulo: 'Implementación de ERP corporativo SAP Business One', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-026', titulo: 'Confiabilidad de los datos de inventario y bodega', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-123', titulo: 'Verificación del cierre de observaciones del ERP SAP', estado: 'En proceso 75%+', pais: 'Andina' },
      { id: 'ID-035', titulo: 'Integración del flujo de facturas de compra al ERP Lanix', estado: 'Solicitado', pais: 'Chile' },
      { id: 'ID-141', titulo: 'Despliegue en producción del cotizador comercial', estado: 'En proceso', pais: 'Colombia' },
    ],
  },
  {
    eje: 'Estructura, política y gobierno de TI',
    icon: Compass,
    color: '#d97706',
    light: '#fffbeb',
    border: '#fcd34d',
    hoy: 'No existe una Política formal de TI publicada. Las compras de equipos no tienen procedimiento estándar. El presupuesto se arma año a año sin visión plurianual. El soporte a usuarios depende de personas.',
    proximoNivel: 'Política de TI 2026 publicada y firmada, anexos de compra normados, presupuesto plurianual aprobado, comité de seguimiento por país operativo y modelo de soporte L1/L2 escalable con SLAs.',
    totalIniciativas: 9,
    entregadas: 1,
    enEjecucion: 4,
    porQueImporta: 'La diferencia entre un área que apaga incendios y un área que construye institución se llama política y estructura. Es lo que hace que TA escale sin depender de heroísmos individuales.',
    iniciativas: [
      { id: 'ID-088', titulo: 'Incorporación Analista Corporativo de Datos y Automatización', estado: 'Finalizado', pais: 'Grupo' },
      { id: 'ID-008', titulo: 'Mejora del servicio de Soporte TI a usuarios del Grupo', estado: 'En proceso 75%+', pais: 'Grupo' },
      { id: 'ID-114', titulo: 'Presupuesto 2026 de adquisición de equipos de cómputo', estado: 'En proceso 75%+', pais: 'Grupo' },
      { id: 'ID-127', titulo: 'Anexo a la Política TI sobre procedimiento de compra', estado: 'En proceso 75%+', pais: 'Grupo' },
      { id: 'ID-111', titulo: 'Comité de seguimiento país de Tecnologías Avanzadas', estado: 'En proceso 51-75%', pais: 'Grupo' },
      { id: 'ID-146', titulo: 'Desarrollo de la Política de TI 2026', estado: 'Próximo', pais: 'Grupo' },
      { id: 'ID-007', titulo: 'Centralización tecnológica de Asuntos Regulatorios', estado: 'Solicitado', pais: 'Andina' },
    ],
  },
  {
    eje: 'Seguridad, continuidad y experiencia',
    icon: Shield,
    color: '#dc2626',
    light: '#fef2f2',
    border: '#fca5a5',
    hoy: 'Antivirus heterogéneo entre países. Respaldos de SharePoint sin protocolo de validación. Acceso físico con llaves convencionales. Equipos vencidos en operación. Conectividad inestable en oficinas clave.',
    proximoNivel: 'Microsoft 365 Defender corporativo desplegado, respaldos SharePoint con protocolo y testeo, control de acceso digital, renovación programada de equipos y red corporativa rediseñada en oficinas clave.',
    totalIniciativas: 7,
    entregadas: 4,
    enEjecucion: 1,
    porQueImporta: 'La seguridad es lo invisible — hasta que falla. Es la base de continuidad del Grupo y la primera obligación del área.',
    iniciativas: [
      { id: 'ID-027', titulo: 'Mejora de la conectividad de red en oficina', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-028', titulo: 'Cobertura de telefonía móvil corporativa', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-057', titulo: 'Renovación de equipos tecnológicos colaboradoras', estado: 'Finalizado', pais: 'Colombia' },
      { id: 'ID-152', titulo: 'Implementación de cerradura digital en oficina', estado: 'Finalizado', pais: 'Andina' },
      { id: 'ID-108', titulo: 'Evaluación de nuevo servicio de respaldo SharePoint', estado: 'En proceso 25-50%', pais: 'Grupo' },
      { id: 'ID-105', titulo: 'Evaluación de Microsoft 365 Defender corporativo', estado: 'Próximo', pais: 'Grupo' },
      { id: 'ID-091', titulo: 'Assessment del directorio SharePoint y respaldos', estado: 'Solicitado', pais: 'Grupo' },
    ],
  },
];

const TANGIBLE_WINS = [
  { id: 'ID-002', titulo: 'SAP Business One + App Mobile en Point Andina', impacto: 'Pedidos comerciales, márgenes, bonificaciones y stock se gestionan automáticamente desde la app móvil. Reemplaza Contanet.', pais: 'Point Andina', icon: '🏗️' },
  { id: 'ID-005', titulo: 'Relanzamiento estratégico de Salesforce', impacto: 'Cuentas de ex-empleados eliminadas, CRM personalizado, proceso Agroindustria diseñado e integrado al ERP.', pais: 'Point Andina + Perú', icon: '🔐' },
  { id: 'ID-030', titulo: 'Actualización automática de líneas de crédito', impacto: 'Conversión UF→CLP automática y envío del reporte a zonales sin intervención humana. Liberó tiempo del equipo financiero.', pais: 'Chile', icon: '⚡' },
  { id: 'ID-088', titulo: 'Analista Corporativo de Datos y Automatización', impacto: 'Recurso interno incorporado al equipo. Capacidad propia para acelerar reportería y automatización en todo el Grupo.', pais: 'Grupo Point', icon: '👤' },
  { id: 'ID-116', titulo: 'Bot de envío de facturas SharePoint → Cliente', impacto: 'Identificamos que el envío de facturas era el cuello de botella. Bot parametrizable lo automatiza desde SharePoint.', pais: 'Point Andina', icon: '🤖' },
  { id: 'ID-118', titulo: 'Capacitación Perplexity Asuntos Regulatorios', impacto: 'IA generativa en producción para búsquedas regulatorias. Edith Mora ya solicita extender al equipo entero.', pais: 'Grupo Point', icon: '🧠' },
];

const BLOQUEADAS_REALES = [
  { id: 'ID-001', titulo: 'Diagnóstico de riesgos por dependencia de Excel', pais: 'Grupo Point', prio: 'Alta', razon: 'Point Andina completó el levantamiento. Colombia y Chile detenidos por falta de respuesta de responsables locales.', decision: 'Respaldo explícito de la alta dirección a los líderes de área locales para participar.', dependeDe: 'C-Suite + Gerentes de país' },
  { id: 'ID-003', titulo: 'Automatización de reportes corporativos',           pais: 'Grupo Point', prio: 'Alta', razon: 'Andina entregó información a tiempo. Colombia no respondió.',                                       decision: 'Validar con Suldery antes de continuar. Considerar incorporar analista corporativo dedicado.',     dependeDe: 'CFO + Gerencia Colombia' },
  { id: 'ID-119', titulo: 'Mejora del reporte de ventas SAP',                   pais: 'Point Andina', prio: 'Alta', razon: 'Diego y Yeni trabajan con Seidor. Esperando aprobación de Yeni para aceptar cambios.',           decision: 'Aprobación final del área comercial Andina.',                                                      dependeDe: 'Gerencia Comercial Andina' },
  { id: 'ID-133', titulo: 'Equipo tecnológico colaborador Brasil',              pais: 'Grupo Point', prio: 'Alta', razon: 'Marco Carvalho aún no envió la cotización requerida para iniciar la compra.',                  decision: 'Seguimiento al solicitante. Definir si compra se hace local o vía proveedor regional.',           dependeDe: 'Solicitante + CFO' },
  { id: 'ID-053', titulo: 'Evaluación Datawarehouse del proveedor ERP Siesa',   pais: 'Colombia',    prio: 'Media', razon: 'Reunión con proveedor confirmó: NO cuentan con Datawarehouse. Posible piloto Q3 2026.',          decision: '¿Esperar el piloto del proveedor o desarrollar Datawarehouse propio?',                            dependeDe: 'C-Suite (decisión arquitectura)' },
  { id: 'ID-033', titulo: 'Conciliación bancaria automática (Chile)',           pais: 'Chile',       prio: 'Media', razon: 'C-Suite decidió NO contratar el módulo automático del proveedor del ERP.',                       decision: 'Etapa interna cerrada. Iniciativa formalmente descartada.',                                       dependeDe: 'Decisión ya tomada (cerrada)' },
  { id: 'ID-089', titulo: 'Cotizador comercial digital Point Andina',           pais: 'Point Andina', prio: 'Baja', razon: 'Necesidad cubierta por la implementación de App Mobile SAP. Iniciativa absorbida.',           decision: 'Etapa cerrada. Funcionalidad entregada por App Mobile.',                                          dependeDe: 'Resuelto (vía SAP Mobile)' },
];

/* ═══════════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════════ */

function RichTooltip({ active, payload, label, hint }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip fade-in" style={{ minWidth: 180 }}>
      <p className="font-bold text-white mb-2 text-xs">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill ?? p.color ?? '#00A651' }} />
            <span className="text-slate-300 text-[11px]">{p.name}</span>
          </div>
          <strong className="text-white text-[11px]">{p.value}</strong>
        </div>
      ))}
      {hint && <p className="text-slate-400 text-[10px] mt-2 pt-1.5 border-t border-white/10 leading-tight">{hint}</p>}
    </div>
  );
}

function AnimatedKpi({ value, label, sub, color = '#00A651', delay = 0, suffix = '' }:
  { value: number; label: string; sub?: string; color?: string; delay?: number; suffix?: string }) {
  const v = useCountUp(value, 1400, delay);
  return (
    <div className="flex flex-col items-center text-center p-4">
      <span className="text-4xl md:text-5xl font-black leading-none mb-1" style={{ color }}>{v}{suffix}</span>
      <span className="text-xs font-bold text-gray-700 mb-0.5">{label}</span>
      {sub && <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '', accent }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string; accent?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {accent && <div className="h-1" style={{ background: accent }} />}
      <div className="p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">{title}</h3>
        {subtitle && <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANÁLISIS PROFUNDO DEL MASTER LIST
   6 capacidades estratégicas que emergen al leer las 174 tareas
═══════════════════════════════════════════════════════════════ */
function DeepCapabilityAnalysis() {
  const [activeIdx, setActiveIdx] = useState(0);
  const cap = CAPACIDADES[activeIdx];
  const Icon = cap.icon;
  const navigate = useNavigate();

  const avancePct = Math.round(((cap.entregadas + cap.enEjecucion) / cap.totalIniciativas) * 100);

  const estadoBadge = (e: string) => {
    if (e.includes('Finalizado')) return { bg: '#d1fae5', text: '#065f46' };
    if (e.includes('Bloqueado'))   return { bg: '#fee2e2', text: '#991b1b' };
    if (e.includes('proceso') || e.includes('Aprobación')) return { bg: '#dbeafe', text: '#1e40af' };
    if (e.includes('Próximo'))     return { bg: '#ede9fe', text: '#5b21b6' };
    return { bg: '#f1f5f9', text: '#475569' };
  };

  return (
    <div>
      {/* Intro contextual */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <BookOpen size={18} className="text-brand-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-brand-900 mb-1">La Master List es la fuente oficial del plan</p>
            <p className="text-xs text-brand-800 leading-relaxed">
              Cuando se leen las 174 iniciativas en detalle — descripción, objetivos, puntos de dolor, plan de acción y logros —
              emergen <strong>6 capacidades estratégicas</strong> que el Grupo está construyendo en simultáneo. Cada una con su
              "hoy" concreto, su "próximo nivel" definido y un conjunto de tareas reales en marcha. Selecciona una capacidad
              para ver el detalle.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
        {CAPACIDADES.map((c, i) => {
          const I = c.icon;
          const isActive = i === activeIdx;
          return (
            <button
              key={c.eje}
              onClick={() => setActiveIdx(i)}
              className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all"
              style={{
                backgroundColor: isActive ? c.color : c.light,
                borderWidth: 1,
                borderColor: isActive ? c.color : c.border,
                boxShadow: isActive ? `0 4px 14px ${c.color}33` : 'none',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : c.color }}
              >
                <I size={14} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold leading-tight mb-0.5" style={{ color: isActive ? '#fff' : c.color }}>
                  {c.eje}
                </p>
                <p className="text-[10px]" style={{ color: isActive ? 'rgba(255,255,255,0.8)' : '#64748b' }}>
                  {c.totalIniciativas} iniciativas · {c.entregadas} entregadas
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalle activo */}
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: cap.border }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: cap.color }}>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Capacidad estratégica</p>
            <h4 className="text-base font-bold text-white leading-tight">{cap.eje}</h4>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white leading-none">{avancePct}%</p>
            <p className="text-[10px] text-white/80">con tracción</p>
          </div>
        </div>

        {/* Hoy → Próximo nivel */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-5 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-[10px]">1</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Donde estamos hoy</p>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">{cap.hoy}</p>
          </div>
          <div className="p-5" style={{ backgroundColor: cap.light }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]" style={{ backgroundColor: cap.color }}>2</span>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cap.color }}>Próximo nivel</p>
            </div>
            <p className="text-xs leading-relaxed font-medium" style={{ color: cap.color }}>{cap.proximoNivel}</p>
          </div>
        </div>

        {/* Por qué importa */}
        <div className="px-5 py-3 border-t border-gray-100 bg-white">
          <p className="text-[11px] text-gray-700 italic leading-relaxed">
            <Target size={11} className="inline mr-1 -mt-0.5" style={{ color: cap.color }} />
            <strong style={{ color: cap.color }}>Por qué importa al Grupo:</strong> {cap.porQueImporta}
          </p>
        </div>

        {/* Lista de iniciativas reales */}
        <div className="bg-white border-t border-gray-100">
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Iniciativas que construyen esta capacidad ({cap.totalIniciativas})
            </p>
            <button
              onClick={() => navigate('/portafolio')}
              className="text-[10px] text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              Ver todas <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {cap.iniciativas.map(it => {
              const eb = estadoBadge(it.estado);
              return (
                <div
                  key={it.id}
                  onClick={() => navigate('/portafolio')}
                  className="px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 cursor-pointer transition-colors"
                >
                  <span className="text-[10px] font-mono font-bold text-gray-400 shrink-0 w-14">{it.id}</span>
                  <span className="text-xs text-gray-800 flex-1 truncate font-medium">{it.titulo}</span>
                  {it.pais && <span className="text-[10px] text-gray-400 shrink-0 hidden md:inline">{it.pais}</span>}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                    style={{ backgroundColor: eb.bg, color: eb.text }}
                  >
                    {it.estado}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGROS TANGIBLES
═══════════════════════════════════════════════════════════════ */
function TangibleWinsGrid() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4 flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-brand-600 shrink-0 mt-0.5" />
        <p className="text-xs text-brand-900 leading-relaxed">
          <strong>33 iniciativas cerradas con valor real entregado</strong>, no solo informes. Estas son las 6 más significativas
          del último año — texto extraído de la columna "Cierre y Logros Obtenidos" del Master List.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TANGIBLE_WINS.map(w => (
          <div
            key={w.id}
            onClick={() => navigate('/portafolio')}
            className="cursor-pointer p-4 rounded-xl border border-gray-100 bg-white hover:border-brand-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{w.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{w.id}</span>
                  <span className="text-[10px] text-gray-400">{w.pais}</span>
                </div>
                <p className="text-xs font-bold text-gray-900 mb-1.5 leading-tight">{w.titulo}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{w.impacto}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIPELINE FUNNEL
═══════════════════════════════════════════════════════════════ */
function ExecutiveFunnel() {
  const [animated, setAnimated] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const total = PIPELINE_STAGES.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-2">
      {PIPELINE_STAGES.map((stage, i) => {
        const barPct = (stage.count / total) * 100;
        const isHot = hovered === stage.label;
        return (
          <div key={stage.label} onMouseEnter={() => setHovered(stage.label)} onMouseLeave={() => setHovered(null)} onClick={() => navigate('/portafolio')} className="group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-transform duration-150" style={{ backgroundColor: stage.color, color: stage.textColor, transform: isHot ? 'scale(1.1)' : 'scale(1)' }}>
                {stage.count}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                  <span className="text-[10px] text-gray-400">{stage.pct}%</span>
                </div>
                <div className="relative h-5 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg transition-all duration-700 ease-out" style={{ width: animated ? `${Math.max(barPct, 3)}%` : '0%', backgroundColor: stage.color, transitionDelay: `${i * 100}ms`, opacity: 0.9 }} />
                </div>
              </div>
            </div>
            {isHot && (
              <div className="mt-1 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg fade-in leading-relaxed" style={{ marginLeft: '52px' }}>
                {stage.meaning}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-[11px] text-gray-700 leading-relaxed">
        <strong>37%</strong> del portafolio ya está completado o en ejecución activa. El <strong>46%</strong> en pipeline
        es la demanda futura confirmada del negocio que va a alimentar las próximas seis capacidades.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIORITY MATRIX
═══════════════════════════════════════════════════════════════ */
const CELL_COLORS = {
  'Completada':   { bg: '#f0faf4', active: '#00A651', text: '#005229' },
  'En Ejecución': { bg: '#eff6ff', active: '#2563eb', text: '#1e3a8a' },
  'Pendiente':    { bg: '#f8fafc', active: '#94a3b8', text: '#475569' },
  'Bloqueada':    { bg: '#fef2f2', active: '#dc2626', text: '#7f1d1d' },
};

function PriorityMatrix() {
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();
  return (
    <div>
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 mb-4">
        <p className="text-xs text-brand-900 font-medium leading-relaxed">
          De las <strong>68 iniciativas de Alta prioridad</strong>, ya hay <strong>19 cerradas</strong> y <strong>20 en ejecución</strong> (57%).
          Las <strong>4 bloqueadas</strong> en alta dependen de decisiones fuera del área, no de capacidad ejecutora.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-1.5 pr-3 text-gray-500 font-semibold w-28">Prioridad</th>
              {PRIO_MATRIX.cols.map(col => {
                const c = CELL_COLORS[col as keyof typeof CELL_COLORS];
                return (
                  <th key={col} className="text-center py-1.5 px-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.bg, color: c.active }}>{col}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PRIO_MATRIX.rows.map((row, ri) => {
              const prioColor = ri === 0 ? '#dc2626' : ri === 1 ? '#d97706' : '#64748b';
              return (
                <tr key={row} className="border-t border-gray-50">
                  <td className="py-2 pr-3 font-bold" style={{ color: prioColor }}>{row}</td>
                  {PRIO_MATRIX.cols.map((col, ci) => {
                    const val = PRIO_MATRIX.data[ri][ci];
                    const pct = PRIO_MATRIX.pcts[ri][ci];
                    const key = `${ri}-${ci}`;
                    const c = CELL_COLORS[col as keyof typeof CELL_COLORS];
                    const intensity = pct / 100;
                    return (
                      <td key={col} className="py-2 px-2 text-center">
                        <div onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)} onClick={() => navigate('/portafolio')} className="relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 hover:scale-105"
                          style={{ backgroundColor: `color-mix(in srgb, ${c.active} ${Math.round(intensity * 30)}%, ${c.bg})`, border: hovered === key ? `2px solid ${c.active}` : '2px solid transparent', boxShadow: hovered === key ? `0 4px 12px ${c.active}33` : 'none' }}>
                          <div className="text-xl font-black" style={{ color: c.active }}>{val}</div>
                          <div className="text-[9px] font-medium" style={{ color: c.text }}>{pct}%</div>
                        </div>
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
   COUNTRY ACHIEVEMENT
═══════════════════════════════════════════════════════════════ */
function CountryAchievement() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        {[
          { label: 'Completada', color: '#00A651' },
          { label: 'En Ejecución', color: '#2563eb' },
          { label: 'Pendiente', color: '#e2e8f0' },
          { label: 'Bloqueada', color: '#dc2626' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={COUNTRY_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <RTooltip content={<RichTooltip hint="Clic para ver estas iniciativas" />} cursor={{ fill: 'rgba(0,166,81,0.06)' }} />
          <Bar dataKey="completada" name="Completada" stackId="a" fill="#00A651" />
          <Bar dataKey="ejecucion"  name="En Ejecución" stackId="a" fill="#2563eb" />
          <Bar dataKey="pendiente"  name="Pendiente"  stackId="a" fill="#e2e8f0" />
          <Bar dataKey="bloqueada"  name="Bloqueada"  stackId="a" fill="#dc2626" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] text-gray-700 leading-relaxed">
        <strong>Point Andina lidera la ejecución</strong> con 18 cerradas y 12 en marcha — modelo replicable.
        <strong> Ecuador (15)</strong> y <strong>Colombia (30)</strong> tienen alto pipeline pendiente — la próxima frontera del plan.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOQUEADAS
═══════════════════════════════════════════════════════════════ */
function BlockedDecisions({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? BLOQUEADAS_REALES : BLOQUEADAS_REALES.slice(0, 4);
  const prioColor = (p: string) => p === 'Alta' ? '#dc2626' : p === 'Media' ? '#d97706' : '#64748b';

  return (
    <div className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(90deg, #7f1d1d, #991b1b)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center"><AlertTriangle size={16} className="text-white" /></div>
          <div>
            <p className="text-sm font-bold text-white">7 iniciativas bloqueadas — el detalle</p>
            <p className="text-xs text-red-200 leading-relaxed">
              4 dependen de decisiones del C-Suite o áreas. 2 ya están cerradas/superadas. 1 espera aprobación del solicitante.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {visible.map(b => (
          <div key={b.id} className="px-5 py-3.5 hover:bg-red-50/30 transition-colors">
            <div className="flex items-start gap-3 mb-2">
              <span className="text-[10px] font-mono font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{b.id}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-xs font-bold text-gray-900">{b.titulo}</p>
                  <span className="text-[10px] text-gray-400">· {b.pais}</span>
                  <span className="text-[10px] font-bold" style={{ color: prioColor(b.prio) }}>· {b.prio}</span>
                </div>
                <p className="text-[11px] text-gray-600 mb-1.5 leading-relaxed italic">"{b.razon}"</p>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  <span className="flex items-start gap-1">
                    <Target size={11} className="text-red-600 shrink-0 mt-0.5" />
                    <span className="text-red-800"><strong>Decisión necesaria:</strong> {b.decision}</span>
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Depende de: <strong className="text-gray-600">{b.dependeDe}</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium">
          {expanded ? 'Ver menos' : `+ ${BLOQUEADAS_REALES.length - 4} más`}
          <ChevronRight size={11} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        <button onClick={onNavigate} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold">
          Ver en portafolio <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* HERO */}
      <section className="gradient-hero text-white px-8 py-14 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <p className="text-brand-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
            Grupo Point · Gerencia Corporativa de Tecnologías Avanzadas
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-[1.1] mb-4">
            174 iniciativas que llevan a Point<br className="hidden md:block" /> al siguiente nivel tecnológico
          </h1>
          <p className="text-brand-200 text-sm md:text-base max-w-2xl mb-3 leading-relaxed">
            Cada tarea del Master List, leída en detalle — descripción, objetivos, plan de acción, cuellos de botella, logros —
            forma parte de un plan coherente que construye <strong className="text-white">seis capacidades estratégicas</strong> en simultáneo.
            Esta web es ese plan, hecho visible.
          </p>
          <p className="text-white/70 text-xs italic max-w-2xl mb-8">
            174 iniciativas · 7 países · 33 entregadas · 31 en ejecución activa · 6 capacidades en construcción.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/portafolio')} className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-brand-50 transition-all text-sm">
              Explorar el Master List <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('/madurez')} className="inline-flex items-center gap-2 bg-brand-700/80 text-white font-medium px-5 py-3 rounded-xl hover:bg-brand-800 transition-all text-sm border border-brand-600/50">
              Ruta de madurez 2027 <TrendingUp size={14} />
            </button>
          </div>
        </div>
        <div className="absolute right-12 top-10 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #00A651 0%, transparent 70%)' }} />
      </section>

      {/* KPI strip */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
            <AnimatedKpi value={174} label="Iniciativas totales" sub="7 países del Grupo" delay={0} />
            <AnimatedKpi value={33} label="Ya entregadas" sub="Valor real comprobado" color="#00A651" delay={100} />
            <AnimatedKpi value={31} label="En ejecución" sub="Avance medible" color="#2563eb" delay={200} />
            <AnimatedKpi value={6}  label="Capacidades en construcción" sub="Ejes del plan TA/TI" color="#7c3aed" delay={300} />
            <AnimatedKpi value={68} label="Alta prioridad" sub="Foco del año" color="#d97706" delay={400} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full px-8 py-6 space-y-6">

        {/* ── Análisis profundo del Master List ─────────────────── */}
        <ChartCard
          title="Las 6 capacidades estratégicas que emergen del Master List"
          subtitle="Lectura agregada de las 174 iniciativas. Cada eje muestra el estado de hoy, el próximo nivel concreto y las tareas reales en ejecución que lo construyen."
          accent="linear-gradient(90deg, #2563eb, #7c3aed, #00A651)"
        >
          <DeepCapabilityAnalysis />
        </ChartCard>

        {/* ── Logros tangibles ──────────────────────────────────── */}
        <ChartCard
          title="Logros tangibles — entregas concretas, no informes"
          subtitle="Las 6 victorias más significativas del último año, con texto real extraído de la columna de cierre del Master List."
          accent="linear-gradient(90deg, #00A651, #16a34a)"
        >
          <TangibleWinsGrid />
        </ChartCard>

        {/* ── Pipeline + Priority ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChartCard
            title="Pipeline ejecutivo de las 174 iniciativas"
            subtitle="Dónde está cada iniciativa en su ciclo de vida. Pasa el cursor sobre cada estado para ver qué significa."
            accent="linear-gradient(90deg, #2563eb, #7c3aed)"
          >
            <ExecutiveFunnel />
          </ChartCard>

          <ChartCard
            title="Matriz prioridad × ejecución"
            subtitle="Cruce entre prioridad asignada y avance real. Permite auditar si el portafolio enfoca su capacidad correctamente."
            accent="linear-gradient(90deg, #dc2626, #d97706)"
          >
            <PriorityMatrix />
          </ChartCard>
        </div>

        {/* ── Country achievement ───────────────────────────────── */}
        <ChartCard
          title="Entrega por país — quién está más avanzado"
          subtitle="Iniciativas completadas, en ejecución, pendientes y bloqueadas por operación. Cada país tiene su ritmo y su backlog propio."
          accent="linear-gradient(90deg, #00A651, #0891b2)"
        >
          <CountryAchievement />
        </ChartCard>

        {/* ── Bloqueadas ────────────────────────────────────────── */}
        <BlockedDecisions onNavigate={() => navigate('/portafolio')} />

      </div>
    </div>
  );
}
