'use client';

import { useEffect, useState, useCallback } from 'react';

interface Ad {
  id: string;
  title: string;
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

export default function ReportadosPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<'REJECTED' | 'PENDING'>('PENDING');
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
        status: statusFilter,
        page: String(page),
        pageSize: '20',
      });
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

  async function handleBlockUser(advertiserId: string) {
    setActionLoading(advertiserId);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ advertiserId, action: 'block' }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setMessage('Usuario bloqueado (reputacion = 0)');
        fetchAds(meta.page);
      }
    } catch {
      setError('Error al bloquear usuario');
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
      <h1 className="text-2xl font-bold text-[#d4af37] mb-6">
        Anuncios Reportados
      </h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['PENDING', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-[#7b2ff2] text-white'
                : 'bg-[#1a0e2e] text-[#a090b8] hover:text-[#e8e0f0]'
            }`}
          >
            {s === 'PENDING' ? 'Pendientes' : 'Rechazados'}
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
          <div className="w-8 h-8 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <p className="text-[#a090b8] text-center py-10">
          No hay anuncios con estado {statusFilter === 'PENDING' ? 'pendiente' : 'rechazado'}
        </p>
      ) : (
        <>
          {/* Responsive table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a0e2e] text-left">
                  <th className="pb-3 text-[#a090b8] font-medium">Titulo</th>
                  <th className="pb-3 text-[#a090b8] font-medium">Email</th>
                  <th className="pb-3 text-[#a090b8] font-medium">Estado</th>
                  <th className="pb-3 text-[#a090b8] font-medium">Razon</th>
                  <th className="pb-3 text-[#a090b8] font-medium">Fecha</th>
                  <th className="pb-3 text-[#a090b8] font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-[#1a0e2e]/50 hover:bg-[#1a0e2e]/30">
                    <td className="py-3 pr-4 max-w-[200px] truncate">{ad.title}</td>
                    <td className="py-3 pr-4 text-[#a090b8]">{ad.advertiser.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ad.status === 'PENDING'
                            ? 'bg-yellow-500/15 text-yellow-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {ad.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#a090b8] max-w-[200px] truncate">
                      {ad.rejectionReason ?? '-'}
                    </td>
                    <td className="py-3 pr-4 text-[#a090b8] whitespace-nowrap">
                      {formatDate(ad.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {ad.status === 'PENDING' && (
                          <button
                            onClick={() => handleAction(ad.id, 'approve')}
                            disabled={actionLoading === ad.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                        )}
                        {ad.status === 'PENDING' && (
                          <button
                            onClick={() => handleAction(ad.id, 'reject')}
                            disabled={actionLoading === ad.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        )}
                        <button
                          onClick={() => handleBlockUser(ad.advertiser.id)}
                          disabled={actionLoading === ad.advertiser.id}
                          className="px-3 py-1 bg-[#1a0e2e] hover:bg-[#2a1640] text-red-400 rounded text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          Bloquear usuario
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
              <p className="text-sm text-[#a090b8]">
                Pagina {meta.page} de {meta.totalPages} ({meta.total} resultados)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAds(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 bg-[#1a0e2e] rounded text-sm disabled:opacity-30 hover:bg-[#2a1640] transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchAds(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="px-3 py-1.5 bg-[#1a0e2e] rounded text-sm disabled:opacity-30 hover:bg-[#2a1640] transition-colors"
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
