'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import MetricsChart from '@/components/MetricsChart';
import BumpButton from '@/components/BumpButton';
import { COUNTRY_MAP } from '@/lib/utils/countries';

interface AdData {
  id: string;
  title: string;
  status: string;
  lastBumpedAt: string | null;
  publishedAt: string | null;
  countryCode: string;
  advertiser: {
    reputation: number;
  };
  services: Array<{ service: { slug: string } }>;
}

interface Metrics {
  views: number;
  whatsappClicks: number;
  websiteClicks: number;
  weeklyData: Array<{
    date: string;
    views: number;
    whatsapp: number;
    website: number;
  }>;
}

export default function DashboardPage() {
  const [ads, setAds] = useState<AdData[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const adRes = await fetch('/api/ads/mine', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!adRes.ok) {
          throw new Error('Error al cargar anuncios');
        }

        const adJson = await adRes.json();
        const allAds: AdData[] = Array.isArray(adJson.data) ? adJson.data : [];
        const activeAds = allAds.filter((a) => a.status === 'ACTIVE' || a.status === 'PENDING');
        setAds(activeAds);

        // Auto-select first active ad
        if (activeAds.length > 0) {
          const first = activeAds[0];
          setSelectedAd(first);
          await loadMetrics(first, token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function loadMetrics(ad: AdData, token: string) {
    try {
      const [metricsRes, positionRes] = await Promise.all([
        fetch(`/api/ads/${ad.id}/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        ad.services[0]
          ? fetch(
              `/api/ads/${ad.id}/position?service=${ad.services[0].service.slug}&country=${ad.countryCode}`,
              { headers: { Authorization: `Bearer ${token}` } },
            )
          : Promise.resolve(null),
      ]);

      if (metricsRes.ok) {
        const metricsJson = await metricsRes.json();
        setMetrics(metricsJson.data);
      }

      if (positionRes && positionRes.ok) {
        const positionJson = await positionRes.json();
        setPosition(positionJson.data?.position ?? null);
      }
    } catch {
      // Metrics are non-critical
    }
  }

  async function handleSelectAd(ad: AdData) {
    setSelectedAd(ad);
    setMetrics(null);
    setPosition(null);
    const token = localStorage.getItem('token');
    if (token) await loadMetrics(ad, token);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-[#e8e0f0] mb-4">Bienvenido a tu panel</h1>
        <p className="text-[#a090b8] mb-8">Aun no tienes anuncios publicados.</p>
        <Link
          href="/dashboard/anuncio"
          className="inline-block px-6 py-3 bg-[#d4af37] text-[#0d0015] font-medium rounded-lg hover:bg-[#e8c54a] transition-colors"
        >
          Crear mi primer anuncio
        </Link>
      </div>
    );
  }

  const ad = selectedAd ?? ads[0];

  return (
    <div className="space-y-8">
      {/* Ad selector (only if multiple ads) */}
      {ads.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {ads.map((a) => {
            const country = COUNTRY_MAP[a.countryCode];
            return (
              <button
                key={a.id}
                onClick={() => handleSelectAd(a)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  ad.id === a.id
                    ? 'border-[#7b2ff2] bg-[#7b2ff2]/10 text-[#e8e0f0]'
                    : 'border-[#2a1a4e] text-[#a090b8] hover:border-[#7b2ff2]/50'
                }`}
              >
                <span>{country?.flag}</span>
                <span className="truncate max-w-[150px]">{a.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8e0f0]">Metricas</h1>
        <p className="text-[#a090b8] text-sm mt-1">
          {COUNTRY_MAP[ad.countryCode]?.flag} {ad.title}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Vistas" value={metrics?.views ?? 0} color="#7b2ff2" />
        <MetricCard label="WhatsApp" value={metrics?.whatsappClicks ?? 0} color="#25D366" />
        <MetricCard label="Web" value={metrics?.websiteClicks ?? 0} color="#3b82f6" />
        <MetricCard
          label="Posicion"
          value={position ?? '-'}
          color="#d4af37"
          suffix={position ? 'o' : ''}
        />
      </div>

      {/* Weekly chart */}
      <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
        <h2 className="text-sm font-medium text-[#a090b8] mb-4">
          Actividad semanal (ultimas 8 semanas)
        </h2>
        <MetricsChart data={metrics?.weeklyData ?? []} />
      </section>

      {/* Reputation + Bump */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reputation */}
        <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
          <h2 className="text-sm font-medium text-[#a090b8] mb-3">Reputacion</h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-[#e8e0f0]">
              {ad.advertiser.reputation}
            </span>
            <span className="text-sm text-[#a090b8]">/ 100</span>
          </div>
          <div className="w-full h-2 bg-[#1a0e2e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, ad.advertiser.reputation))}%`,
                backgroundColor:
                  ad.advertiser.reputation >= 70
                    ? '#25D366'
                    : ad.advertiser.reputation >= 40
                      ? '#d4af37'
                      : '#ef4444',
              }}
            />
          </div>
        </section>

        {/* Bump */}
        <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
          <h2 className="text-sm font-medium text-[#a090b8] mb-3">Republicar anuncio</h2>
          <p className="text-xs text-[#6b5a80] mb-4">
            Lleva tu anuncio al inicio de la lista. Disponible cada 48 horas.
          </p>
          <BumpButton adId={ad.id} lastBumpedAt={ad.lastBumpedAt} />
        </section>
      </div>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  color,
  suffix = '',
}: {
  label: string;
  value: number | string;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4">
      <p className="text-xs text-[#a090b8] mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
        {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
    </div>
  );
}
