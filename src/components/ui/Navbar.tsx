import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, Globe, BarChart2, Activity, ChevronRight } from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio', tour: 'nav-inicio' },
  { to: '/portafolio', icon: Layers, label: 'Portafolio', tour: 'nav-portafolio' },
  { to: '/paises', icon: Globe, label: 'País / Área', tour: 'nav-paises' },
  { to: '/madurez', icon: BarChart2, label: 'Madurez', tour: 'nav-madurez' },
  { to: '/ejecucion', icon: Activity, label: 'Ejecución', tour: 'nav-ejecucion' },
];

interface NavbarProps { breadcrumb?: string[] }

export function Navbar({ breadcrumb }: NavbarProps) {
  return (
    <header className="bg-brand-900 text-white shadow-lg z-40 relative">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center font-black text-white text-sm">GP</div>
          <div>
            <div className="text-sm font-bold leading-tight">Grupo Point</div>
            <div className="text-brand-300 text-xs leading-none">Tecnologías Avanzadas</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1" data-tour="navbar-nav">
          {nav.map(({ to, icon: Icon, label, tour }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-tour={tour}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="text-xs text-brand-400">Master List TA v2.0</div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 1 && (
        <div className="flex items-center gap-1.5 px-6 pb-2 text-xs text-brand-300">
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={11} />}
              <span className={i === breadcrumb.length - 1 ? 'text-white' : ''}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
}
