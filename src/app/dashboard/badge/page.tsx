'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

interface AdOption {
  slug: string;
  title: string;
}

export default function BadgePage() {
  const [ads, setAds] = useState<AdOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAds() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/ads/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          const activeAds = (json.data ?? [])
            .filter((ad: { status: string }) => ad.status === 'ACTIVE')
            .map((ad: { slug: string; title: string }) => ({ slug: ad.slug, title: ad.title }));
          setAds(activeAds);
          if (activeAds.length > 0) setSelectedSlug(activeAds[0].slug);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }

    loadAds();
  }, []);

  const badgeHtml = selectedSlug
    ? `<a href="${APP_URL}/anuncio/${selectedSlug}" target="_blank" rel="noopener">\n  <img src="${APP_URL}/badge.svg" alt="Verificado en BrujosClassifieds" width="120" height="40" />\n</a>`
    : '';

  async function handleCopy() {
    if (!badgeHtml) return;

    try {
      await navigator.clipboard.writeText(badgeHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = badgeHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Sello de Verificacion</h1>
        <p className="text-text-secondary text-sm mt-1">
          Agrega el sello de BrujosClassifieds a tu sitio web.
        </p>
      </div>

      {/* Badge preview */}
      <section className="bg-bg-card border border-accent-purple/25 rounded-xl p-4 lg:p-6">
        <h2 className="text-sm font-medium text-text-secondary mb-4">Vista previa</h2>
        <div className="flex items-center justify-center py-8 bg-white/5 rounded-lg">
          <Image
            src="/badge.svg"
            alt="Verificado en BrujosClassifieds"
            width={120}
            height={40}
          />
        </div>
      </section>

      {/* HTML snippet */}
      {selectedSlug ? (
        <section className="bg-bg-card border border-accent-purple/25 rounded-xl p-4 lg:p-6 space-y-4">
          <h2 className="text-sm font-medium text-text-secondary">Codigo HTML</h2>
          <p className="text-xs text-text-secondary/70">
            Copia y pega este codigo en tu sitio web para mostrar el sello.
          </p>
          {ads.length > 1 && (
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-lg border border-accent-purple/20 bg-bg-secondary px-3 py-2 text-sm text-text-primary"
            >
              {ads.map((ad) => (
                <option key={ad.slug} value={ad.slug}>{ad.title}</option>
              ))}
            </select>
          )}
          <div className="relative">
            <pre className="bg-bg-secondary border border-accent-purple/20 rounded-lg p-4 text-sm text-text-primary font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {badgeHtml}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-3 py-1.5 bg-[#7b2ff2] text-white text-xs rounded-md hover:bg-[#6a22e0] transition-colors"
            >
              {copied ? 'Copiado' : 'Copiar HTML'}
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-bg-card border border-accent-purple/25 rounded-xl p-4 lg:p-6">
          <p className="text-sm text-text-secondary/70 text-center py-4">
            Publica un anuncio primero para obtener tu codigo de sello.
          </p>
        </section>
      )}

      {/* Boost note */}
      <section className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-xl p-4 lg:p-6">
        <p className="text-sm text-[#d4af37]">
          Si detectamos el sello en tu sitio web, tu anuncio recibira un boost de posicion.
        </p>
        <p className="text-xs text-text-secondary mt-2">
          Nuestro sistema verifica periodicamente los sitios web de los anunciantes.
        </p>
      </section>
    </div>
  );
}
