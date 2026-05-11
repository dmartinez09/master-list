import type {
  EstadoCatalog, DimensionCatalog, NivelMadurezCatalog,
  NivelImpactoCatalog, RolCatalog, CategoriaCatalog
} from '../types';

export const ESTADOS: EstadoCatalog[] = [
  { estado: 'Solicitado / A validar', significado: 'A espera de validación por parte de TA/TI para determinar viabilidad y prioridad.', avance: '0%', avancePct: 0 },
  { estado: 'En Espera de TI / TA', significado: 'Inicio formal definido, pero sin ejecución. Depende de disponibilidad de recursos internos.', avance: '0%', avancePct: 0 },
  { estado: 'Próximo (Backlog listo)', significado: 'Después de planificación, esperando ventana para empezar. Backlog refinado y listo.', avance: '0%', avancePct: 0 },
  { estado: 'En proceso 0% - 25%', significado: 'Entre 0% y 25% de avance real. Inicio de actividades confirmado.', avance: '0–25%', avancePct: 12 },
  { estado: 'En proceso 25% - 50%', significado: 'Entre 25% y 50% de avance. Hitos iniciales cumplidos, en ejecución activa.', avance: '25–50%', avancePct: 37 },
  { estado: 'En proceso 51% - 75%', significado: 'Entre 51% y 75% de avance. Fase central completada, aproximándose a entrega.', avance: '51–75%', avancePct: 62 },
  { estado: 'En proceso 75% - +', significado: 'Entre 75% y cierre. En fase final, revisión y afinamiento.', avance: '75–90%', avancePct: 82 },
  { estado: 'Aprobación Final', significado: 'En espera de aprobación formal para cierre o entrega. Trabajo técnico completado.', avance: '99%', avancePct: 99 },
  { estado: 'Finalizado', significado: 'Completado y cerrado. Resultados entregados y validados por el área solicitante.', avance: '100%', avancePct: 100 },
  { estado: 'Fuera del Plan', significado: 'Fuera del plan de trabajo actual. Posiblemente revisado en el futuro según prioridades.', avance: '0%', avancePct: 0 },
  { estado: 'Bloqueado', significado: 'Hay bloqueos, dependencia no resuelta o desvío severo de alcance, costo o plazo.', avance: '0–99%', avancePct: 0 },
];

export const DIMENSIONES: DimensionCatalog[] = [
  {
    nombre: 'Transformación Digital',
    queRobustece: 'Sistemas core, datos y automatización del Grupo',
    preguntasResponde: '¿Tenemos las herramientas adecuadas? ¿Los datos fluyen entre sistemas?',
    estadoActual: 'Nivel 2 — Fragmentada',
    nivelActual: 2,
    objetivo2027: 4,
    brecha: 'Alta',
    cuello: 'Sistemas fragmentados por país, falta de Datawarehouse corporativo',
  },
  {
    nombre: 'Capacidad Organizacional',
    queRobustece: 'Personas, conocimiento, adopción tecnológica y gestión del cambio',
    preguntasResponde: '¿La gente sabe usar lo que tenemos? ¿Hay sucesión? ¿Hay capacidad interna?',
    estadoActual: 'Nivel 1–2 — Crítica',
    nivelActual: 1,
    objetivo2027: 3,
    brecha: 'Crítica',
    cuello: 'Conocimiento concentrado, baja adopción, falta gestión del cambio',
  },
  {
    nombre: 'Gobierno y Procesos',
    queRobustece: 'Estandarización, documentación, comités y políticas del Grupo',
    preguntasResponde: '¿Hay reglas claras? ¿Está documentado? ¿Hay control y trazabilidad?',
    estadoActual: 'Nivel 1–2 — En construcción',
    nivelActual: 2,
    objetivo2027: 3,
    brecha: 'Alta',
    cuello: 'Procesos no documentados, datos maestros inconsistentes entre países',
  },
  {
    nombre: 'Cumplimiento y Riesgo',
    queRobustece: 'Continuidad operativa, regulatorio, ciberseguridad y auditoría',
    preguntasResponde: '¿Estamos protegidos? ¿Cumplimos la regulación? ¿Resistimos un incidente?',
    estadoActual: 'Nivel 2 — Sólido',
    nivelActual: 2,
    objetivo2027: 3,
    brecha: 'Media',
    cuello: 'Soporte regulatorio en Excel/SharePoint, espacio con riesgo crítico',
  },
  {
    nombre: 'Experiencia',
    queRobustece: 'Productos y servicios visibles a cliente y colaborador interno',
    preguntasResponde: '¿Cómo se siente comprar, vender o trabajar en Point?',
    estadoActual: 'Nivel 1–2 — Por desarrollar',
    nivelActual: 1,
    objetivo2027: 3,
    brecha: 'Alta',
    cuello: 'Canales informales, cliente sin visibilidad de su operación',
  },
];

export const NIVELES_MADUREZ: NivelMadurezCatalog[] = [
  { nivel: 1, nombre: 'Inicial / Reactiva', descripcion: 'Procesos manuales mayormente. Excel y correo como sistemas. Información en silos por persona. TI apaga incendios.', comoSeVe: 'Pedidos por WhatsApp, stock en lista enviada manualmente, conocimiento en cabeza de personas clave.' },
  { nivel: 2, nombre: 'Repetible / Fragmentada', descripcion: 'ERPs implementados pero subutilizados. Reportes existen pero se construyen a mano. Cada país opera diferente.', comoSeVe: 'Lanix, Siesa, Contanet/SAP, Contifico operando en paralelo. Reportes Excel por área. Power BI puntual.' },
  { nivel: 3, nombre: 'Definida / Integrada', descripcion: 'Sistemas core conectados (ERP↔CRM↔BI). Datos maestros estandarizados. Procesos documentados. Reportes automatizados.', comoSeVe: 'Datawarehouse corporativo, SAP B1 como eje, Salesforce conectado, datos maestros consistentes entre países.' },
  { nivel: 4, nombre: 'Gestionada / Data-Driven', descripcion: 'Decisiones basadas en datos en tiempo real. Analítica predictiva. Adopción tecnológica medida. Gobierno de datos activo.', comoSeVe: 'Tableros ejecutivos con KPIs en vivo, alertas automáticas, modelos predictivos de cartera y demanda.' },
  { nivel: 5, nombre: 'Optimizada / IA-nativa', descripcion: 'IA embebida en la operación. Mejora continua automatizada. La organización aprende de sus datos. Innovación sistemática.', comoSeVe: 'Agentes IA en operación regulatoria y soporte, recomendaciones automáticas a vendedores, detección de fraude.' },
];

export const NIVELES_IMPACTO: NivelImpactoCatalog[] = [
  { nivel: 'L1 - Estructural', significado: 'Cambia cómo opera el Grupo o un país. Sin esto, no hay siguiente etapa de transformación.', ejemplos: 'SAP B1, Datawarehouse, Salesforce, Analista Corporativo, Comité IA' },
  { nivel: 'L2 - Habilitador', significado: 'Desbloquea iniciativas L1 o robustece transversalmente varias áreas del negocio.', ejemplos: 'Datos maestros, diccionario de datos, capacitación Power BI, política de TI' },
  { nivel: 'L3 - Mejora puntual', significado: 'Optimización con ROI rápido, sin dependencias críticas. Sostiene el momentum de transformación.', ejemplos: 'Automatizaciones individuales, reportes Power BI específicos, RPAs aislados' },
];

export const ROLES: RolCatalog[] = [
  { rol: 'Foundation', queSignifica: '"Sin esto, lo demás no funciona." Base que habilita todo lo posterior. Suelen ser sistemas core, datos maestros o capacidades organizacionales críticas.', comoIdentificarla: 'Si esta iniciativa NO se hace, varias otras quedan bloqueadas o pierden sentido.' },
  { rol: 'Enabler', queSignifica: '"Conecta o estandariza." No tiene impacto visible directo, pero permite que otras iniciativas funcionen mejor, más rápido y con menos errores.', comoIdentificarla: 'Esta iniciativa hace que otras corran más rápido, con menos errores, o que se puedan medir.' },
  { rol: 'Outcome', queSignifica: '"Valor visible al usuario final, cliente o Directorio." Es lo que la gente ve y siente. Tableros, reportes, automatizaciones con impacto medible.', comoIdentificarla: 'Si pregunto "¿qué cambió para el usuario?", esta iniciativa tiene una respuesta concreta.' },
  { rol: 'Hygiene', queSignifica: '"Cumplimiento, seguridad, continuidad." No transforma nada — sostiene la operación. Si no se hace, hay riesgo o incumplimiento.', comoIdentificarla: 'La haces porque tienes que hacerla, no porque te diferencie competitivamente.' },
];

export const CATEGORIAS: CategoriaCatalog[] = [
  { nombre: 'Automatización & BI', significado: 'Proyectos centrados en la automatización de procesos manuales, creación de informes, paneles de control (dashboards) y sistemas de inteligencia empresarial para mejorar la toma de decisiones.' },
  { nombre: 'ERP & Sistemas', significado: 'Iniciativas relacionadas con la implementación, optimización y desarrollo de sistemas centrales de gestión empresarial (ERP), incluyendo módulos financieros, de operaciones y logística.' },
  { nombre: 'Capacitación & Gestión del Cambio', significado: 'Esfuerzos dirigidos a la adopción de nuevas tecnologías, gestión de proyectos de cambio organizacional y desarrollo de capacidades internas.' },
  { nombre: 'Infraestructura', significado: 'Actualización y mantenimiento de equipos informáticos, redes, servidores y otros componentes tecnológicos que soportan la operación del Grupo.' },
  { nombre: 'Procesos & Documentación', significado: 'Proyectos para el levantamiento, estandarización y documentación de procedimientos clave para mejorar la eficiencia operativa y garantizar continuidad.' },
  { nombre: 'CRM & Ventas', significado: 'Iniciativas enfocadas en el manejo de relaciones con el cliente, optimización del canal de ventas e implementación de plataformas comerciales.' },
  { nombre: 'Integración & Desarrollo', significado: 'Desarrollo de integraciones entre sistemas, APIs, y soluciones de software a medida que conectan plataformas del ecosistema tecnológico del Grupo.' },
];

export const PIPELINE_ORDER: EstadoCatalog['estado'][] = [
  'Solicitado / A validar',
  'En Espera de TI / TA',
  'Próximo (Backlog listo)',
  'En proceso 0% - 25%',
  'En proceso 25% - 50%',
  'En proceso 51% - 75%',
  'En proceso 75% - +',
  'Aprobación Final',
  'Finalizado',
  'Bloqueado',
  'Fuera del Plan',
];
