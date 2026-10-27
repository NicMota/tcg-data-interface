/* eslint-disable react-refresh/only-export-components -- Context and its consumer hook share a module. */
/* eslint-disable react-hooks/set-state-in-effect -- Request lifecycle state is synchronized with the API. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import axs from '../axios';
import { useAuth } from './AuthContext';

interface FavoritesValue {
  ids: Set<string>; loading: boolean; error: boolean;
  toggle: (id: string) => Promise<void>;
}
const FavoritesContext = createContext<FavoritesValue | undefined>(undefined);
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const userId = user?.id;
  useEffect(() => {
    let cancelled = false;
    if (!userId) { setIds(new Set()); setLoading(false); return; }
    setIds(new Set());
    setLoading(true);
    setError(false);
    axs.get<string[]>('/favorites/ids').then(({ data }) => {
      if (!cancelled) setIds(new Set(data));
    }).catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);
  async function toggle(id: string) {
    if (ids.has(id)) await axs.delete(`/favorites/${id}`);
    else await axs.put(`/favorites/${id}`);
    setIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  return <FavoritesContext.Provider value={{ ids, loading, error, toggle }}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('FavoritesProvider missing');
  return value;
}
