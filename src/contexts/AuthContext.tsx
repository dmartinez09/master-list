import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginAdmin, verifyAdmin, setAuthToken } from '../lib/api';

interface AuthContextValue {
  isAdmin: boolean;
  token: string | null;
  loading: boolean;
  login: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'ta_admin_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  // Sincronizar el token con el cliente API
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Al arrancar, verificar si el token guardado sigue siendo válido
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
      setAuthToken(stored);
      try {
        await verifyAdmin();
        if (!cancelled) setToken(stored);
      } catch {
        // Token expirado o inválido
        if (!cancelled) {
          localStorage.removeItem(STORAGE_KEY);
          setAuthToken(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (password: string) => {
    try {
      const { token: newToken } = await loginAdmin(password);
      localStorage.setItem(STORAGE_KEY, newToken);
      setAuthToken(newToken);
      setToken(newToken);
      return { ok: true as const };
    } catch (err: any) {
      return { ok: false as const, error: err.message ?? 'Error al iniciar sesión' };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin: Boolean(token), token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
