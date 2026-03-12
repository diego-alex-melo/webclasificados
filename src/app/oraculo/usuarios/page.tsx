'use client';

import { useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  whatsappNumber: string;
  countryCode: string;
  reputation: number;
  emailVerified: boolean;
  createdAt: string;
  _count: { ads: number };
}

interface Meta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<'date' | 'reputation'>('date');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingRep, setEditingRep] = useState<string | null>(null);
  const [repValue, setRepValue] = useState('');

  const fetchUsers = useCallback(
    (page = 1) => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        sort,
      });
      if (search) params.set('search', search);

      fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setError(json.error);
          } else {
            setUsers(json.data ?? []);
            setMeta(json.meta);
          }
        })
        .catch(() => setError('Error al cargar usuarios'))
        .finally(() => setLoading(false));
    },
    [search, sort],
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleAction(advertiserId: string, action: 'block' | 'unblock') {
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
        body: JSON.stringify({ advertiserId, action }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setMessage(
          action === 'block'
            ? 'Usuario bloqueado (reputacion = 0)'
            : 'Usuario desbloqueado (reputacion = 100)',
        );
        fetchUsers(meta.page);
      }
    } catch {
      setError('Error al realizar la accion');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetReputation(advertiserId: string) {
    const val = parseInt(repValue, 10);
    if (isNaN(val) || val < 0 || val > 100) {
      setError('Reputacion debe ser entre 0 y 100');
      return;
    }
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
        body: JSON.stringify({ advertiserId, action: 'set-reputation', reputation: val }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setMessage(`Reputacion actualizada a ${val}`);
        setEditingRep(null);
        setRepValue('');
        fetchUsers(meta.page);
      }
    } catch {
      setError('Error al cambiar reputacion');
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

  function reputationBadge(reputation: number) {
    if (reputation === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-400">
          Bloqueado (0)
        </span>
      );
    }
    if (reputation < 50) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/15 text-yellow-400">
          {reputation}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/15 text-green-400">
        {reputation}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-accent-gold mb-6">
        Gestion de Usuarios
      </h1>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por email o WhatsApp..."
            className="flex-1 bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2 text-sm text-text-primary placeholder-text-secondary/70 focus:outline-none focus:border-accent-purple"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent-purple hover:bg-accent-purple/80 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Buscar
          </button>
        </form>
        <div className="flex gap-2">
          {(['date', 'reputation'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sort === s
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {s === 'date' ? 'Por fecha' : 'Por reputacion'}
            </button>
          ))}
        </div>
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
      ) : users.length === 0 ? (
        <p className="text-text-secondary text-center py-10">
          No se encontraron usuarios
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-accent-purple/15 text-left">
                  <th className="pb-3 text-text-secondary font-medium">Email</th>
                  <th className="pb-3 text-text-secondary font-medium">WhatsApp</th>
                  <th className="pb-3 text-text-secondary font-medium">Pais</th>
                  <th className="pb-3 text-text-secondary font-medium">Reputacion</th>
                  <th className="pb-3 text-text-secondary font-medium">Anuncios</th>
                  <th className="pb-3 text-text-secondary font-medium">Verificado</th>
                  <th className="pb-3 text-text-secondary font-medium">Registro</th>
                  <th className="pb-3 text-text-secondary font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-accent-purple/15/50 hover:bg-bg-secondary/30">
                    <td className="py-3 pr-4 max-w-[200px] truncate">{user.email}</td>
                    <td className="py-3 pr-4 text-text-secondary">{user.whatsappNumber}</td>
                    <td className="py-3 pr-4 text-text-secondary">{user.countryCode}</td>
                    <td className="py-3 pr-4">
                      {editingRep === user.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={repValue}
                            onChange={(e) => setRepValue(e.target.value)}
                            className="w-16 bg-bg-elevated border border-accent-purple rounded px-2 py-0.5 text-xs text-text-primary"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSetReputation(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-2 py-0.5 bg-accent-purple text-white rounded text-xs disabled:opacity-50"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setEditingRep(null); setRepValue(''); }}
                            className="px-2 py-0.5 bg-bg-secondary text-text-secondary rounded text-xs"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingRep(user.id); setRepValue(String(user.reputation)); }}
                          className="hover:opacity-80 transition-opacity"
                          title="Click para editar reputacion"
                        >
                          {reputationBadge(user.reputation)}
                        </button>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">{user._count.ads}</td>
                    <td className="py-3 pr-4">
                      {user.emailVerified ? (
                        <span className="text-green-400 text-xs">Si</span>
                      ) : (
                        <span className="text-red-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {user.reputation > 0 ? (
                          <button
                            onClick={() => handleAction(user.id, 'block')}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Bloquear
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(user.id, 'unblock')}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Desbloquear
                          </button>
                        )}
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
                  onClick={() => fetchUsers(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-3 py-1.5 bg-bg-secondary rounded text-sm disabled:opacity-30 hover:bg-bg-card transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchUsers(meta.page + 1)}
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
