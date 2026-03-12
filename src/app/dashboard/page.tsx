'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import MetricsChart from '@/components/MetricsChart';
import BumpButton from '@/components/BumpButton';
import RenewButton from '@/components/RenewButton';
import CountryFlag from '@/components/CountryFlag';

interface AdData {
  id: string;
  title: string;
  status: string;
  lastBumpedAt: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  countryCode: string;
  rejectionReason: string | null;
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
        setAds(allAds);

        // Auto-select first active ad
        const active = allAds.filter((a) => a.status === 'ACTIVE' || a.status === 'PENDING');
        if (active.length > 0) {
          const first = active[0];
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

  const activeAds = ads.filter((a) => a.status === 'ACTIVE' || a.status === 'PENDING');
  const rejectedAds = ads.filter((a) => a.status === 'REJECTED');

  if (activeAds.length === 0 && rejectedAds.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Bienvenido a tu panel</h1>
        <p className="text-text-secondary mb-8">Aun no tienes anuncios publicados.</p>
        <Link
          href="/dashboard/anuncio"
          className="inline-block px-6 py-3 bg-accent-gold text-bg-primary font-medium rounded-lg hover:bg-accent-gold-light transition-colors"
        >
          Crear mi primer anuncio
        </Link>
      </div>
    );
  }

  // If no active ads but has rejected, show only rejected section
  if (activeAds.length === 0 && rejectedAds.length > 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-4">Bienvenido a tu panel</h1>
          <p className="text-text-secondary mb-6">No tienes anuncios activos.</p>
          <Link
            href="/dashboard/anuncio"
            className="inline-block px-6 py-3 bg-accent-gold text-bg-primary font-medium rounded-lg hover:bg-accent-gold-light transition-colors"
          >
            Crear nuevo anuncio
          </Link>
        </div>
        <RejectedAdsSection ads={rejectedAds} />
      </div>
    );
  }

  const ad = selectedAd ?? activeAds[0];

  return (
    <div className="space-y-8">
      {/* Ad selector (only if multiple active ads) */}
      {activeAds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {activeAds.map((a) => {
            return (
              <button
                key={a.id}
                onClick={() => handleSelectAd(a)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                  ad.id === a.id
                    ? 'border-[#7b2ff2] bg-[#7b2ff2]/10 text-text-primary'
                    : 'border-accent-purple/20 text-text-secondary hover:border-[#7b2ff2]/50'
                }`}
              >
                <CountryFlag code={a.countryCode} size={16} />
                <span className="truncate max-w-[150px]">{a.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Metricas</h1>
          <p className="text-text-secondary text-sm mt-1">
            <CountryFlag code={ad.countryCode} size={16} /> {ad.title}
          </p>
        </div>
        {activeAds.length < 3 && (
          <Link
            href="/dashboard/anuncio?new=1"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-gold text-bg-primary text-sm font-medium rounded-lg hover:bg-accent-gold-light transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo anuncio
          </Link>
        )}
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
      <section className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4 lg:p-6 overflow-hidden">
        <h2 className="text-sm font-medium text-text-secondary mb-4">
          Actividad semanal (ultimas 8 semanas)
        </h2>
        <div className="min-w-0">
          <MetricsChart data={metrics?.weeklyData ?? []} />
        </div>
      </section>

      {/* Reputation + Bump */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reputation */}
        <section className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4 lg:p-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Reputacion</h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-bold text-text-primary">
              {ad.advertiser.reputation}
            </span>
            <span className="text-sm text-text-secondary">/ 100</span>
          </div>
          <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
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
        <section className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4 lg:p-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Republicar anuncio</h2>
          <p className="text-xs text-text-secondary/70 mb-4">
            Lleva tu anuncio al inicio de la lista. Disponible cada 48 horas.
          </p>
          <BumpButton adId={ad.id} lastBumpedAt={ad.lastBumpedAt} />
        </section>
      </div>

      {/* Renew */}
      {ad.expiresAt && (
        <section className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4 lg:p-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Renovar anuncio</h2>
          <p className="text-xs text-text-secondary/70 mb-4">
            Renueva tu anuncio por 60 dias mas. Disponible en los ultimos 7 dias antes de expirar.
          </p>
          <RenewButton adId={ad.id} expiresAt={ad.expiresAt} />
        </section>
      )}

      {/* Rejected ads */}
      {rejectedAds.length > 0 && <RejectedAdsSection ads={rejectedAds} />}
    </div>
  );
}

// ── Rejected Ads Section ────────────────────────────────────────────────────

function RejectedAdsSection({ ads }: { ads: AdData[] }) {
  return (
    <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 lg:p-6">
      <h2 className="text-sm font-medium text-red-400 mb-3">
        Anuncios rechazados ({ads.length})
      </h2>
      <div className="space-y-3">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-bg-elevated border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{ad.title}</p>
                {ad.rejectionReason && (
                  <p className="text-xs text-red-300 mt-1">Motivo: {ad.rejectionReason}</p>
                )}
              </div>
              <Link
                href="/dashboard/anuncio"
                className="shrink-0 px-4 py-1.5 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-300 hover:bg-red-500/25 transition-colors"
              >
                Editar y corregir
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
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
    <div className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
        {suffix && <span className="text-sm font-normal">{suffix}</span>}
      </p>
    </div>
  );
}
