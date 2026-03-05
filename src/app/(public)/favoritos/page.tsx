'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';
import AdCard from '@/components/AdCard';

interface FavoriteAd {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  professionalType: string;
  publishedAt: string | null;
  services: Array<{ service: { name: string; slug: string } }>;
  traditions: Array<{ tradition: { name: string; slug: string } }>;
  advertiser: {
    countryCode: string;
    whatsappNumber: string;
  };
}

export default function FavoritosPage() {
  const { favorites } = useFavorites();
  const [ads, setAds] = useState<FavoriteAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favorites.length === 0) {
      setAds([]);
      setLoading(false);
      return;
    }

    async function fetchFavorites() {
      try {
        const res = await fetch('/api/ads/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: favorites }),
        });
        if (res.ok) {
          const json = await res.json();
          setAds(json.data ?? []);
        }
      } catch {
        // Network error — show empty state
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [favorites]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mis Favoritos</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
        </div>
      ) : ads.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-bg-card p-12 text-center">
          <p className="mb-2 text-4xl">&#x2764;&#xFE0F;</p>
          <p className="mb-2 text-lg font-semibold">No tienes favoritos aún</p>
          <p className="mb-6 text-sm text-text-secondary">
            Explora anuncios y guarda tus favoritos tocando el corazón.
          </p>
          <Link
            href="/buscar"
            className="glow-gold inline-block rounded-full bg-accent-gold px-6 py-2 text-sm font-medium text-bg-primary transition-all hover:bg-accent-gold-light"
          >
            Explorar anuncios
          </Link>
        </div>
      )}
    </div>
  );
}
