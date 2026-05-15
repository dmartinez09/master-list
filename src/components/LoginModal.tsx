import React, { useState, useEffect, useRef } from 'react';
import {
  X, Lock, AlertTriangle, Eye, EyeOff, ChevronRight, ChevronLeft, ShieldCheck,
  User as UserIcon, CheckCircle2, KeyRound,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listUsers, changeMyPassword, type PublicUser } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Screen = 'select' | 'password' | 'admin' | 'change-password';

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626'];
const avatarColor = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};
const initials = (n: string) => n.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export function LoginModal({ open, onClose }: Props) {
  const { loginAsAdmin, loginAsUser, session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [screen, setScreen] = useState<Screen>('select');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cambio password state
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Reset al abrir + traer lista de usuarios
  useEffect(() => {
    if (!open) return;
    setScreen(session?.role === 'manager' ? 'change-password' : 'select');
    setError(null);
    setPassword('');
    setSelectedUser(null);
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    setPwdSuccess(false);

    setLoadingUsers(true);
    listUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open, session]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Autofocus en input password
  useEffect(() => {
    if (screen === 'password' || screen === 'admin' || screen === 'change-password') {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [screen]);

  if (!open) return null;

  const goBack = () => {
    setError(null);
    setPassword('');
    setSelectedUser(null);
    setScreen('select');
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await loginAsUser(selectedUser.id, password);
    setSubmitting(false);
    if (res.ok) { onClose(); }
    else { setError(res.error); setPassword(''); setTimeout(() => inputRef.current?.focus(), 30); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await loginAsAdmin(password);
    setSubmitting(false);
    if (res.ok) { onClose(); }
    else { setError(res.error); setPassword(''); setTimeout(() => inputRef.current?.focus(), 30); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPwdSuccess(false);
    if (newPwd.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    if (newPwd !== confirmPwd) { setError('Las contraseñas no coinciden'); return; }
    setSubmitting(true);
    try {
      await changeMyPassword(oldPwd, newPwd);
      setPwdSuccess(true);
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => { setPwdSuccess(false); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message ?? 'Error al cambiar contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md fade-in overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          {screen !== 'select' && (
            <button onClick={goBack} className="p-1 hover:bg-gray-100 rounded-lg" title="Volver">
              <ChevronLeft size={16} className="text-gray-500" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">
              {screen === 'select' && 'Acceso al portafolio'}
              {screen === 'password' && (selectedUser?.name ?? '')}
              {screen === 'admin' && 'Administrador'}
              {screen === 'change-password' && 'Cambiar contraseña'}
            </h3>
            <p className="text-[11px] text-gray-500">
              {screen === 'select' && 'Elige tu usuario'}
              {screen === 'password' && 'Ingresa tu contraseña'}
              {screen === 'admin' && 'Acceso completo de gestión'}
              {screen === 'change-password' && (session?.userName ?? '')}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* SELECT — listado de usuarios */}
        {screen === 'select' && (
          <div className="p-3">
            {loadingUsers && (
              <div className="text-center py-8">
                <span className="inline-block w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              </div>
            )}
            <div className="space-y-1">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUser(u); setScreen('password'); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all text-left group"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0"
                    style={{ backgroundColor: avatarColor(u.name) }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                    <p className="text-[10px] text-gray-400">Crear y aprobar tareas</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setScreen('admin')}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-brand-700 py-2 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <ShieldCheck size={13} /> Iniciar sesión como administrador
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD — usuario seleccionado */}
        {screen === 'password' && selectedUser && (
          <form onSubmit={handleUserLogin} className="p-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: avatarColor(selectedUser.name) }}
              >
                {initials(selectedUser.name)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedUser.name}</p>
                <p className="text-[11px] text-gray-500">Equipo TA</p>
              </div>
            </div>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                Contraseña
              </span>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  disabled={submitting}
                  autoComplete="current-password"
                  style={{
                    fontFamily: showPassword ? 'inherit' : '"Inter", system-ui, sans-serif',
                    letterSpacing: showPassword ? 'normal' : '0.35em',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#111827',
                    caretColor: '#00A651',
                  }}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50 bg-white"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {password.length > 0 && <p className="mt-1.5 text-[10px] text-gray-400 text-right">{password.length} caracteres</p>}
            </label>

            {error && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting || !password.trim()}
              className="mt-4 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={13} />}
              {submitting ? 'Verificando...' : 'Iniciar sesión'}
            </button>

            <p className="mt-3 text-[10px] text-gray-400 text-center leading-relaxed">
              Contraseña por defecto: <strong>Point2026</strong>. Cámbiala después de iniciar sesión.
            </p>
          </form>
        )}

        {/* ADMIN */}
        {screen === 'admin' && (
          <form onSubmit={handleAdminLogin} className="p-6">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block">
                Contraseña de administrador
              </span>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña admin"
                  disabled={submitting}
                  autoComplete="current-password"
                  style={{
                    fontFamily: showPassword ? 'inherit' : '"Inter", system-ui, sans-serif',
                    letterSpacing: showPassword ? 'normal' : '0.35em',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#111827',
                    caretColor: '#00A651',
                  }}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50 bg-white"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800">{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting || !password.trim()}
              className="mt-4 w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
              {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={13} />}
              {submitting ? 'Verificando...' : 'Entrar como admin'}
            </button>
          </form>
        )}

        {/* CHANGE PASSWORD (solo si sesión manager activa) */}
        {screen === 'change-password' && (
          <form onSubmit={handleChangePassword} className="p-6 space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Contraseña actual</label>
              <input
                ref={inputRef}
                type="password"
                value={oldPwd}
                onChange={e => setOldPwd(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Nueva contraseña</label>
              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                disabled={submitting}
                placeholder="Mín. 6 caracteres"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1 block">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800">{error}</p>
              </div>
            )}
            {pwdSuccess && (
              <div className="flex items-start gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg fade-in">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-800">Contraseña actualizada correctamente</p>
              </div>
            )}

            <button type="submit" disabled={submitting || !oldPwd || !newPwd || !confirmPwd}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
              {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound size={13} />}
              {submitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
