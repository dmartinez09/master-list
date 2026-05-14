import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Iniciativa } from '../types';
import { fetchInitiatives } from '../lib/api';

interface InitiativesContextValue {
  initiatives: Iniciativa[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Actualiza una iniciativa en el cache local (optimistic update tras PATCH del admin) */
  updateLocal: (id: string, patch: Partial<Iniciativa>) => void;
}

const InitiativesContext = createContext<InitiativesContextValue | null>(null);

export function InitiativesProvider({ children }: { children: React.ReactNode }) {
  const [initiatives, setInitiatives] = useState<Iniciativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInitiatives();
      setInitiatives(data);
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido');
      setInitiatives([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLocal = useCallback((id: string, patch: Partial<Iniciativa>) => {
    setInitiatives(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  return (
    <InitiativesContext.Provider value={{ initiatives, loading, error, refetch: load, updateLocal }}>
      {children}
    </InitiativesContext.Provider>
  );
}

export function useInitiatives(): InitiativesContextValue {
  const ctx = useContext(InitiativesContext);
  if (!ctx) throw new Error('useInitiatives debe usarse dentro de <InitiativesProvider>');
  return ctx;
}
