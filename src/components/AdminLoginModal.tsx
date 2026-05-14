import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ open, onClose }: Props) {
  const { login } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError(null);
    setSubmitting(true);
    const res = await login(password);
    setSubmitting(false);
    if (res.ok) {
      onClose();
    } else {
      setError(res.error);
      setPassword('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm fade-in overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">Acceso de administrador</h3>
            <p className="text-[11px] text-gray-500">Solo para gestionar el portafolio</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
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
                placeholder="Ingresa la contraseña"
                disabled={submitting}
                autoComplete="current-password"
                style={{
                  fontFamily: showPassword
                    ? 'inherit'
                    : '"Inter", system-ui, -apple-system, sans-serif',
                  letterSpacing: showPassword ? 'normal' : '0.35em',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                  caretColor: '#00A651',
                }}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 disabled:opacity-50 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Indicador discreto del número de caracteres tipeados */}
            {password.length > 0 && (
              <p className="mt-1.5 text-[10px] text-gray-400 text-right">
                {password.length} caracteres
              </p>
            )}
          </label>

          {error && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
              <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="mt-4 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <Lock size={13} /> Iniciar sesión
              </>
            )}
          </button>

          <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
            La sesión queda activa por 12 horas. Tras iniciar podrás editar campos del portafolio y mover hallazgos del Kanban.
          </p>
        </form>
      </div>
    </div>
  );
}
