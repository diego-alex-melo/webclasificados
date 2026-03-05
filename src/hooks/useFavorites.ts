'use client';

import { useCallback, useEffect, useState } from 'react';

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

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const toggleFavorite = useCallback((adId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId];
      writeFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (adId: string) => favorites.includes(adId),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite };
}
