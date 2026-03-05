'use client';

import { useEffect, useState } from 'react';

interface Metrics {
  totalActiveAds: number;
  totalUsers: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  newRegistrationsThisWeek: number;
  adsByStatus: Record<string, number>;
  adsByCountry: Array<{ countryCode: string; count: number }>;
  topAdsByWhatsApp: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    advertiser: { email: string; whatsappNumber: string };
    whatsappClicks: number;
  }>;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#1a0e2e] rounded-lg p-5">
      <p className="text-sm text-[#a090b8] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-[#d4af37]' : 'text-[#e8e0f0]'}`}>
        {value}
      </p>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activos',
  PENDING: 'Pendientes',
  EXPIRED: 'Expirados',
  REJECTED: 'Rechazados',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  PENDING: 'bg-yellow-500',
  EXPIRED: 'bg-gray-500',
  REJECTED: 'bg-red-500',
};

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/metrics', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setMetrics(json.data);
        }
      })
      .catch(() => setError('Error al cargar metricas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!metrics) return null;

  const totalAds = Object.values(metrics.adsByStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#d4af37] mb-6">
        Panel de Administracion
      </h1>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Anuncios activos" value={metrics.totalActiveAds} accent />
        <StatCard label="Usuarios registrados" value={metrics.totalUsers} />
        <StatCard label="Clicks esta semana" value={metrics.clicksThisWeek} />
        <StatCard label="Clicks este mes" value={metrics.clicksThisMonth} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <StatCard label="Nuevos registros esta semana" value={metrics.newRegistrationsThisWeek} />
        <StatCard label="Total anuncios (todos los estados)" value={totalAds} />
      </div>

      {/* Ads by status */}
      <div className="bg-[#1a0e2e] rounded-lg p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">Anuncios por estado</h2>
        <div className="space-y-3">
          {Object.entries(metrics.adsByStatus).map(([status, count]) => {
            const pct = totalAds > 0 ? (count / totalAds) * 100 : 0;
            return (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#a090b8]">{STATUS_LABELS[status] ?? status}</span>
                  <span className="text-[#e8e0f0]">{count}</span>
                </div>
                <div className="h-2 bg-[#0d0015] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_COLORS[status] ?? 'bg-purple-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ads by country */}
        <div className="bg-[#1a0e2e] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Anuncios activos por pais</h2>
          {metrics.adsByCountry.length === 0 ? (
            <p className="text-[#a090b8] text-sm">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {metrics.adsByCountry.map((entry) => (
                <div key={entry.countryCode} className="flex justify-between text-sm">
                  <span className="text-[#a090b8]">{entry.countryCode}</span>
                  <span className="text-[#e8e0f0] font-medium">{entry.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top ads by WhatsApp clicks */}
        <div className="bg-[#1a0e2e] rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Top 5 — clicks WhatsApp (mes)</h2>
          {metrics.topAdsByWhatsApp.length === 0 ? (
            <p className="text-[#a090b8] text-sm">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {metrics.topAdsByWhatsApp.map((ad, idx) => (
                <div key={ad.id} className="flex items-start gap-3">
                  <span className="text-[#d4af37] font-bold text-lg w-6 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#e8e0f0] truncate">{ad.title}</p>
                    <p className="text-xs text-[#a090b8]">{ad.advertiser?.email}</p>
                  </div>
                  <span className="text-sm text-[#d4af37] font-medium shrink-0">
                    {ad.whatsappClicks} clicks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
