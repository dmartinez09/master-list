import type { Iniciativa } from '../types';
import { mapToFramework } from '../utils/framework';

/* ═════════════════════════════════════════════════════════════
   Cliente API — conversa con el backend en localhost:4000
   (vía Vite proxy /api en dev, mismo host en prod)
═════════════════════════════════════════════════════════════ */

const API_BASE = '/api';

/* ─── Token holder (poblado por AuthContext) ─────────────── */
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

export interface Comentario {
  id: string;
  initiativeId: string;
  nombre: string;
  apellido: string;
  contenido: string;
  createdAt: string;
  ipHash?: string;
}

export interface NewComentario {
  nombre: string;
  apellido: string;
  contenido: string;
}

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (_authToken) headers['Authorization'] = `Bearer ${_authToken}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    let detail: string | undefined;
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error ?? message;
      detail = body.detail;
    } catch {
      // body no es JSON
    }
    throw new ApiError(res.status, message, detail);
  }
  return res.json() as Promise<T>;
}

/* ─── Iniciativas ─────────────────────────────────────────── */

export async function fetchInitiatives(): Promise<Iniciativa[]> {
  const items = await http<Iniciativa[]>('/initiatives');
  // Augmentar con frameworkDimension al vuelo (igual que hacía data/initiatives.ts antes)
  return items.map(i => ({ ...i, frameworkDimension: mapToFramework(i) }));
}

export async function fetchInitiative(id: string): Promise<Iniciativa> {
  const i = await http<Iniciativa>(`/initiatives/${encodeURIComponent(id)}`);
  return { ...i, frameworkDimension: mapToFramework(i) };
}

/** Admin: actualiza uno o más campos de un hallazgo (requiere token) */
export async function updateInitiative(
  id: string,
  patch: Partial<Iniciativa>,
): Promise<Iniciativa> {
  const updated = await http<Iniciativa>(`/initiatives/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return { ...updated, frameworkDimension: mapToFramework(updated) };
}

/** Admin: crea un nuevo hallazgo (requiere token + titulo + empresa) */
export async function createInitiative(payload: Partial<Iniciativa>): Promise<Iniciativa> {
  const created = await http<Iniciativa>('/initiatives', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { ...created, frameworkDimension: mapToFramework(created) };
}

/* ─── Comentarios ─────────────────────────────────────────── */

export function fetchComments(initiativeId: string): Promise<Comentario[]> {
  return http<Comentario[]>(`/initiatives/${encodeURIComponent(initiativeId)}/comments`);
}

export function postComment(initiativeId: string, body: NewComentario): Promise<Comentario> {
  return http<Comentario>(`/initiatives/${encodeURIComponent(initiativeId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Admin: borra un comentario (requiere token) */
export function deleteComment(initiativeId: string, commentId: string): Promise<{ ok: true; deletedId: string }> {
  return http(`/initiatives/${encodeURIComponent(initiativeId)}/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

/* ─── Admin auth ──────────────────────────────────────────── */

export interface LoginResponse {
  token: string;
  role: 'admin';
}

export function loginAdmin(password: string): Promise<LoginResponse> {
  return http<LoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function verifyAdmin(): Promise<{ ok: true; role: 'admin' }> {
  return http<{ ok: true; role: 'admin' }>('/admin/verify');
}
