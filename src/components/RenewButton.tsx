'use client';

import { useState } from 'react';

interface RenewButtonProps {
  adId: string;
  expiresAt: string;
  renewalWindowDays?: number;
}

export default function RenewButton({
  adId,
  expiresAt,
  renewalWindowDays = 7,
}: RenewButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const now = Date.now();
  const expiryTime = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
  const canRenew = daysLeft <= renewalWindowDays && daysLeft > 0;

  async function handleRenew() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/ads/${adId}/renew`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Error al renovar');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p className="text-[#25D366] text-xs">
        Anuncio renovado por 60 dias mas.
      </p>
    );
  }

  if (!canRenew) {
    return (
      <p className="text-xs text-text-secondary/70">
        {daysLeft > renewalWindowDays
          ? `Disponible en ${daysLeft - renewalWindowDays} dias`
          : 'El anuncio ya expiro'}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleRenew}
        disabled={loading}
        className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 bg-[#25D366] text-bg-primary hover:bg-[#2ee87a] active:scale-95"
      >
        {loading ? 'Renovando...' : `Renovar (${daysLeft} dias restantes)`}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
