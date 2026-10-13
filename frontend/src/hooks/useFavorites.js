import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ACCESS_TOKEN_KEY } from '@/api/apiClient';

const STORAGE_KEY = 'automax_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  // Snapshot of state before the last optimistic toggle, used for rollback
  // if the localStorage write fails.
  const rollbackRef = useRef(null);
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  // Saved ads stay in the browser; for a signed-in visitor the server also keeps the seller's saved count.
  const syncSave = (id, saved) => {
    try {
      if (!id || !localStorage.getItem(ACCESS_TOKEN_KEY)) return;
      api.functions.invoke('toggleAdSave', { ad_id: id, saved }).catch(() => {});
    } catch { /* counting is best effort */ }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      rollbackRef.current = null;
    } catch (e) {
      if (rollbackRef.current) {
        setFavorites(rollbackRef.current);
        rollbackRef.current = null;
      }
    }
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  // Optimistic toggle: state updates synchronously (instant UI),
  // localStorage persistence happens in the effect above.
  const toggleFavorite = useCallback((item) => {
    syncSave(item.id, !favoritesRef.current.some(f => f.id === item.id));
    setFavorites(prev => {
      rollbackRef.current = prev;
      return prev.some(f => f.id === item.id)
        ? prev.filter(f => f.id !== item.id)
        : [...prev, item];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    if (favoritesRef.current.some(f => f.id === id)) syncSave(id, false);
    setFavorites(prev => {
      rollbackRef.current = prev;
      return prev.filter(f => f.id !== id);
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}