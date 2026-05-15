import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  loginAdmin, loginUser, verifyMe, setAuthToken,
  type Role,
} from '../lib/api';

interface Session {
  role: Role;
  userId?: string;
  userName?: string;
}

interface AuthContextValue {
  /** Conveniencias derivadas */
  isAdmin: boolean;
  isManager: boolean;       // admin O manager (cualquiera autenticado)
  /** Datos de sesión */
  session: Session | null;
  token: string | null;
  loading: boolean;
  /** Acciones */
  loginAsAdmin: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  loginAsUser: (userId: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'ta_session_token';
const SESSION_KEY = 'ta_session_data';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [session, setSession] = useState<Session | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Sync token with API client
  useEffect(() => { setAuthToken(token); }, [token]);

  // Verify saved token on mount
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) { setLoading(false); return; }
      setAuthToken(stored);
      try {
        const me = await verifyMe();
        if (!cancelled) {
          setToken(stored);
          setSession({ role: me.role, userId: me.userId, userName: me.userName });
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(SESSION_KEY);
          setAuthToken(null);
          setToken(null);
          setSession(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, []);

  const persist = (t: string, s: Session) => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setAuthToken(t);
    setToken(t);
    setSession(s);
  };

  const loginAsAdmin = useCallback(async (password: string) => {
    try {
      const r = await loginAdmin(password);
      persist(r.token, { role: 'admin' });
      return { ok: true as const };
    } catch (err: any) {
      return { ok: false as const, error: err.message ?? 'Error al iniciar sesión' };
    }
  }, []);

  const loginAsUser = useCallback(async (userId: string, password: string) => {
    try {
      const r = await loginUser(userId, password);
      persist(r.token, { role: 'manager', userId: r.userId, userName: r.userName });
      return { ok: true as const };
    } catch (err: any) {
      return { ok: false as const, error: err.message ?? 'Error al iniciar sesión' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setToken(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAdmin: session?.role === 'admin',
      isManager: session != null, // cualquier sesión activa
      session,
      token,
      loading,
      loginAsAdmin,
      loginAsUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
