import { useCallback, useEffect, useState } from 'react';
import { fetchComments, postComment, deleteComment, type Comentario, type NewComentario, ApiError } from '../lib/api';

interface UseCommentsResult {
  comments: Comentario[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  submit: (data: NewComentario) => Promise<{ ok: true } | { ok: false; error: string }>;
  submitting: boolean;
  remove: (commentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export function useComments(initiativeId: string | null): UseCommentsResult {
  const [comments, setComments] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!initiativeId) {
      setComments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComments(initiativeId);
      setComments(data);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar comentarios');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [initiativeId]);

  useEffect(() => { load(); }, [load]);

  const submit = useCallback(async (data: NewComentario) => {
    if (!initiativeId) return { ok: false as const, error: 'Hallazgo no seleccionado' };
    setSubmitting(true);
    try {
      const newComment = await postComment(initiativeId, data);
      // Insertar al inicio (más reciente primero)
      setComments(prev => [newComment, ...prev]);
      return { ok: true as const };
    } catch (err: any) {
      let msg = err.message ?? 'Error al publicar';
      if (err instanceof ApiError && err.detail) msg = `${msg} — ${err.detail}`;
      return { ok: false as const, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [initiativeId]);

  const remove = useCallback(async (commentId: string) => {
    if (!initiativeId) return { ok: false as const, error: 'Hallazgo no seleccionado' };
    // Optimistic: remover localmente antes de la respuesta
    const previous = comments;
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
      await deleteComment(initiativeId, commentId);
      return { ok: true as const };
    } catch (err: any) {
      // Rollback
      setComments(previous);
      let msg = err.message ?? 'Error al borrar';
      if (err instanceof ApiError && err.detail) msg = `${msg} — ${err.detail}`;
      return { ok: false as const, error: msg };
    }
  }, [initiativeId, comments]);

  return { comments, loading, error, refetch: load, submit, submitting, remove };
}
