import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch, ShieldCheck, MessageSquare, ThumbsUp, ThumbsDown, Pencil,
  PlusCircle, Search, Filter, RefreshCw, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { Navbar } from '../components/ui/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { fetchAdminActivity, type ActivityEvent } from '../lib/api';

const TYPE_CFG: Record<ActivityEvent['type'], { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  create:   { label: 'Creación',  icon: <PlusCircle size={12} />,     color: '#7c3aed', bg: 'bg-violet-50' },
  update:   { label: 'Edición',   icon: <Pencil size={12} />,         color: '#d97706', bg: 'bg-amber-50' },
  approval: { label: 'Aprobación', icon: <ThumbsUp size={12} />,      color: '#00A651', bg: 'bg-emerald-50' },
  comment:  { label: 'Comentario', icon: <MessageSquare size={12} />, color: '#2563eb', bg: 'bg-blue-50' },
};

export default function AdminAudit() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityEvent['type'] | 'all'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAdminActivity()
      .then(setEvents)
      .catch(err => setError(err.message ?? 'No se pudo cargar la auditoría'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    if (isAdmin) load();
  }, [isAdmin, authLoading, navigate]);

  // Filtros y búsqueda
  const filtered = useMemo(() => {
    let r = events;
    if (typeFilter !== 'all') r = r.filter(e => e.type === typeFilter);
    if (userFilter !== 'all') r = r.filter(e => e.by === userFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(e =>
        e.initiativeId.toLowerCase().includes(q) ||
        (e.initiativeTitle ?? '').toLowerCase().includes(q) ||
        e.by.toLowerCase().includes(q) ||
        (e.detail ?? '').toLowerCase().includes(q)
      );
    }
    return r;
  }, [events, search, typeFilter, userFilter]);

  const uniqueUsers = useMemo(
    () => [...new Set(events.map(e => e.by))].sort(),
    [events]
  );

  // Stats
  const stats = useMemo(() => {
    const byType: Record<string, number> = { create: 0, update: 0, approval: 0, comment: 0 };
    events.forEach(e => { byType[e.type] = (byType[e.type] ?? 0) + 1; });
    return byType;
  }, [events]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar breadcrumb={['Inicio', 'Auditoría · Admin']} />

      <div className="max-w-7xl mx-auto w-full px-6 py-6 space-y-5">

        {/* Hero */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <FileSearch size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 mb-0.5">Control de acciones</h1>
            <p className="text-xs text-gray-500">
              Registro completo de todo lo que ocurre en el portafolio: creaciones, ediciones, aprobaciones y comentarios. Solo visible para administradores.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refrescar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['create', 'update', 'approval', 'comment'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
              className={`p-4 rounded-2xl border text-left transition-all ${
                typeFilter === t
                  ? 'border-brand-400 bg-brand-50/50 ring-2 ring-brand-200'
                  : 'border-gray-100 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg" style={{ backgroundColor: `${TYPE_CFG[t].color}22` }}>
                  {TYPE_CFG[t].icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{TYPE_CFG[t].label}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: TYPE_CFG[t].color }}>{stats[t] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <div className="md:col-span-6 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por ID, título, usuario o contenido…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="all">Todas las acciones</option>
              <option value="create">Solo creaciones</option>
              <option value="update">Solo ediciones</option>
              <option value="approval">Solo aprobaciones</option>
              <option value="comment">Solo comentarios</option>
            </select>

            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="all">Todos los usuarios</option>
              {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-2">
            <Filter size={11} />
            Mostrando <strong className="text-gray-800">{filtered.length}</strong> de <strong>{events.length}</strong> eventos
            {(search || typeFilter !== 'all' || userFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setTypeFilter('all'); setUserFilter('all'); }}
                className="ml-auto text-brand-600 hover:underline font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {loading && events.length === 0 && (
          <div className="text-center py-12">
            <span className="inline-block w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-xs text-gray-400 mt-3">Cargando auditoría…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && events.length > 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-sm text-gray-400">Sin resultados con los filtros aplicados.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {filtered.map((e, idx) => {
                const cfg = TYPE_CFG[e.type];
                return (
                  <li
                    key={idx}
                    onClick={() => navigate('/portafolio', { state: { search: e.initiativeId } })}
                    className="px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`p-1.5 rounded-lg shrink-0 ${cfg.bg}`} style={{ color: cfg.color }}>
                        {cfg.icon}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">{e.initiativeId}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                          {e.byRole === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                              <ShieldCheck size={9} /> Admin
                            </span>
                          )}
                        </div>
                        {e.initiativeTitle && (
                          <p className="text-xs text-gray-800 font-medium truncate">{e.initiativeTitle}</p>
                        )}
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          <strong className="text-gray-800">{e.by}</strong>
                          {' '}{e.detail}
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                        {new Date(e.at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
