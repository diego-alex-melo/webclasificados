'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar la solicitud');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">
          Recuperar contraseña
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>

        {submitted ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-500/10 px-4 py-4 text-sm text-green-400 leading-relaxed">
              <p className="font-semibold mb-1">Revisa tu email</p>
              <p>
                Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace
                para restablecer tu contraseña en los próximos minutos.
              </p>
            </div>
            <p className="text-center text-sm text-text-secondary">
              ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="text-accent-gold hover:underline"
              >
                intenta de nuevo
              </button>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
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
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="text-accent-gold hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
