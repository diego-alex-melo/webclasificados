'use client';

import { useState, type FormEvent } from 'react';

const CATEGORIES = [
  { value: '', label: 'Selecciona una categoría' },
  { value: 'BUG', label: 'Reportar un error' },
  { value: 'AD_ISSUE', label: 'Problema con mi anuncio' },
  { value: 'SUGGESTION', label: 'Sugerencia' },
  { value: 'OTHER', label: 'Otro' },
] as const;

const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 10;

interface FieldErrors {
  category?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const [category, setCategory] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  const remaining = MAX_MESSAGE_LENGTH - message.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');
    setLoading(true);

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, email, message }),
      });

      if (res.ok) {
        setSuccess(true);
        return;
      }

      if (res.status === 422) {
        const data = await res.json();
        const errors: FieldErrors = {};
        if (data.errors) {
          for (const err of data.errors) {
            const field = err.path?.[0] as keyof FieldErrors | undefined;
            if (field && !errors[field]) {
              errors[field] = err.message;
            }
          }
        }
        setFieldErrors(errors);
      } else if (res.status === 429) {
        setGeneralError('Has enviado demasiados mensajes. Intenta de nuevo más tarde.');
      } else {
        setGeneralError('Ocurrió un error inesperado. Intenta de nuevo más tarde.');
      }
    } catch {
      setGeneralError('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card-gradient rounded-xl p-6">
        <p className="text-green-400 font-medium">
          Tu mensaje fue enviado. Te responderemos por email en un plazo de 48 horas.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-gradient rounded-xl p-6 space-y-5">
      {generalError && (
        <p className="text-red-400 text-sm">{generalError}</p>
      )}

      <div>
        <label htmlFor="contact-category" className="mb-1.5 block text-sm font-medium text-text-primary">
          Categoría
        </label>
        <select
          id="contact-category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-bg-secondary px-4 py-3 text-text-primary focus:border-accent-purple focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} disabled={cat.value === ''}>
              {cat.label}
            </option>
          ))}
        </select>
        {fieldErrors.category && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.category}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-text-primary">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-lg border border-white/10 bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-accent-purple focus:outline-none"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-text-primary">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          required
          minLength={MIN_MESSAGE_LENGTH}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe tu consulta con el mayor detalle posible..."
          className="w-full resize-y rounded-lg border border-white/10 bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-secondary/50 focus:border-accent-purple focus:outline-none"
        />
        <div className="mt-1 flex justify-between text-xs text-text-secondary">
          {fieldErrors.message ? (
            <p className="text-red-400">{fieldErrors.message}</p>
          ) : (
            <span />
          )}
          <span className={remaining < 50 ? 'text-accent-gold' : ''}>
            {remaining} caracteres restantes
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent-purple px-6 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
