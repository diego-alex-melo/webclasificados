'use client';

import { useEffect, useState, useCallback } from 'react';

interface Ad {
  id: string;
  title: string;
  slug: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  advertiser: {
    id: string;
    email: string;
    whatsappNumber: string;
    reputation: number;
  };
}

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'PENDING', 'REJECTED', 'EXPIRED'] as const;
const STATUS_LABELS: Record<string, string> = {
  ALL: 'Todos',
  ACTIVE: 'Activos',
  PENDING: 'Pendientes',
  REJECTED: 'Rechazados',
  EXPIRED: 'Expirados',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  EXPIRED: 'bg-gray-500/15 text-gray-400',
};

export default function AnunciosPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchAds = useCallback(
    (page = 1) => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
      });
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      fetch(`/api/admin/ads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setError(json.error);
          } else {
            setAds(json.data ?? []);
            setMeta(json.meta);
          }
        })
        .catch(() => setError('Error al cargar anuncios'))
        .finally(() => setLoading(false));
    },
    [statusFilter],
  );

  useEffect(() => {
    fetchAds(1);
  }, [fetchAds]);

  async function handleAction(adId: string, action: 'approve' | 'reject') {
    setActionLoading(adId);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId,
          action,
          reason: action === 'reject' ? 'Rechazado por administrador' : undefined,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setMessage(action === 'approve' ? 'Anuncio aprobado' : 'Anuncio rechazado');
        fetchAds(meta.page);
      }
    } catch {
      setError('Error al realizar la accion');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(adId: string, title: string) {
    if (!confirm(`Eliminar permanentemente "${title}"?`)) return;
    setActionLoading(adId);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adId }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setMessage('Anuncio eliminado');
        fetchAds(meta.page);
      }
    } catch {
      setError('Error al eliminar anuncio');
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-accent-gold mb-6">
        Gestion de Anuncios
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-accent-purple text-white'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-500/10 text-green-400 p-3 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <p className="text-text-secondary text-center py-10">
          No hay anuncios {statusFilter !== 'ALL' ? `con estado ${STATUS_LABELS[statusFilter]?.toLowerCase()}` : ''}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-accent-purple/15 text-left">
                  <th className="pb-3 text-text-secondary font-medium">Titulo</th>
                  <th className="pb-3 text-text-secondary font-medium">Email</th>
                  <th className="pb-3 text-text-secondary font-medium">Estado</th>
                  <th className="pb-3 text-text-secondary font-medium">Fecha</th>
                  <th className="pb-3 text-text-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-accent-purple/15/50 hover:bg-bg-secondary/30">
                    <td className="py-3 pr-4 max-w-[200px] truncate">{ad.title}</td>
                    <td className="py-3 pr-4 text-text-secondary">{ad.advertiser.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[ad.status] ?? 'bg-gray-500/15 text-gray-400'}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                      {formatDate(ad.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {ad.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAction(ad.id, 'approve')}
                              disabled={actionLoading === ad.id}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleAction(ad.id, 'reject')}
                              disabled={actionLoading === ad.id}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {ad.status === 'REJECTED' && (
                          <button
                            onClick={() => handleAction(ad.id, 'approve')}
                            disabled={actionLoading === ad.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(ad.id, ad.title)}
                          disabled={actionLoading === ad.id}
                          className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-text-secondary">
                Pagina {meta.page} de {meta.totalPages} ({meta.total} resultados)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAds(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 bg-bg-secondary rounded text-sm disabled:opacity-30 hover:bg-bg-card transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchAds(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 bg-bg-secondary rounded text-sm disabled:opacity-30 hover:bg-bg-card transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
