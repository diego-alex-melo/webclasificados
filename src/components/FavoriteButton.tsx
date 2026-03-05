'use client';

import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  adId: string;
}

export default function FavoriteButton({ adId }: FavoriteButtonProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const active = isFavorite(adId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(adId);
      }}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className="group flex items-center justify-center rounded-full p-1.5 transition-all hover:bg-accent-purple/10"
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill={active ? '#ef4444' : 'none'}
        stroke={active ? '#ef4444' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-text-secondary transition-colors group-hover:text-danger"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
