'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerificarContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMsg('Token de verificación no proporcionado.');
      return;
    }

    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
      redirect: 'manual',
    })
      .then((res) => {
        if (res.ok || res.status === 0 || res.type === 'opaqueredirect') {
          setStatus('success');
        } else {
          return res.json().then((data) => {
            setStatus('error');
            setErrorMsg(data.error || 'Error al verificar el email.');
          });
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Error de conexión. Intenta de nuevo.');
      });
  }, [searchParams]);

  return (
    <div className="rounded-2xl border border-accent-purple/20 bg-bg-card p-8">
      {status === 'loading' && (
        <>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
          <h1 className="text-xl font-bold text-text-primary">
            Verificando tu cuenta...
          </h1>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mb-4 text-5xl">✅</div>
          <h1 className="mb-3 text-2xl font-bold text-text-primary">
            Cuenta verificada
          </h1>
          <p className="mb-6 text-sm text-text-secondary">
            Tu email ha sido verificado exitosamente. Ya puedes iniciar sesión y publicar tu anuncio.
          </p>
          <Link
            href="/login?verified=true"
            className="inline-block rounded-lg bg-accent-gold px-6 py-3 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-gold-light"
          >
            Iniciar sesión
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="mb-4 text-5xl">❌</div>
          <h1 className="mb-3 text-2xl font-bold text-text-primary">
            Error de verificación
          </h1>
          <p className="mb-6 text-sm text-red-400">{errorMsg}</p>
          <Link
            href="/registro"
            className="text-sm text-accent-gold hover:underline"
          >
            Volver al registro
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerificarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-purple border-t-transparent" />
          </div>
        }
      >
        <VerificarContent />
      </Suspense>
    </div>
  );
}
