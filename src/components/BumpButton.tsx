'use client';

import { useState, useEffect, useCallback } from 'react';

interface BumpButtonProps {
  lastBumpedAt: string | null;
  cooldownHours?: number;
}

const COOLDOWN_MS_DEFAULT = 48 * 60 * 60 * 1000; // 48 hours

export default function BumpButton({
  lastBumpedAt,
  cooldownHours = 48,
}: BumpButtonProps) {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);
  const [bumpTime, setBumpTime] = useState<string | null>(lastBumpedAt);

  const calcRemaining = useCallback(() => {
    if (!bumpTime) return 0;
    const elapsed = Date.now() - new Date(bumpTime).getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [bumpTime, cooldownMs]);

  useEffect(() => {
    setRemaining(calcRemaining());
    const interval = setInterval(() => {
      setRemaining(calcRemaining());
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining]);

  const inCooldown = remaining > 0;

  async function handleBump() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ads/bump', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Error al republicar');
        return;
      }

      setSuccess(true);
      setBumpTime(new Date().toISOString());
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function formatCountdown(ms: number): string {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `Disponible en ${hours}h ${minutes}m`;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleBump}
        disabled={inCooldown || loading}
        className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
          inCooldown
            ? 'bg-[#1a0e2e] text-[#6b5a80] cursor-not-allowed'
            : 'bg-[#d4af37] text-[#0d0015] hover:bg-[#e8c54a] active:scale-95'
        }`}
      >
        {loading
          ? 'Republicando...'
          : inCooldown
            ? formatCountdown(remaining)
            : 'Republicar'}
      </button>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
      {success && (
        <p className="text-[#25D366] text-xs">
          Anuncio republicado con exito.
        </p>
      )}
    </div>
  );
}
