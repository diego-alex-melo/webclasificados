'use client';

import { useEffect, useState } from 'react';

interface ErrorEntry {
  id: number;
  route: string;
  method: string;
  message: string;
  stack: string | null;
  createdAt: string;
}

export default function ErroresPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/admin/errors?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setErrors(json.data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Error Logs</h1>
      <p className="text-text-secondary text-sm mb-6">
        Ultimos 50 errores 500 del servidor.
      </p>

      {errors.length === 0 ? (
        <div className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-8 text-center">
          <p className="text-[#25D366] text-sm">Sin errores registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {errors.map((err) => (
            <div
              key={err.id}
              className="bg-bg-elevated border border-accent-purple/15 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === err.id ? null : err.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-secondary/50 transition-colors"
              >
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-400">
                  {err.method}
                </span>
                <span className="text-sm text-text-secondary font-mono flex-shrink-0">
                  {err.route}
                </span>
                <span className="text-sm text-text-primary truncate flex-1">
                  {err.message}
                </span>
                <span className="text-xs text-text-secondary/70 flex-shrink-0">
                  {new Date(err.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                </span>
              </button>

              {expanded === err.id && err.stack && (
                <div className="px-4 pb-3">
                  <pre className="text-xs text-text-secondary/70 font-mono whitespace-pre-wrap bg-bg-secondary rounded p-3 max-h-48 overflow-auto">
                    {err.stack}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
