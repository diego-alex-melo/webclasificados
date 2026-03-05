'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!token) {
      setError('Enlace de recuperación inválido. Solicita uno nuevo.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al restablecer la contraseña');
        return;
      }

      router.replace('/login?reset=true');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">
          Enlace inválido
        </h1>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Este enlace de recuperación no es válido o ha expirado.
        </p>
        <Link
          href="/forgot-password"
          className="block w-full rounded-lg bg-accent-gold py-3 text-center text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-gold-light"
        >
          Solicitar nuevo enlace
        </Link>
        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent-gold hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
      <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">
        Nueva contraseña
      </h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        Ingresa tu nueva contraseña
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-text-secondary">
            Nueva contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full rounded-lg border border-accent-purple/20 bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-accent-gold"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm text-text-secondary">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu nueva contraseña"
            className="w-full rounded-lg border border-accent-purple/20 bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-accent-gold"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent-gold py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-gold-light disabled:opacity-50"
        >
          {loading ? 'Guardando contraseña...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href="/login" className="text-accent-gold hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
