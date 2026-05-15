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
  /** True si fue posteado por un usuario autenticado (no anónimo) */
  authenticated?: boolean;
  /** ID del usuario si está autenticado */
  userId?: string;
  /** Rol al momento de postear */
  userRole?: 'admin' | 'manager';
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

/* ─── Auth: admin + managers ──────────────────────────────── */

export type Role = 'admin' | 'manager';

export interface AdminLoginResponse {
  token: string;
  role: 'admin';
}

export interface ManagerLoginResponse {
  token: string;
  role: 'manager';
  userId: string;
  userName: string;
}

export interface PublicUser {
  id: string;
  name: string;
  order: number;
}

export function loginAdmin(password: string): Promise<AdminLoginResponse> {
  return http<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function verifyAdmin(): Promise<{ ok: true; role: 'admin' }> {
  return http<{ ok: true; role: 'admin' }>('/admin/verify');
}

export function listUsers(): Promise<PublicUser[]> {
  return http<PublicUser[]>('/users');
}

export function loginUser(userId: string, password: string): Promise<ManagerLoginResponse> {
  return http<ManagerLoginResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password }),
  });
}

export function changeMyPassword(oldPassword: string, newPassword: string): Promise<{ ok: true }> {
  return http<{ ok: true }>('/users/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export function verifyMe(): Promise<{ role: Role; userId?: string; userName?: string }> {
  return http('/users/me');
}

/* ─── Aprobación de iniciativas (admin o manager) ─────────── */

export type ApprovalStatus = 'aprobado' | 'a-evaluar' | 'pendiente';

export function setApproval(initiativeId: string, status: ApprovalStatus): Promise<Iniciativa> {
  return http<Iniciativa>(`/initiatives/${encodeURIComponent(initiativeId)}/approval`, {
    method: 'PATCH',
    body: JSON.stringify({ approvalStatus: status }),
  });
}

/* ─── Adjuntos (PDF/Word/Excel) ───────────────────────────── */

export interface Attachment {
  id: string;
  initiativeId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByRole: 'admin' | 'manager';
  uploadedAt: string;
}

export function listAttachments(initiativeId: string): Promise<Attachment[]> {
  return http<Attachment[]>(`/initiatives/${encodeURIComponent(initiativeId)}/attachments`);
}

export interface DownloadResult { filename: string; mimeType: string; base64: string; sizeBytes: number }
export function downloadAttachment(initiativeId: string, attachmentId: string): Promise<DownloadResult> {
  return http(`/initiatives/${encodeURIComponent(initiativeId)}/attachments/${encodeURIComponent(attachmentId)}/download`);
}

export function uploadAttachment(
  initiativeId: string,
  data: { filename: string; mimeType: string; base64: string },
): Promise<Attachment> {
  return http<Attachment>(`/initiatives/${encodeURIComponent(initiativeId)}/attachments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deleteAttachment(initiativeId: string, attachmentId: string): Promise<{ ok: true }> {
  return http(`/initiatives/${encodeURIComponent(initiativeId)}/attachments/${encodeURIComponent(attachmentId)}`, {
    method: 'DELETE',
  });
}
