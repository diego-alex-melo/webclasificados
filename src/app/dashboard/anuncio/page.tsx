'use client';

import { useEffect, useState, useRef } from 'react';
/* eslint-disable @next/next/no-img-element */

import { PROFESSIONAL_TYPES } from '@/types';

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
  professionalType: string;
  status: string;
  rejectionReason: string | null;
  services: Array<{ service: { slug: string } }>;
  traditions: Array<{ tradition: { slug: string } }>;
}

export default function AnuncioPage() {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [professionalType, setProfessionalType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedTraditions, setSelectedTraditions] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Options from DB
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [traditionOptions, setTraditionOptions] = useState<TraditionOption[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingAd, setExistingAd] = useState<ExistingAd | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch services, traditions, and existing ad in parallel
        const [servicesRes, traditionsRes, adRes] = await Promise.all([
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

        if (adRes.ok) {
          const adJson = await adRes.json();
          const ad: ExistingAd = adJson.data;
          setExistingAd(ad);
          // Pre-fill form
          setTitle(ad.title);
          setDescription(ad.description);
          setProfessionalType(ad.professionalType);
          setSelectedServices(ad.services.map((s) => s.service.slug));
          setSelectedTraditions(ad.traditions.map((t) => t.tradition.slug));
          setImageUrl(ad.imageUrl);
          if (ad.imageUrl) setImagePreview(ad.imageUrl);
        }
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ── Image upload handler ──────────────────────────────────────────────────

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
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
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug],
    );
  }

  function toggleTradition(slug: string) {
    setSelectedTraditions((prev) =>
      prev.includes(slug)
        ? prev.filter((t) => t !== slug)
        : [...prev, slug],
    );
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');

      const isUpdating = existingAd && existingAd.status !== 'REJECTED';

      const body = {
        ...(isUpdating ? { adId: existingAd.id } : {}),
        title: title.trim(),
        description: description.trim(),
        professionalType,
        services: selectedServices,
        traditions: selectedTraditions,
        imageUrl: imageUrl ?? undefined,
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
        // Rejected by spam pipeline
        setError(json.error ?? 'Anuncio rechazado');
        return;
      }

      if (!res.ok) {
        setError(json.error ?? 'Error al publicar anuncio');
        return;
      }

      setSuccess(isUpdating ? 'Anuncio actualizado exitosamente.' : 'Anuncio publicado exitosamente.');
      setExistingAd(json.data);
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
        <div className="w-6 h-6 border-2 border-[#7b2ff2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEdit = existingAd && existingAd.status !== 'REJECTED';
  const isRejected = existingAd?.status === 'REJECTED';

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#e8e0f0] mb-2">
        {isEdit ? 'Editar anuncio' : 'Crear anuncio'}
      </h1>

      {isRejected && existingAd?.rejectionReason && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm font-medium mb-1">
            Anuncio rechazado
          </p>
          <p className="text-red-300 text-sm">
            {existingAd.rejectionReason}
          </p>
          <p className="text-[#a090b8] text-xs mt-2">
            Corrige los problemas y vuelve a enviar.
          </p>
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
        {/* Title */}
        <div>
          <label className="block text-sm text-[#a090b8] mb-1.5">
            Titulo
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            className="w-full bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg px-4 py-2.5 text-[#e8e0f0] placeholder-[#6b5a80] focus:border-[#7b2ff2] focus:outline-none transition-colors"
            placeholder="Ej: Lectura de Tarot profesional en Bogota"
          />
          <p className="text-xs text-[#6b5a80] mt-1 text-right">
            {title.length}/100
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-[#a090b8] mb-1.5">
            Descripcion
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            required
            rows={6}
            className="w-full bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg px-4 py-2.5 text-[#e8e0f0] placeholder-[#6b5a80] focus:border-[#7b2ff2] focus:outline-none transition-colors resize-y"
            placeholder="Describe tus servicios, experiencia y lo que ofreces..."
          />
          <p className="text-xs text-[#6b5a80] mt-1 text-right">
            {description.length}/2000
          </p>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm text-[#a090b8] mb-1.5">
            Imagen (opcional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#2a1a4e]">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
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
              className="px-4 py-2 bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg text-sm text-[#a090b8] hover:border-[#7b2ff2] transition-colors"
            >
              {uploading ? 'Subiendo...' : imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
          </div>
          <p className="text-xs text-[#6b5a80] mt-1">
            JPEG, PNG, WebP o GIF. Maximo 5 MB.
          </p>
        </div>

        {/* Professional type */}
        <div>
          <label className="block text-sm text-[#a090b8] mb-1.5">
            Tipo de profesional
          </label>
          <select
            value={professionalType}
            onChange={(e) => setProfessionalType(e.target.value)}
            required
            className="w-full bg-[#1a0e2e] border border-[#2a1a4e] rounded-lg px-4 py-2.5 text-[#e8e0f0] focus:border-[#7b2ff2] focus:outline-none transition-colors appearance-none"
          >
            <option value="" className="bg-[#1a0e2e]">
              Selecciona...
            </option>
            {PROFESSIONAL_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#1a0e2e]">
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm text-[#a090b8] mb-2">
            Servicios
          </label>
          {serviceOptions.length === 0 ? (
            <p className="text-xs text-[#6b5a80]">Cargando servicios...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((svc) => (
                <label
                  key={svc.slug}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${
                    selectedServices.includes(svc.slug)
                      ? 'bg-[#7b2ff2]/20 border-[#7b2ff2] text-[#e8e0f0]'
                      : 'bg-[#1a0e2e] border-[#2a1a4e] text-[#a090b8] hover:border-[#7b2ff2]/50'
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
          <label className="block text-sm text-[#a090b8] mb-2">
            Tradiciones
          </label>
          {traditionOptions.length === 0 ? (
            <p className="text-xs text-[#6b5a80]">Cargando tradiciones...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {traditionOptions.map((trad) => (
                <label
                  key={trad.slug}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${
                    selectedTraditions.includes(trad.slug)
                      ? 'bg-[#7b2ff2]/20 border-[#7b2ff2] text-[#e8e0f0]'
                      : 'bg-[#1a0e2e] border-[#2a1a4e] text-[#a090b8] hover:border-[#7b2ff2]/50'
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
            className="w-full py-3 bg-[#d4af37] text-[#0d0015] font-medium rounded-lg hover:bg-[#e8c54a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Enviando...'
              : isEdit
                ? 'Guardar cambios'
                : isRejected
                  ? 'Reenviar anuncio'
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
    </div>
  );
}
