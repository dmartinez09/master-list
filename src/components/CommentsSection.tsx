import React, { useState } from 'react';
import { MessageSquare, Send, User as UserIcon, CheckCircle2, AlertTriangle, Trash2, X } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  initiativeId: string;
}

/** Devuelve "hace 5 min", "hace 2 h", "hace 3 días" o fecha completa */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hace unos segundos';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} día${d > 1 ? 's' : ''}`;
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Iniciales de "Diego Martínez" → "DM" para el avatar */
function initials(nombre: string, apellido: string): string {
  return `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
}

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#db2777', '#0d9488'];
function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function CommentsSection({ initiativeId }: Props) {
  const { isAdmin } = useAuth();
  const { comments, loading, error, submit, submitting, remove } = useComments(initiativeId);

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [contenido, setContenido] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reset = () => {
    setContenido('');
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(false);

    const n = nombre.trim();
    const a = apellido.trim();
    const c = contenido.trim();
    if (n.length < 2 || a.length < 2 || c.length < 3) {
      setFormError('Nombre y apellido (mín 2 letras) y comentario (mín 3 letras) son obligatorios.');
      return;
    }

    const res = await submit({ nombre: n, apellido: a, contenido: c });
    if (res.ok) {
      reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setFormError(res.error);
    }
  };

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded bg-brand-50 flex items-center justify-center">
          <MessageSquare size={13} className="text-brand-600" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Comentarios
          {comments.length > 0 && (
            <span className="ml-1.5 text-gray-400 normal-case font-medium">({comments.length})</span>
          )}
        </h3>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4"
      >
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            maxLength={50}
            disabled={submitting}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Apellido"
            value={apellido}
            onChange={e => setApellido(e.target.value)}
            maxLength={50}
            disabled={submitting}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
          />
        </div>
        <textarea
          placeholder="Escribe tu comentario..."
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          maxLength={2000}
          disabled={submitting}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50 resize-y"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-gray-400">
            {contenido.length}/2000 — máximo 3 comentarios por minuto
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Send size={11} /> Publicar
              </>
            )}
          </button>
        </div>

        {/* Form feedback */}
        {formError && (
          <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-800 leading-relaxed">{formError}</p>
          </div>
        )}
        {success && (
          <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg fade-in">
            <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed">Comentario publicado. Gracias por participar.</p>
          </div>
        )}
      </form>

      {/* Comments list */}
      {loading && comments.length === 0 && (
        <div className="text-center py-6">
          <span className="inline-block w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-[11px] text-gray-400 mt-2">Cargando comentarios...</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
          <MessageSquare size={20} className="text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Aún no hay comentarios. Sé el primero en dejar uno.</p>
        </div>
      )}

      {deleteError && (
        <div className="mb-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-800 leading-relaxed">{deleteError}</p>
          <button onClick={() => setDeleteError(null)} className="ml-auto text-red-400 hover:text-red-600"><X size={12} /></button>
        </div>
      )}

      <div className="space-y-2.5">
        {comments.map(c => {
          const fullName = `${c.nombre} ${c.apellido}`.trim();
          const color = avatarColor(fullName);
          const isPending = pendingDelete === c.id;
          return (
            <div key={c.id} className={`flex gap-3 p-3 rounded-xl border bg-white transition-colors ${isPending ? 'border-red-300 bg-red-50/40' : 'border-gray-100 hover:border-gray-200'}`}>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px]"
                style={{ backgroundColor: color }}
                title={fullName}
              >
                {initials(c.nombre, c.apellido) || <UserIcon size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-xs font-bold text-gray-900">{fullName}</p>
                  <span className="text-[10px] text-gray-400">· {timeAgo(c.createdAt)}</span>

                  {/* Admin: botón borrar / confirmación */}
                  {isAdmin && !isPending && (
                    <button
                      onClick={() => { setPendingDelete(c.id); setDeleteError(null); }}
                      className="ml-auto text-[10px] text-gray-400 hover:text-red-600 flex items-center gap-0.5 px-1.5 py-0.5 rounded transition-colors"
                      title="Borrar comentario (admin)"
                    >
                      <Trash2 size={11} /> Borrar
                    </button>
                  )}
                  {isAdmin && isPending && (
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-[10px] text-red-700 font-semibold">¿Confirmar borrado?</span>
                      <button
                        onClick={async () => {
                          const res = await remove(c.id);
                          setPendingDelete(null);
                          if (!res.ok) setDeleteError(res.error);
                        }}
                        className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-semibold"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={() => setPendingDelete(null)}
                        className="text-[10px] text-gray-500 hover:text-gray-800 px-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {c.contenido}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
