'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
/* eslint-disable @next/next/no-img-element */

import { countriesFromPhone } from '@/lib/utils/country-from-phone';
import { COUNTRY_MAP } from '@/lib/utils/countries';
import CountryFlag from '@/components/CountryFlag';

interface ServiceOption {
  id: number;
  name: string;
  slug: string;
}

interface TraditionOption {
  id: number;
  name: string;
  slug: string;
}

interface ExistingAd {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  whatsappNumber: string;
  countryCode: string;
  websiteUrl: string | null;
  status: string;
  rejectionReason: string | null;
  services: Array<{ service: { slug: string } }>;
  traditions: Array<{ tradition: { slug: string } }>;
}

export default function AnuncioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AnuncioContent />
    </Suspense>
  );
}

function AnuncioContent() {
  const searchParams = useSearchParams();
  const isNewMode = searchParams.get('new') === '1';

  // Which ad to edit (null = new ad form)
  const [editingAd, setEditingAd] = useState<ExistingAd | null>(null);
  const [existingAds, setExistingAds] = useState<ExistingAd[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTraditions, setSelectedTraditions] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Country selector for +1 ambiguity
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Options from DB
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [traditionOptions, setTraditionOptions] = useState<TraditionOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [servicesRes, traditionsRes, adsRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/traditions'),
          fetch('/api/ads/mine', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (servicesRes.ok) {
          const sJson = await servicesRes.json();
          setServiceOptions(sJson.data ?? []);
        }

        if (traditionsRes.ok) {
          const tJson = await traditionsRes.json();
          setTraditionOptions(tJson.data ?? []);
        }

        if (adsRes.ok) {
          const adsJson = await adsRes.json();
          const ads: ExistingAd[] = Array.isArray(adsJson.data) ? adsJson.data : [];
          setExistingAds(ads);
        }
      } catch {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // When arriving with ?new=1, ensure form is in create mode and scroll to it
  useEffect(() => {
    if (!loading && isNewMode && formRef.current) {
      setEditingAd(null);
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, isNewMode]);

  // ── WhatsApp number change → detect country ──────────────────────────────

  function handleWhatsAppChange(value: string) {
    setWhatsappNumber(value);
    setShowCountrySelector(false);

    if (value.length >= 4) {
      const countries = countriesFromPhone(value);
      if (countries.length > 1) {
        setCountryOptions(countries);
        setShowCountrySelector(true);
        setCountryCode('');
      } else if (countries.length === 1) {
        setCountryCode(countries[0]);
        setCountryOptions([]);
      } else {
        setCountryCode('');
      }
    } else {
      setCountryCode('');
    }
  }

  // ── Load ad into form for editing ─────────────────────────────────────────

  function loadAdIntoForm(ad: ExistingAd) {
    setEditingAd(ad);
    setTitle(ad.title);
    setDescription(ad.description);
    setSelectedServices(ad.services.map((s) => s.service.slug));
    setSelectedTraditions(ad.traditions.map((t) => t.tradition.slug));
    setImageUrl(ad.imageUrl);
    setImagePreview(ad.imageUrl);
    setWhatsappNumber(ad.whatsappNumber);
    setCountryCode(ad.countryCode);
    setWebsiteUrl(ad.websiteUrl ?? '');
    setShowCountrySelector(false);
    setError(null);
    setSuccess(null);
  }

  function resetForm() {
    setEditingAd(null);
    setTitle('');
    setDescription('');
    setSelectedServices([]);
    setSelectedTraditions([]);
    setImageUrl(null);
    setImagePreview(null);
    setWhatsappNumber('');
    setCountryCode('');
    setWebsiteUrl('');
    setShowCountrySelector(false);
    setError(null);
    setSuccess(null);
  }

  // ── Delete ad handler ────────────────────────────────────────────────────

  async function handleDeleteAd(adId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/ads/${adId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? 'Error al eliminar anuncio');
        return;
      }

      setExistingAds((prev) => prev.filter((a) => a.id !== adId));
      if (editingAd?.id === adId) resetForm();
      setSuccess('Anuncio eliminado correctamente');
    } catch {
      setError('Error al eliminar anuncio');
    }
  }

  // ── Image upload handler ──────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ads/image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Error al subir imagen');
        setImagePreview(null);
        return;
      }

      setImageUrl(json.data.url);
    } catch {
      setError('Error de conexion al subir imagen');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  // ── Toggle helpers ────────────────────────────────────────────────────────

  function toggleService(slug: string) {
    setSelectedServices((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function toggleTradition(slug: string) {
    setSelectedTraditions((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!countryCode) {
      setError('Selecciona el pais de tu anuncio');
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const isUpdating = !!editingAd;

      const body = {
        ...(isUpdating ? { adId: editingAd.id } : {}),
        title: title.trim(),
        description: description.trim(),
        services: selectedServices,
        traditions: selectedTraditions,
        imageUrl: imageUrl ?? undefined,
        whatsappNumber,
        countryCode,
        websiteUrl: websiteUrl.trim() || undefined,
      };

      const res = await fetch('/api/ads', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (res.status === 422) {
        setError(json.error ?? 'Anuncio rechazado');
        return;
      }

      if (!res.ok) {
        setError(json.error ?? 'Error al publicar anuncio');
        return;
      }

      setSuccess(isUpdating ? 'Anuncio actualizado exitosamente.' : 'Anuncio publicado exitosamente.');

      // Refresh ads list
      const adsRes = await fetch('/api/ads/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (adsRes.ok) {
        const adsJson = await adsRes.json();
        setExistingAds(Array.isArray(adsJson.data) ? adsJson.data : []);
      }

      if (isUpdating) {
        setEditingAd(json.data);
      } else {
        resetForm();
      }

      submitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      setError('Error de conexion. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = !!editingAd;
  const canCreateNew = existingAds.filter((a) => a.status !== 'REJECTED').length < 3;

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6">
      {/* Left column: Ad list */}
      <div className="lg:w-1/3 lg:sticky lg:top-24 lg:self-start mb-6 lg:mb-0">
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Mis anuncios ({existingAds.filter((a) => a.status !== 'REJECTED').length}/3)
        </h2>
        {existingAds.length > 0 && (
          <div className="space-y-2">
            {existingAds.map((ad) => {
              const country = COUNTRY_MAP[ad.countryCode];
              return (
                <div
                  key={ad.id}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    editingAd?.id === ad.id
                      ? 'border-accent-purple bg-accent-purple/10'
                      : 'border-accent-purple/25 bg-bg-card hover:border-accent-purple/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => editingAd?.id === ad.id ? resetForm() : loadAdIntoForm(ad)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CountryFlag code={ad.countryCode} size={16} />
                      <p className="text-sm text-text-primary truncate">{ad.title}</p>
                    </div>
                    <p className="text-xs text-text-secondary/70 mt-0.5">
                      {country?.name ?? ad.countryCode} &middot;{' '}
                      <span className={
                        ad.status === 'ACTIVE' ? 'text-[#25D366]' :
                        ad.status === 'REJECTED' ? 'text-red-400' :
                        'text-accent-gold'
                      }>
                        {ad.status === 'ACTIVE' ? 'Activo' :
                         ad.status === 'REJECTED' ? 'Rechazado' :
                         ad.status === 'PENDING' ? 'Pendiente' : ad.status}
                      </span>
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteAd(ad.id); }}
                    className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {canCreateNew && !editingAd && (
          <button
            type="button"
            onClick={resetForm}
            className="mt-3 w-full py-2.5 border border-dashed border-accent-purple/20 rounded-lg text-sm text-text-secondary hover:border-accent-purple hover:text-text-primary transition-colors"
          >
            + Crear nuevo anuncio
          </button>
        )}

        {!canCreateNew && !editingAd && existingAds.length > 0 && (
          <p className="mt-4 text-text-secondary/70 text-xs text-center">
            Limite de 3 anuncios alcanzado
          </p>
        )}
      </div>

      {/* Right column: Form */}
      <div className="lg:w-2/3" ref={formRef}>
      {(editingAd || canCreateNew || existingAds.length === 0) && (
        <>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isEdit ? 'Editar anuncio' : 'Crear anuncio'}
          </h1>

          {editingAd?.status === 'REJECTED' && editingAd.rejectionReason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-medium mb-1">Anuncio rechazado</p>
              <p className="text-red-300 text-sm">{editingAd.rejectionReason}</p>
              <p className="text-text-secondary text-xs mt-2">Corrige los problemas y vuelve a enviar.</p>
            </div>
          )}

          {success && (
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg p-4 mb-6">
              <p className="text-[#25D366] text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WhatsApp number */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                WhatsApp (con codigo de pais)
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                required
                className="w-full bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/70 focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="+573001234567"
              />
              <p className="text-xs text-text-secondary/70 mt-1">
                Este numero sera el contacto de este anuncio. El pais se detecta automaticamente.
              </p>
            </div>

            {/* Country selector (only for +1) */}
            {showCountrySelector && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Selecciona el pais del anuncio
                </label>
                <div className="flex flex-wrap gap-2">
                  {countryOptions.map((code) => {
                    const c = COUNTRY_MAP[code];
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setCountryCode(code)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
                          countryCode === code
                            ? 'bg-accent-purple/20 border-accent-purple text-text-primary'
                            : 'bg-bg-secondary border-accent-purple/20 text-text-secondary hover:border-accent-purple/50'
                        }`}
                      >
                        <CountryFlag code={code} size={16} />
                        <span>{c?.name ?? code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detected country display */}
            {countryCode && !showCountrySelector && (
              <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg border border-accent-purple/20">
                <CountryFlag code={countryCode} size={16} />
                <span className="text-sm text-text-primary">
                  {COUNTRY_MAP[countryCode]?.name ?? countryCode}
                </span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Titulo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                spellCheck
                lang="es"
                className="w-full bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/70 focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="Ej: Lectura de Tarot profesional en Bogota"
              />
              <p className="text-xs text-text-secondary/70 mt-1 text-right">{title.length}/100</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Descripcion</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                required
                rows={6}
                spellCheck
                lang="es"
                className="w-full bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/70 focus:border-accent-purple focus:outline-none transition-colors resize-y"
                placeholder="Describe tus servicios, experiencia y lo que ofreces..."
              />
              <p className="text-xs text-text-secondary/70 mt-1 text-right">{description.length}/2000</p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Imagen (opcional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-accent-purple/20">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      X
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-bg-secondary border border-accent-purple/20 rounded-lg text-sm text-text-secondary hover:border-accent-purple transition-colors"
                >
                  {uploading ? 'Subiendo...' : imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
              </div>
              <p className="text-xs text-text-secondary/70 mt-1">JPEG, PNG, WebP o GIF. Maximo 5 MB.</p>
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Sitio web (opcional)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full bg-bg-secondary border border-accent-purple/20 rounded-lg px-4 py-2.5 text-text-primary placeholder-text-secondary/70 focus:border-accent-purple focus:outline-none transition-colors"
                placeholder="https://tu-sitio-web.com"
              />
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Servicios</label>
              {serviceOptions.length === 0 ? (
                <p className="text-xs text-text-secondary/70">Cargando servicios...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {serviceOptions.map((svc) => (
                    <label
                      key={svc.slug}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${
                        selectedServices.includes(svc.slug)
                          ? 'bg-accent-purple/20 border-accent-purple text-text-primary'
                          : 'bg-bg-secondary border-accent-purple/20 text-text-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(svc.slug)}
                        onChange={() => toggleService(svc.slug)}
                        className="sr-only"
                      />
                      {svc.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Traditions */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Especialidades</label>
              {traditionOptions.length === 0 ? (
                <p className="text-xs text-text-secondary/70">Cargando especialidades...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {traditionOptions.map((trad) => (
                    <label
                      key={trad.slug}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${
                        selectedTraditions.includes(trad.slug)
                          ? 'bg-accent-purple/20 border-accent-purple text-text-primary'
                          : 'bg-bg-secondary border-accent-purple/20 text-text-secondary hover:border-accent-purple/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTraditions.includes(trad.slug)}
                        onChange={() => toggleTradition(trad.slug)}
                        className="sr-only"
                      />
                      {trad.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div ref={submitRef}>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-accent-gold text-bg-primary font-medium rounded-lg hover:bg-accent-gold-light active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? 'Enviando...'
                  : editingAd?.status === 'REJECTED'
                    ? 'Corregir y reenviar'
                    : isEdit
                      ? 'Guardar cambios'
                      : 'Publicar anuncio'}
              </button>

              {success && (
                <div className="bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg p-4 mt-4">
                  <p className="text-[#25D366] text-sm">{success}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </form>
        </>
      )}
      </div>
    </div>
  );
}
