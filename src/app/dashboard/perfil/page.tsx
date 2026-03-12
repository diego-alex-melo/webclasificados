'use client';

import { useEffect, useState } from 'react';

interface Profile {
  email: string;
  whatsappNumber: string | null;
  websiteUrl: string | null;
  referralCode: string;
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          const data: Profile = json.data;
          setProfile(data);
          setWebsiteUrl(data.websiteUrl ?? '');
        }
      } catch {
        setError('Error al cargar perfil');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Error al actualizar');
        return;
      }

      setProfile(json.data);
      setSuccess('Perfil actualizado correctamente.');
    } catch {
      setError('Error de conexion.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mi Perfil</h1>
        <p className="text-text-secondary text-sm mt-1">
          Actualiza tu informacion de contacto.
        </p>
      </div>

      {/* Read-only info */}
      <section className="bg-bg-elevated border border-accent-purple/15 rounded-xl p-4 lg:p-6 space-y-3">
        <div>
          <span className="text-xs text-text-secondary/70">Email</span>
          <p className="text-sm text-text-primary">{profile?.email}</p>
        </div>
        <div>
          <span className="text-xs text-text-secondary/70">Codigo de referido</span>
          <p className="text-sm text-accent-gold font-mono">{profile?.referralCode}</p>
        </div>
      </section>

      {/* Editable fields */}
      {success && (
        <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg p-4">
          <p className="text-[#25D366] text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1.5">
            Sitio web <span className="text-text-secondary/70">(opcional)</span>
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://tusitio.com"
            className="w-full bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/70 focus:border-accent-purple focus:outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-accent-gold text-bg-primary font-medium rounded-lg hover:bg-accent-gold-light active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
