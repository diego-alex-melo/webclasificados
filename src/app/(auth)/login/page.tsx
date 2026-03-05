'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerified(true);
    }
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }

      localStorage.setItem('token', data.data.token);
      router.replace('/dashboard');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
      <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">
        Iniciar sesión
      </h1>
      <p className="mb-8 text-center text-sm text-text-secondary">
        Accede a tu panel de anunciante
      </p>

      {verified && (
        <div className="mb-6 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Tu cuenta ha sido verificada. Ya puedes iniciar sesión.
        </div>
      )}

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

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-text-secondary">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
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
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-accent-gold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
