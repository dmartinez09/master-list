import type { Iniciativa } from '../types';

/**
 * 4 dimensiones del framework de madurez tecnológica del Grupo Point.
 * Basadas en Gartner ITScore + CMMI v3.0 + NIST CSF 2.0 + DAMA-DMBOK + Gartner AI Maturity.
 * Estas son las MISMAS dimensiones que se usan en /madurez.
 */
export type FrameworkDim =
  | 'Datos y Analítica'
  | 'Aplicaciones e Infraestructura'
  | 'Ciberseguridad y Gobierno'
  | 'Personas, IA e Innovación';

export const FRAMEWORK_DIMENSIONS: { name: FrameworkDim; short: string; framework: string; color: string; light: string; border: string; descripcion: string; }[] = [
  {
    name: 'Datos y Analítica', short: 'Datos', framework: 'DAMA-DMBOK',
    color: '#2563eb', light: '#eff6ff', border: '#93c5fd',
    descripcion: 'Cómo el Grupo captura, gobierna y explota sus datos para decidir. Incluye Datawarehouse, Power BI, KPIs estandarizados y diccionario de datos.',
  },
  {
    name: 'Aplicaciones e Infraestructura', short: 'Apps', framework: 'Gartner ITScore',
    color: '#0891b2', light: '#ecfeff', border: '#67e8f9',
    descripcion: 'ERPs, CRMs e integraciones que constituyen la columna vertebral operativa. Incluye SAP B1, Salesforce, Lanix, Siesa y los flujos entre ellos.',
  },
  {
    name: 'Ciberseguridad y Gobierno', short: 'Seguridad', framework: 'NIST CSF 2.0',
    color: '#dc2626', light: '#fef2f2', border: '#fca5a5',
    descripcion: 'Continuidad, cumplimiento, política y respaldo del Grupo. Incluye Defender, respaldos, Política TI y comités de gobierno.',
  },
  {
    name: 'Personas, IA e Innovación', short: 'IA', framework: 'Gartner AI Maturity',
    color: '#7c3aed', light: '#f5f3ff', border: '#c4b5fd',
    descripcion: 'Talento digital, adopción de IA y capacidad de cambio. Incluye Comité IA, capacitaciones, agentes Copilot y gestión del cambio.',
  },
];

const FRAMEWORK_BY_NAME: Record<string, typeof FRAMEWORK_DIMENSIONS[number]> =
  Object.fromEntries(FRAMEWORK_DIMENSIONS.map(d => [d.name, d]));

export function frameworkColor(name: string) {
  return FRAMEWORK_BY_NAME[name] ?? FRAMEWORK_DIMENSIONS[1];
}

/**
 * Mapea cualquier iniciativa del Master List a una de las 4 dimensiones del framework.
 * Estrategia: keywords IA primero (siempre prevalecen), luego categoría.
 */
export function mapToFramework(i: Iniciativa): FrameworkDim {
  const text = `${i.titulo ?? ''} ${i.descripcion ?? ''} ${i.objetivos ?? ''}`.toLowerCase();

  // 1) Keywords de IA tienen prioridad absoluta
  if (/(\bia\b|inteligencia artificial|copilot|perplexity|generativa|chatgpt|llm|agente conversacional|agentes? de ia)/.test(text)) {
    return 'Personas, IA e Innovación';
  }

  // 2) Capacitación / cambio organizacional
  const cat = (i.categoria ?? '').toLowerCase();
  if (cat.includes('capacitación') || cat.includes('cambio')) {
    return 'Personas, IA e Innovación';
  }

  // 3) Datos y BI
  if (cat.includes('automatización') || cat.includes('bi')) {
    return 'Datos y Analítica';
  }
  if (/(power bi|datawarehouse|tablero|reportería|dashboard|kpi|indicador|reporte)/.test(text)) {
    return 'Datos y Analítica';
  }

  // 4) Seguridad, gobierno, política, infraestructura física
  if (cat.includes('infraestructura') || cat.includes('procesos') || cat.includes('documentación')) {
    return 'Ciberseguridad y Gobierno';
  }
  if (/(política|policy|seguridad|defender|antivirus|respaldo|backup|comité|gobierno|cumplimiento|regulator)/.test(text)) {
    return 'Ciberseguridad y Gobierno';
  }

  // 5) ERPs, CRM, integraciones, sistemas core
  if (cat.includes('erp') || cat.includes('crm') || cat.includes('integración') || cat.includes('desarrollo') || cat.includes('ventas')) {
    return 'Aplicaciones e Infraestructura';
  }

  // Fallback: la mayoría de iniciativas no clasificadas son aplicaciones
  return 'Aplicaciones e Infraestructura';
}

/* Tailwind-friendly badge classes per dimension */
export const FRAMEWORK_BADGE: Record<FrameworkDim, string> = {
  'Datos y Analítica':              'bg-blue-50 text-blue-800 border border-blue-200',
  'Aplicaciones e Infraestructura': 'bg-cyan-50 text-cyan-800 border border-cyan-200',
  'Ciberseguridad y Gobierno':      'bg-red-50 text-red-800 border border-red-200',
  'Personas, IA e Innovación':      'bg-violet-50 text-violet-800 border border-violet-200',
};
