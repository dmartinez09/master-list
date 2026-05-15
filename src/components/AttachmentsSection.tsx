import React, { useEffect, useState } from 'react';
import { Paperclip, Upload, FileText, FileSpreadsheet, FileType, Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import {
  listAttachments, uploadAttachment, downloadAttachment, deleteAttachment,
  type Attachment,
} from '../lib/api';

interface Props {
  initiativeId: string;
  canUpload: boolean;
  canDeleteOwn: boolean;
  isAdmin: boolean;
  currentUserName?: string;
}

const ALLOWED_EXT = '.pdf,.doc,.docx,.xls,.xlsx,.xlsm';
const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
];
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB

function iconFor(mime: string) {
  if (mime.includes('pdf')) return <FileType size={14} className="text-red-500" />;
  if (mime.includes('sheet') || mime.includes('excel')) return <FileSpreadsheet size={14} className="text-emerald-600" />;
  if (mime.includes('word') || mime.includes('document')) return <FileText size={14} className="text-blue-600" />;
  return <FileText size={14} className="text-gray-500" />;
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export function AttachmentsSection({ initiativeId, canUpload, canDeleteOwn, isAdmin, currentUserName }: Props) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAttachments(initiativeId);
      setItems(data);
    } catch (err: any) {
      setError(err.message ?? 'No se pudieron cargar los adjuntos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [initiativeId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];

    setUploadError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError(`Tipo de archivo no soportado. Solo PDF, Word o Excel.`);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`Archivo muy grande (${fmtBytes(file.size)}). Máximo 4MB.`);
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const created = await uploadAttachment(initiativeId, {
        filename: file.name,
        mimeType: file.type,
        base64,
      });
      setItems(prev => [created, ...prev]);
    } catch (err: any) {
      setUploadError(err.message ?? 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (att: Attachment) => {
    try {
      const r = await downloadAttachment(initiativeId, att.id);
      // Convertir base64 a blob y disparar descarga
      const byteString = atob(r.base64);
      const bytes = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);
      const blob = new Blob([bytes], { type: r.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message ?? 'No se pudo descargar');
    }
  };

  const handleDelete = async (att: Attachment) => {
    if (!window.confirm(`¿Borrar "${att.filename}"?`)) return;
    setDeletingId(att.id);
    try {
      await deleteAttachment(initiativeId, att.id);
      setItems(prev => prev.filter(a => a.id !== att.id));
    } catch (err: any) {
      setError(err.message ?? 'No se pudo borrar');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (att: Attachment) =>
    isAdmin || (canDeleteOwn && att.uploadedBy === currentUserName);

  return (
    <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
          <Paperclip size={12} />
          Cotizaciones y documentos adjuntos
          {items.length > 0 && <span className="text-gray-400 font-medium">({items.length})</span>}
        </div>

        {canUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXT}
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
              disabled={uploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white transition-colors"
            >
              {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              Adjuntar
            </button>
          </>
        )}
      </div>

      {/* Info de tipos */}
      {canUpload && items.length === 0 && (
        <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">
          PDF, Word (.doc/.docx), Excel (.xls/.xlsx). Máximo 4MB por archivo.
        </p>
      )}

      {uploadError && (
        <div className="mb-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={11} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-800">{uploadError}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-3">
          <span className="inline-block w-4 h-4 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={11} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-800">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && !canUpload && (
        <p className="text-[11px] text-gray-400 italic text-center py-2">Sin documentos adjuntos.</p>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-1">
          {items.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border border-gray-100 hover:border-brand-300 transition-colors"
            >
              {iconFor(att.mimeType)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{att.filename}</p>
                <p className="text-[10px] text-gray-400">
                  {fmtBytes(att.sizeBytes)} · {att.uploadedBy} · {fmtDate(att.uploadedAt)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(att)}
                className="p-1 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded transition-colors"
                title="Descargar"
              >
                <Download size={12} />
              </button>
              {canDelete(att) && (
                <button
                  onClick={() => handleDelete(att)}
                  disabled={deletingId === att.id}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Borrar"
                >
                  {deletingId === att.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** File → base64 (sin el prefix "data:...;base64,") */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsDataURL(file);
  });
}
