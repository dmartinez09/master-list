import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const TOUR_KEY = 'ta_tour_v1_done';

interface Step {
  selector: string;
  title: string;
  content: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="navbar-nav"]',
    title: 'Bienvenido a la Master List TA',
    content: 'Usa el menú superior para navegar entre las secciones: Inicio, Portafolio, País/Área, Madurez y Ejecución.',
  },
  {
    selector: '[data-tour="nav-portafolio"]',
    title: 'Portafolio de Iniciativas',
    content: 'Explora y filtra las 174 iniciativas por país, área, estado y más. Si el resultado queda fuera de la vista, una flecha roja te guía automáticamente.',
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

interface Rect { top: number; left: number; width: number; height: number }

export function Tour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  const updateRect = useCallback(() => {
    if (!visible) return;
    const el = document.querySelector(STEPS[step].selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }
  }, [step, visible]);

  useLayoutEffect(() => { updateRect(); }, [updateRect]);

  useEffect(() => {
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  };

  const next = () => isLast ? dismiss() : setStep(s => s + 1);

  // Tooltip positioning: below the highlighted element, centered
  const tooltipLeft = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const tooltipTop = rect ? rect.top + rect.height + 14 : window.innerHeight / 2;
  const clampedLeft = Math.min(Math.max(tooltipLeft, 160), window.innerWidth - 160);

  const PAD = 6;
  const spotRect = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  return (
    <>
      {/* Click blocker */}
      <div className="fixed inset-0 z-[998] pointer-events-auto" />

      {/* Spotlight with shadow overlay */}
      {spotRect && (
        <div
          className="fixed z-[999] pointer-events-none rounded-lg"
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
        {/* Arrow up */}
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid white' }}
        />

        <div className="flex items-start justify-between mb-1.5">
          <h3 className="text-sm font-bold text-gray-800 pr-2">{current.title}</h3>
          <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
            <X size={13} />
          </button>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-3">{current.content}</p>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-300 font-medium">{step + 1} de {STEPS.length}</span>
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
