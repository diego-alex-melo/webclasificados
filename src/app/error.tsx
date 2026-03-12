'use client';

import Link from 'next/link';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-5xl">⚠️</p>
      <h2 className="mb-2 text-xl font-bold">Algo salió mal</h2>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-accent-purple px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-purple/80"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-text-secondary/20 px-6 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
