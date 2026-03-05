'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegistroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
          whatsappNumber: whatsapp,
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
          <Link
            href="/login"
            className="text-sm text-accent-gold hover:underline"
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
          Publica tu anuncio gratis en WebClasificados
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
            <label htmlFor="whatsapp" className="mb-1 block text-sm text-text-secondary">
              WhatsApp (con código de país)
            </label>
            <input
              id="whatsapp"
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+573001234567"
              className="w-full rounded-lg border border-accent-purple/20 bg-bg-primary px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 outline-none transition-colors focus:border-accent-gold"
            />
            <p className="mt-1 text-xs text-text-secondary/60">
              Este número será tu contacto público. Incluye el código de país.
            </p>
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
            <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
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
