'use client';

import { useEffect, useState } from 'react';

interface ReferralData {
  code: string;
  referralLink: string;
  whatsappShareLink: string;
  referrals: number;
  bonusRepublications: number;
  referredUsers: Array<{ email: string; createdAt: string }>;
}

export default function ReferidosPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadReferralData() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/referrals', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Error al cargar datos de referidos');
        }

        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    loadReferralData();
  }, []);

  async function handleCopy() {
    if (!data) return;

    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = data.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
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

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8e0f0]">Programa de Referidos</h1>
        <p className="text-[#a090b8] text-sm mt-1">
          Invita a otros profesionales y obtiene beneficios.
        </p>
      </div>

      {/* Referral code and links */}
      <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6 space-y-4">
        <div>
          <p className="text-xs text-[#a090b8] mb-1">Tu codigo de referido</p>
          <p className="text-2xl font-mono font-bold text-[#d4af37] tracking-wider">
            {data.code}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#a090b8] mb-2">Tu enlace de referido</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={data.referralLink}
              className="flex-1 bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg px-3 py-2 text-sm text-[#e8e0f0] font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 px-4 py-2 bg-[#7b2ff2] text-white text-sm rounded-lg hover:bg-[#6a22e0] transition-colors"
            >
              {copied ? 'Copiado' : 'Copiar enlace'}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={data.whatsappShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#128C7E] text-white text-sm font-medium rounded-lg hover:bg-[#0e6b5e] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Compartir por WhatsApp
          </a>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4">
          <p className="text-xs text-[#a090b8] mb-1">Total referidos</p>
          <p className="text-2xl font-bold text-[#7b2ff2]">{data.referrals}</p>
        </div>
        <div className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4">
          <p className="text-xs text-[#a090b8] mb-1">Republicaciones bonus</p>
          <p className="text-2xl font-bold text-[#d4af37]">{data.bonusRepublications}</p>
        </div>
      </div>

      {/* Referred users list */}
      <section className="bg-[#0d0015] border border-[#1a0e2e] rounded-xl p-4 lg:p-6">
        <h2 className="text-sm font-medium text-[#a090b8] mb-4">Usuarios referidos</h2>

        {data.referredUsers.length === 0 ? (
          <p className="text-sm text-[#6b5a80] text-center py-8">
            Aun no has referido a nadie. Comparte tu enlace para empezar.
          </p>
        ) : (
          <div className="space-y-2">
            {data.referredUsers.map((user, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[#1a0e2e] last:border-b-0"
              >
                <span className="text-sm text-[#e8e0f0] font-mono">{user.email}</span>
                <span className="text-xs text-[#6b5a80]">
                  {new Date(user.createdAt).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
