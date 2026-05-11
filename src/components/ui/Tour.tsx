import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface Step {
  selector: string;
  title: string;
  content: string;
}

interface Rect { top: number; left: number; width: number; height: number }

interface TourProps {
  steps: Step[];
  storageKey: string;
  prerequisiteKey?: string;
}

function TourEngine({ steps, storageKey, prerequisiteKey }: TourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const check = () => {
      if (prerequisiteKey && !localStorage.getItem(prerequisiteKey)) return;
      if (!localStorage.getItem(storageKey)) setVisible(true);
    };
    check();
    window.addEventListener('tour:dismissed', check);
    return () => window.removeEventListener('tour:dismissed', check);
  }, [storageKey, prerequisiteKey]);

  const updateRect = useCallback(() => {
    if (!visible) return;
    const el = steps[step].selector ? document.querySelector(steps[step].selector) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    } else {
      setRect(null);
    }
  }, [step, visible, steps]);

  useLayoutEffect(() => { updateRect(); }, [updateRect]);

  useEffect(() => {
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  // Dismiss with Escape key
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
    window.dispatchEvent(new Event('tour:dismissed'));
  };

  const next = () => isLast ? dismiss() : setStep(s => s + 1);

  // Smart positioning: tall elements (like sidebar) get tooltip to the right
  const isTall = rect && rect.height > window.innerHeight * 0.4;
  let tooltipTop: number;
  let tooltipLeft: number;
  let arrowDir: 'up' | 'left' | 'none' = 'none';

  if (!rect) {
    tooltipTop = window.innerHeight / 2 - 80;
    tooltipLeft = window.innerWidth / 2;
  } else if (isTall) {
    // Position to the right of the element, vertically centered
    tooltipTop = window.innerHeight / 2 - 80;
    tooltipLeft = rect.left + rect.width + 160;
    arrowDir = 'left';
  } else {
    tooltipTop = rect.top + rect.height + 14;
    tooltipLeft = rect.left + rect.width / 2;
    arrowDir = 'up';
    // Clamp if goes below viewport
    if (tooltipTop + 180 > window.innerHeight) {
      tooltipTop = rect.top - 180;
      arrowDir = 'none';
    }
  }

  const clampedLeft = Math.min(Math.max(tooltipLeft, 160), window.innerWidth - 160);

  const PAD = 6;
  const spotRect = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  return (
    <>
      {/* Click blocker */}
      <div className="fixed inset-0 z-[998] pointer-events-auto" />

      {/* Spotlight */}
      {spotRect && (
        <div
          className="fixed z-[999] pointer-events-none"
          style={{
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
            border: '2px solid rgba(255,255,255,0.35)',
            borderRadius: 10,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[1000] w-72 bg-white rounded-xl shadow-2xl p-4 pointer-events-auto"
        style={{ top: tooltipTop, left: clampedLeft, transform: 'translateX(-50%)' }}
      >
        {arrowDir === 'up' && (
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid white' }}
          />
        )}
        {arrowDir === 'left' && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0"
            style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid white' }}
          />
        )}

        <div className="flex items-start justify-between mb-1.5">
          <h3 className="text-sm font-bold text-gray-800 pr-2">{current.title}</h3>
          <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
            <X size={13} />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-3">{current.content}</p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-300 font-medium">{step + 1} de {steps.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={dismiss} className="text-[11px] text-gray-400 hover:text-gray-600 px-1">
              Omitir
            </button>
            <button
              onClick={next}
              className="text-[11px] bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded-lg font-semibold transition-colors"
            >
              {isLast ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Tour principal — menú de navegación ─────────────────────────── */
const NAV_STEPS: Step[] = [
  {
    selector: '[data-tour="nav-portafolio"]',
    title: 'Portafolio de Iniciativas',
    content: 'Explora y filtra las 174 iniciativas. Al entrar verás un tour específico que te explica los filtros y vistas disponibles.',
  },
  {
    selector: '[data-tour="nav-paises"]',
    title: 'País / Área',
    content: 'Portafolio agrupado por país y área de negocio.',
  },
  {
    selector: '[data-tour="nav-madurez"]',
    title: 'Madurez',
    content: 'Nivel de madurez digital del portafolio.',
  },
  {
    selector: '[data-tour="nav-ejecucion"]',
    title: 'Ejecución',
    content: 'Seguimiento del avance de iniciativas activas.',
  },
];

export function Tour() {
  return <TourEngine steps={NAV_STEPS} storageKey="ta_tour_v3_done" />;
}

/* ── Tour de Portafolio — filtros y vistas ───────────────────────── */
const PORTFOLIO_STEPS: Step[] = [
  {
    selector: '[data-tour="sidebar-filters"]',
    title: 'Panel de filtros',
    content: 'Filtra las iniciativas por país, empresa, área, sub área, estado y capacidad estratégica. Los resultados se actualizan en tiempo real.',
  },
  {
    selector: '[data-tour="view-toggle"]',
    title: 'Vistas disponibles',
    content: 'Kanban organiza las iniciativas por estado en columnas. Tabla las muestra en formato de lista con todos los campos. Cambia según lo que necesites ver.',
  },
  {
    selector: '[data-tour="col-manager"]',
    title: 'Gestionar columnas Kanban',
    content: 'Personaliza el tablero: muestra u oculta columnas según lo que necesites ver, y reordénalas a tu gusto. También puedes mover cada columna con las flechas ← → en su encabezado. Los cambios se guardan automáticamente.',
  },
];

export function PortfolioTour() {
  return <TourEngine steps={PORTFOLIO_STEPS} storageKey="ta_portfolio_tour_v2_done" prerequisiteKey="ta_tour_v3_done" />;
}
