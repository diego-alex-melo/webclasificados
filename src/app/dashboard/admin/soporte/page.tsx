'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TicketCategory = 'BUG' | 'AD_ISSUE' | 'SUGGESTION' | 'OTHER';
type TicketStatus = 'OPEN' | 'RESPONDED' | 'CLOSED';

interface Ticket {
  id: string;
  category: TicketCategory;
  email: string;
  message: string;
  status: TicketStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Meta {
  total: number;
  open: number;
  responded: number;
  closed: number;
}

const CATEGORY_STYLES: Record<TicketCategory, string> = {
  BUG: 'bg-rose-500/20 text-rose-300',
  AD_ISSUE: 'bg-amber-500/20 text-amber-300',
  SUGGESTION: 'bg-blue-500/20 text-blue-300',
  OTHER: 'bg-gray-500/20 text-gray-300',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  BUG: 'Bug',
  AD_ISSUE: 'Anuncio',
  SUGGESTION: 'Sugerencia',
  OTHER: 'Otro',
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  OPEN: 'bg-green-500/20 text-green-300',
  RESPONDED: 'bg-blue-500/20 text-blue-300',
  CLOSED: 'bg-gray-500/20 text-gray-300',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  RESPONDED: 'Respondido',
  CLOSED: 'Cerrado',
};

type FilterStatus = 'ALL' | TicketStatus;

export default function SoportePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, open: 0, responded: 0, closed: 0 });
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for expanded ticket
  const [editStatus, setEditStatus] = useState<TicketStatus>('OPEN');
  const [editNotes, setEditNotes] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Admin check on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch('/api/admin/check', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.data?.isAdmin) {
          router.replace('/');
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        router.replace('/');
      });
  }, [router]);

  // Fetch tickets
  useEffect(() => {
    if (checking) return;

    async function load() {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);

      try {
        const res = await fetch(`/api/admin/tickets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al cargar tickets');

        setTickets(json.data);
        setMeta(json.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [checking, filter]);

  function handleExpand(ticket: Ticket) {
    if (expandedId === ticket.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(ticket.id);
    setEditStatus(ticket.status);
    setEditNotes(ticket.adminNotes || '');
    setCopySuccess(false);
  }

  async function handleSave(ticketId: string) {
    setSaving(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: editStatus, adminNotes: editNotes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error al guardar');

      // Update ticket in local state
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? json.data : t)),
      );

      // Refresh meta counts
      const metaRes = await fetch('/api/admin/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const metaJson = await metaRes.json();
      if (metaRes.ok) setMeta(metaJson.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0d0015] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const FILTER_TABS: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todos', count: meta.total },
    { key: 'OPEN', label: 'Abiertos', count: meta.open },
    { key: 'RESPONDED', label: 'Respondidos', count: meta.responded },
    { key: 'CLOSED', label: 'Cerrados', count: meta.closed },
  ];

  return (
    <div className="min-h-screen bg-[#0d0015] text-[#e8e0f0] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#d4af37] mb-6">
          Soporte - Tickets
        </h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-[#7b2ff2] text-white'
                  : 'bg-[#1a0e2e] text-[#a090b8] hover:bg-[#251540]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-[#7b2ff2]/20 text-[#a090b8]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && tickets.length === 0 && (
          <div className="text-center py-16 text-[#a090b8]">
            <svg
              className="mx-auto mb-4 w-12 h-12 opacity-40"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5-1.875a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.375a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v9m-18 0V6.375"
              />
            </svg>
            <p className="text-lg">No hay tickets</p>
          </div>
        )}

        {/* Ticket list */}
        {!loading && tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-[#1a0e2e] rounded-xl bg-[#110a1f] overflow-hidden"
              >
                {/* Ticket summary row */}
                <button
                  onClick={() => handleExpand(ticket)}
                  className="w-full text-left p-4 hover:bg-[#1a0e2e]/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs text-[#a090b8]">
                      {formatDate(ticket.createdAt)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_STYLES[ticket.category]}`}
                    >
                      {CATEGORY_LABELS[ticket.category]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="text-sm text-[#a090b8] mb-1">{ticket.email}</p>
                  <p className="text-sm text-[#e8e0f0]">
                    {ticket.message.length > 100
                      ? ticket.message.slice(0, 100) + '...'
                      : ticket.message}
                  </p>
                </button>

                {/* Expanded view */}
                {expandedId === ticket.id && (
                  <div className="border-t border-[#1a0e2e] p-4 space-y-4 bg-[#0d0015]/50">
                    {/* Full message */}
                    <div>
                      <label className="block text-xs text-[#a090b8] mb-1 uppercase tracking-wide">
                        Mensaje completo
                      </label>
                      <p className="text-sm text-[#e8e0f0] whitespace-pre-wrap bg-[#1a0e2e] rounded-lg p-3">
                        {ticket.message}
                      </p>
                    </div>

                    {/* Admin notes */}
                    <div>
                      <label className="block text-xs text-[#a090b8] mb-1 uppercase tracking-wide">
                        Notas del admin
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg p-3 text-sm text-[#e8e0f0] placeholder-[#a090b8]/50 focus:outline-none focus:border-[#7b2ff2] resize-none"
                        placeholder="Notas internas..."
                      />
                    </div>

                    {/* Status select */}
                    <div>
                      <label className="block text-xs text-[#a090b8] mb-1 uppercase tracking-wide">
                        Estado
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(e.target.value as TicketStatus)
                        }
                        className="bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg px-3 py-2 text-sm text-[#e8e0f0] focus:outline-none focus:border-[#7b2ff2]"
                      >
                        <option value="OPEN">Abierto</option>
                        <option value="RESPONDED">Respondido</option>
                        <option value="CLOSED">Cerrado</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSave(ticket.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-[#7b2ff2] hover:bg-[#6a1fe0] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => handleCopyEmail(ticket.email)}
                        className="px-4 py-2 bg-[#1a0e2e] hover:bg-[#251540] text-[#a090b8] text-sm rounded-lg transition-colors border border-[#2a1a4e]"
                      >
                        {copySuccess ? 'Copiado' : 'Copiar email'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
