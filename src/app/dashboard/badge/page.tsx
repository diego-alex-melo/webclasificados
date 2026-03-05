'use client';

import { useEffect, useState } from 'react';

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

export default function BadgePage() {
  const [adSlug, setAdSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadAd() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/ads/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          setAdSlug(json.data?.slug ?? null);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }

    loadAd();
  }, []);

  const badgeHtml = adSlug
    ? `<a href="${APP_URL}/anuncio/${adSlug}" target="_blank" rel="noopener">\n  <img src="${APP_URL}/badge.svg" alt="Verificado en BrujosClassifieds" width="120" height="40" />\n</a>`
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
        <h1 className="text-2xl font-bold text-[#e8e0f0]">Sello de Verificacion</h1>
        <p className="text-[#a090b8] text-sm mt-1">
          Agrega el sello de BrujosClassifieds a tu sitio web.
        </p>
      </div>

      {/* Badge preview */}
      <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
        <h2 className="text-sm font-medium text-[#a090b8] mb-4">Vista previa</h2>
        <div className="flex items-center justify-center py-8 bg-white/5 rounded-lg">
          <img
            src={`${APP_URL}/badge.svg`}
            alt="Verificado en BrujosClassifieds"
            width={120}
            height={40}
          />
        </div>
      </section>

      {/* HTML snippet */}
      {adSlug ? (
        <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6 space-y-4">
          <h2 className="text-sm font-medium text-[#a090b8]">Codigo HTML</h2>
          <p className="text-xs text-[#6b5a80]">
            Copia y pega este codigo en tu sitio web para mostrar el sello.
          </p>
          <div className="relative">
            <pre className="bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg p-4 text-sm text-[#e8e0f0] font-mono overflow-x-auto whitespace-pre-wrap break-all">
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
        <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
          <p className="text-sm text-[#6b5a80] text-center py-4">
            Publica un anuncio primero para obtener tu codigo de sello.
          </p>
        </section>
      )}

      {/* Boost note */}
      <section className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-xl p-4 lg:p-6">
        <p className="text-sm text-[#d4af37]">
          Si detectamos el sello en tu sitio web, tu anuncio recibira un boost de posicion.
        </p>
        <p className="text-xs text-[#a090b8] mt-2">
          Nuestro sistema verifica periodicamente los sitios web de los anunciantes.
        </p>
      </section>
    </div>
  );
}
