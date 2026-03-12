'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'wc-favorites';

function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

let snapshot = readFavorites();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): string[] {
  return [];
}

function updateSnapshot(next: string[]) {
  snapshot = next;
  listeners.forEach((cb) => cb());
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleFavorite = useCallback((adId: string) => {
    const prev = getSnapshot();
    const next = prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId];
    writeFavorites(next);
    updateSnapshot(next);
  }, []);

  const isFavorite = useCallback(
    (adId: string) => favorites.includes(adId),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
