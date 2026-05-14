import React, { useState, useEffect } from 'react';
import {
  X, MapPin, User, Clock, AlertTriangle, CheckCircle, Target, Zap,
  Pencil, Save, Loader2, ShieldCheck, PlusCircle,
} from 'lucide-react';
import type { Iniciativa } from '../types';
import { EstadoBadge, DimensionBadge, CostoBadge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { ESTADOS, NIVELES_MADUREZ, PIPELINE_ORDER } from '../data/catalogs';
import { FRAMEWORK_DIMENSIONS } from '../utils/framework';
import { CommentsSection } from './CommentsSection';
import { useAuth } from '../contexts/AuthContext';
import { useInitiatives } from '../contexts/InitiativesContext';
import { updateInitiative, createInitiative } from '../lib/api';

interface Props {
  iniciativa: Iniciativa;
  onClose: () => void;
  /** Cuando true, el modal arranca en modo creación con todos los campos vacíos y editables */
  createMode?: boolean;
}

/* ───────────────────────────────────────────────────────────────
   Catálogos auxiliares
─────────────────────────────────────────────────────────────── */
const PRIORIDADES = ['Alta', 'Media', 'Baja'];
const COMPLEJIDADES = ['Alta', 'Media', 'Baja'];
const COSTOS = ['$0k', '<$5k', '$5–10k', '>$10k'];
const TIPOS = ['Iniciativa corporativa', 'Proyecto', 'Tarea'];

/* ───────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded bg-brand-50 flex items-center justify-center">
          <Icon size={13} className="text-brand-600" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '') return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 flex-1">{value}</span>
    </div>
  );
}

function BulletText({ text }: { text: string }) {
  if (!text) return null;
  const bullets = text.split(/[•\n]/).map(s => s.trim()).filter(s => s.length > 10);
  if (bullets.length <= 1) {
    return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }
  return (
    <ul className="space-y-2">
      {bullets.map((b, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
          <span className="leading-relaxed">{b}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────────────────────────────────────────────
   Editable field components — solo se ven en modo edición
─────────────────────────────────────────────────────────────── */
type Patch = Partial<Iniciativa>;

function EditField({
  label, field, value, type = 'text', edit, draft, onChange, placeholder,
}: {
  label?: string;
  field: keyof Iniciativa;
  value: string;
  type?: 'text' | 'textarea';
  edit: boolean;
  draft: Patch;
  onChange: (patch: Patch) => void;
  placeholder?: string;
}) {
  const current = (draft[field] as string) ?? value ?? '';
  if (!edit) return <>{type === 'textarea' ? <BulletText text={value} /> : <span>{value}</span>}</>;

  const handle = (v: string) => onChange({ ...draft, [field]: v });

  return (
    <div>
      {label && <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">{label}</label>}
      {type === 'textarea' ? (
        <textarea
          value={current}
          onChange={e => handle(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
        />
      ) : (
        <input
          type="text"
          value={current}
          onChange={e => handle(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-amber-300 bg-amber-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      )}
    </div>
  );
}

function EditSelect({
  field, value, options, edit, draft, onChange,
}: {
  field: keyof Iniciativa;
  value: string;
  options: string[];
  edit: boolean;
  draft: Patch;
  onChange: (patch: Patch) => void;
}) {
  const current = (draft[field] as string) ?? value ?? '';
  if (!edit) return <>{value}</>;
  return (
    <select
      value={current}
      onChange={e => onChange({ ...draft, [field]: e.target.value })}
      className="px-2 py-1 text-xs border border-amber-300 bg-amber-50/30 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      {value && !options.includes(value) && <option value={value}>{value}</option>}
    </select>
  );
}

/* ───────────────────────────────────────────────────────────────
   Modal principal
─────────────────────────────────────────────────────────────── */
export function InitiativeModal({ iniciativa: i, onClose, createMode = false }: Props) {
  const { isAdmin } = useAuth();
  const { updateLocal, addLocal } = useInitiatives();

  // En createMode siempre arranca en edit
  const [edit, setEdit] = useState(createMode);
  const [draft, setDraft] = useState<Patch>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reset state si cambia la iniciativa
  useEffect(() => {
    setEdit(createMode);
    setDraft({});
    setSaveError(null);
    setSaveSuccess(false);
  }, [i.id, createMode]);

  // ESC para cerrar (solo si no estás editando)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !edit) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [edit, onClose]);

  const fwName = i.frameworkDimension ?? '';
  const fwDef = FRAMEWORK_DIMENSIONS.find(d => d.name === fwName);
  const estadoDef = ESTADOS.find(e => e.estado === i.estado);
  const madurezNum = parseInt(i.nivelMadurez ?? '0');
  const madurezDef = NIVELES_MADUREZ.find(m => m.nivel === madurezNum);

  const pctMap: Record<string, number> = {
    'Finalizado': 100, 'Aprobación Final': 99,
    'En proceso 75% - +': 82, 'En proceso 51% - 75%': 62,
    'En proceso 25% - 50%': 37, 'En proceso 0% - 25%': 12,
  };
  const currentEstado = (draft.estado as string) ?? i.estado;
  const avancePct = pctMap[currentEstado] ?? 0;

  const hasChanges = Object.keys(draft).length > 0;

  const handleCancel = () => {
    setEdit(false);
    setDraft({});
    setSaveError(null);
  };

  const handleSave = async () => {
    if (createMode) {
      // Validar campos mínimos
      const titulo = String(draft.titulo ?? '').trim();
      const empresa = String(draft.empresa ?? '').trim();
      if (titulo.length < 3) {
        setSaveError('El título es obligatorio (mín. 3 caracteres)');
        return;
      }
      if (!empresa) {
        setSaveError('La empresa/país es obligatoria');
        return;
      }
      setSaving(true);
      setSaveError(null);
      try {
        const created = await createInitiative(draft);
        addLocal(created);
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setSaveError(err.message ?? 'No se pudo crear');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!hasChanges) {
      setEdit(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateInitiative(i.id, draft);
      updateLocal(i.id, updated);
      setEdit(false);
      setDraft({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  // Para mostrar valor "actual" (draft sobrescribe el original)
  const v = (field: keyof Iniciativa): string =>
    ((draft[field] as string) ?? (i[field] as string) ?? '') as string;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={!edit ? onClose : undefined}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto scrollbar-thin fade-in flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {createMode ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    <PlusCircle size={11} /> NUEVO HALLAZGO
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{i.id}</span>
                )}
                {edit ? (
                  <EditSelect field="estado" value={v('estado')} options={[...PIPELINE_ORDER]} edit draft={draft} onChange={setDraft} />
                ) : (
                  <EstadoBadge label={i.estado} />
                )}
                {edit && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    Editando
                  </span>
                )}
              </div>

              {edit ? (
                <EditField field="titulo" value={v('titulo')} edit draft={draft} onChange={setDraft} placeholder="Título" />
              ) : (
                <h2 className="text-base font-bold text-gray-900 leading-tight">{i.titulo}</h2>
              )}

              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1"><MapPin size={11}/>{i.empresa}</span>
                {i.area && <span>{i.area}</span>}
                {i.solicitante && <span className="flex items-center gap-1"><User size={11}/>{i.solicitante}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Admin actions */}
              {isAdmin && !edit && (
                <button
                  onClick={() => setEdit(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
                  title="Editar campos (solo admin)"
                >
                  <Pencil size={12} /> Editar
                </button>
              )}
              {edit && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving || (!createMode && !hasChanges)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : (createMode ? <PlusCircle size={12} /> : <Save size={12} />)}
                    {createMode ? 'Crear' : 'Guardar'}
                  </button>
                  <button
                    onClick={createMode ? onClose : handleCancel}
                    disabled={saving}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {avancePct > 0 && !edit && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Avance</span><span>{estadoDef?.avance ?? '—'}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${avancePct}%` }} />
              </div>
            </div>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            <Tooltip content={<span>{fwDef?.descripcion}</span>}>
              <DimensionBadge label={fwName} />
            </Tooltip>
            {!edit && <CostoBadge label={i.costoEstimado} />}
            {edit && (
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span>Costo:</span>
                <EditSelect field="costoEstimado" value={v('costoEstimado')} options={COSTOS} edit draft={draft} onChange={setDraft} />
                <span>·</span>
                <span>Prioridad:</span>
                <EditSelect field="prioridad" value={v('prioridad')} options={PRIORIDADES} edit draft={draft} onChange={setDraft} />
              </div>
            )}
          </div>

          {/* Save error/success banner */}
          {saveError && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={12} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-800 leading-relaxed">{saveError}</p>
            </div>
          )}
          {saveSuccess && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg fade-in">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {createMode ? '¡Hallazgo creado correctamente en Cosmos DB!' : 'Cambios guardados correctamente en Cosmos DB.'}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-5 flex-1">
          {/* 1. Resumen ejecutivo */}
          <Section title="Resumen Ejecutivo" icon={Zap}>
            {edit ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Descripción</label>
                  <EditField field="descripcion" value={v('descripcion')} type="textarea" edit draft={draft} onChange={setDraft} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">Objetivo de negocio</label>
                  <EditField field="objetivos" value={v('objetivos')} type="textarea" edit draft={draft} onChange={setDraft} />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-brand-50 rounded-xl p-4 mb-3">
                  <p className="text-sm text-brand-900 leading-relaxed font-medium whitespace-pre-wrap">{i.descripcion}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">Objetivo de negocio</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{i.objetivos}</p>
                </div>
              </>
            )}
          </Section>

          {/* 2. Problema de negocio */}
          <Section title="Problema de Negocio" icon={AlertTriangle}>
            <EditField field="puntosDolor" value={v('puntosDolor')} type="textarea" edit={edit} draft={draft} onChange={setDraft} />
          </Section>

          {/* 3. Solución propuesta */}
          <Section title="Solución Propuesta" icon={CheckCircle}>
            <EditField field="planAccion" value={v('planAccion')} type="textarea" edit={edit} draft={draft} onChange={setDraft} />
          </Section>

          {/* 4. Riesgos y cuellos de botella */}
          {(i.cuellosBottela || i.bloqueadores || edit) && (
            <Section title="Riesgos y Cuellos de Botella" icon={AlertTriangle}>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">Cuellos de botella identificados</p>
                  {edit ? (
                    <EditField field="cuellosBottela" value={v('cuellosBottela')} type="textarea" edit draft={draft} onChange={setDraft} />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{i.cuellosBottela || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">Bloqueadores / Comentarios / Cierre y Logros</p>
                  {edit ? (
                    <EditField field="bloqueadores" value={v('bloqueadores')} type="textarea" edit draft={draft} onChange={setDraft} />
                  ) : (
                    i.bloqueadores
                      ? <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{i.bloqueadores}</p></div>
                      : <p className="text-sm text-gray-400 italic">—</p>
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* 5. Contribución estratégica */}
          <Section title="Contribución Estratégica" icon={Target}>
            <div className="grid grid-cols-1 gap-3">
              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  Capacidad estratégica que construye
                  {fwDef && <span className="ml-1 text-[10px] text-gray-400 italic">· {fwDef.framework}</span>}
                </p>
                <p className="text-sm font-bold" style={{ color: fwDef?.color ?? '#1f2937' }}>{fwName}</p>
                {fwDef && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{fwDef.descripcion}</p>}
              </div>

              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Madurez Objetivo</p>
                <p className="text-lg font-black text-brand-700">{madurezNum > 0 ? `Nv. ${madurezNum}` : i.nivelMadurez || '—'}</p>
                {madurezDef && <p className="text-[10px] text-gray-500">{madurezDef.nombre}</p>}
              </div>
            </div>
          </Section>

          {/* 6. Esfuerzo, costos y plazos */}
          <Section title="Esfuerzo, Costos y Plazos" icon={Clock}>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <InfoRow
                label="Tipo"
                value={edit
                  ? <EditSelect field="tipo" value={v('tipo')} options={TIPOS} edit draft={draft} onChange={setDraft} />
                  : i.tipo}
              />
              <InfoRow
                label="Prioridad"
                value={edit
                  ? <EditSelect field="prioridad" value={v('prioridad')} options={PRIORIDADES} edit draft={draft} onChange={setDraft} />
                  : i.prioridad}
              />
              <InfoRow
                label="Complejidad"
                value={edit
                  ? <EditSelect field="complejidad" value={v('complejidad')} options={COMPLEJIDADES} edit draft={draft} onChange={setDraft} />
                  : i.complejidad}
              />
              <InfoRow
                label="Tiempo requerido"
                value={edit
                  ? <EditField field="tiempoRequerido" value={v('tiempoRequerido')} edit draft={draft} onChange={setDraft} />
                  : i.tiempoRequerido}
              />
              <InfoRow label="Inicio proyectado" value={i.fechaInicioProy} />
              <InfoRow label="Inicio real" value={i.fechaInicioReal} />
              <InfoRow label="Término real" value={i.fechaTerminoReal} />
              <InfoRow
                label="Costo estimado"
                value={edit
                  ? <EditSelect field="costoEstimado" value={v('costoEstimado')} options={COSTOS} edit draft={draft} onChange={setDraft} />
                  : <CostoBadge label={i.costoEstimado} />}
              />
              {(i.costoReal || edit) && (
                <InfoRow label="Costo real (USD)" value={edit
                  ? <EditField field="costoReal" value={v('costoReal')} edit draft={draft} onChange={setDraft} />
                  : i.costoReal} />
              )}
              {(i.ahorro || edit) && (
                <InfoRow label="Ahorro estimado" value={edit
                  ? <EditField field="ahorro" value={v('ahorro')} edit draft={draft} onChange={setDraft} />
                  : i.ahorro} />
              )}
              <InfoRow label="Sistemas involucrados" value={i.sistemas} />
              <InfoRow label="Sub Área" value={i.subArea} />
            </div>
          </Section>

          {/* Recursos */}
          {(i.recursosFuera || i.recursosTA || i.recursosNuevos || edit) && (
            <Section title="Recursos Requeridos" icon={User}>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <InfoRow label="Recursos externos a TA" value={edit
                  ? <EditField field="recursosFuera" value={v('recursosFuera')} edit draft={draft} onChange={setDraft} />
                  : i.recursosFuera} />
                <InfoRow label="Recursos de TA" value={edit
                  ? <EditField field="recursosTA" value={v('recursosTA')} edit draft={draft} onChange={setDraft} />
                  : i.recursosTA} />
                <InfoRow label="Nuevos recursos" value={edit
                  ? <EditField field="recursosNuevos" value={v('recursosNuevos')} edit draft={draft} onChange={setDraft} />
                  : i.recursosNuevos} />
              </div>
            </Section>
          )}

          {/* ¿Qué necesita del C-suite? */}
          {!edit && i.bloqueadores && i.bloqueadores.toLowerCase().includes('requiere') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">¿Qué necesita del C-suite?</p>
              <p className="text-sm text-red-900 whitespace-pre-wrap">{i.bloqueadores}</p>
            </div>
          )}

          {/* Comentarios públicos — solo cuando NO se está editando */}
          {!edit && <CommentsSection initiativeId={i.id} />}

          {/* Admin hint */}
          {!edit && !isAdmin && (
            <div className="text-center py-4 px-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
              <p className="text-[11px] text-gray-400">
                Para editar este hallazgo inicia sesión como administrador (botón "Admin" en la barra superior).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
