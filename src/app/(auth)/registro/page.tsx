'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferral(ref);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(referral ? { referralCode: referral } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al registrarse');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
          <div className="mb-4 text-5xl">✉️</div>
          <h1 className="mb-3 text-2xl font-bold text-text-primary">
            Revisa tu email
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Enviamos un enlace de verificación a <strong className="text-text-primary">{email}</strong>.
            Haz clic en el enlace para activar tu cuenta.
          </p>
          <p className="mb-4 text-xs text-text-secondary/60">
            ¿No recibiste el correo? Revisa tu carpeta de spam.
          </p>
          {resent ? (
            <p className="mb-4 text-sm text-green-400">
              Correo reenviado. Revisa tu bandeja de entrada.
            </p>
          ) : (
            <button
              type="button"
              disabled={resending}
              onClick={async () => {
                setResending(true);
                try {
                  await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                  });
                  setResent(true);
                } catch {
                  // silently fail
                } finally {
                  setResending(false);
                }
              }}
              className="mb-4 text-sm text-accent-gold hover:underline disabled:opacity-50"
            >
              {resending ? 'Enviando...' : 'Reenviar correo de verificación'}
            </button>
          )}
          <br />
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-accent-gold transition-colors"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-text-primary">
          Crear cuenta
        </h1>
        <p className="mb-8 text-center text-sm text-text-secondary">
          Publica tu anuncio gratis en BrujosClassifieds
        </p>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-accent-purple/20 bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-accent-gold"
            />
          </div>

          <div>
            <label htmlFor="referral" className="mb-1 block text-sm text-text-secondary">
              Código de referido <span className="text-text-secondary/50">(opcional)</span>
            </label>
            <input
              id="referral"
              type="text"
              maxLength={8}
              value={referral}
              onChange={(e) => setReferral(e.target.value)}
              placeholder="XXXXXXXX"
              className="w-full rounded-lg border border-accent-purple/20 bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-accent-gold"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              <p>{error}</p>
              {error.toLowerCase().includes('ya existe') && (
                <Link href="/forgot-password" className="mt-2 inline-block text-accent-gold hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent-gold py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-gold-light disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent-gold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
