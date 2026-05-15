import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Layers, Globe, BarChart2, Activity, ChevronRight,
  Lock, LogOut, ShieldCheck, HelpCircle, KeyRound, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from '../LoginModal';

/** Borra los flags localStorage del tour y dispara el evento que TourEngine escucha */
function restartTour() {
  localStorage.removeItem('ta_tour_v3_done');
  localStorage.removeItem('ta_portfolio_tour_v2_done');
  window.dispatchEvent(new Event('tour:dismissed'));
}

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio', tour: 'nav-inicio' },
  { to: '/portafolio', icon: Layers, label: 'Portafolio', tour: 'nav-portafolio' },
  { to: '/paises', icon: Globe, label: 'País / Área', tour: 'nav-paises' },
  { to: '/madurez', icon: BarChart2, label: 'Madurez', tour: 'nav-madurez' },
  { to: '/ejecucion', icon: Activity, label: 'Ejecución', tour: 'nav-ejecucion' },
];

interface NavbarProps { breadcrumb?: string[] }

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626'];
const avatarColor = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (n: string) => n.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export function Navbar({ breadcrumb }: NavbarProps) {
  const { isAdmin, session, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isManagerSession = session?.role === 'manager';

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

        {/* Tour + login/user */}
        <div className="flex items-center gap-2">
          <button
            onClick={restartTour}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors border border-brand-700/50"
            title="Volver a ver el tour de bienvenida"
          >
            <HelpCircle size={12} />
            <span className="hidden lg:inline">Tour</span>
          </button>

          {/* Admin badge */}
          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30">
                <ShieldCheck size={12} className="text-emerald-300" />
                <span className="text-[11px] font-semibold text-emerald-200">Admin</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={12} />
                <span className="hidden md:inline">Salir</span>
              </button>
            </div>
          )}

          {/* Manager user menu */}
          {isManagerSession && session?.userName && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-brand-800 transition-colors"
                title={`Sesión activa como ${session.userName}`}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
                  style={{ backgroundColor: avatarColor(session.userName) }}
                >
                  {initials(session.userName)}
                </div>
                <span className="text-xs font-semibold text-white hidden md:inline">
                  {session.userName.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs font-bold text-gray-900">{session.userName}</p>
                    <p className="text-[10px] text-gray-500">Crea y aprueba tareas</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); setLoginOpen(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-gray-50 text-left"
                  >
                    <KeyRound size={12} className="text-gray-400" />
                    Cambiar mi contraseña
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs hover:bg-red-50 text-left text-red-600 border-t border-gray-100"
                  >
                    <LogOut size={12} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Login button (no sesión) */}
          {!session && (
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors border border-brand-700/50"
              title="Iniciar sesión"
            >
              <Lock size={12} />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </button>
          )}
        </div>
      </div>

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

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
