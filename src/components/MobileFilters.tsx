'use client';

import { useState } from 'react';
import CountryFlag from '@/components/CountryFlag';

interface MobileFiltersProps {
  countries: Array<{ code: string; name: string }>;
  services: ReadonlyArray<{ readonly slug: string; readonly name: string; readonly emoji: string; readonly description?: string }>;
  traditions: Array<{ slug: string; name: string }>;
  paginationParams: Record<string, string>;
  countryFilter: string;
  serviceFilter: string;
  traditionFilter: string;
  hasActiveFilters: boolean;
}

function buildFilterUrl(params: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val && key !== 'page') sp.set(key, val);
  }
  return `/buscar?${sp.toString()}`;
}

export default function MobileFilters({
  countries,
  services,
  traditions,
  paginationParams,
  countryFilter,
  serviceFilter,
  traditionFilter,
  hasActiveFilters,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [countryFilter, serviceFilter, traditionFilter].filter(Boolean).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors w-full justify-between ${
          hasActiveFilters
            ? 'border-accent-purple/40 bg-accent-purple/10 text-accent-purple-light'
            : 'border-accent-purple/20 bg-bg-card text-text-secondary'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filtros
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent-purple text-white text-xs font-medium">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl bg-bg-secondary/40 p-4 space-y-5">
          {/* Countries — horizontal scroll */}
          <div>
            <h3 className="mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">Pa&iacute;s</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {countries.map(({ code, name }) => (
                <a
                  key={code}
                  href={buildFilterUrl({ ...paginationParams, country: code })}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    countryFilter.toUpperCase() === code
                      ? 'bg-accent-purple/20 text-accent-purple-light'
                      : 'bg-bg-card text-text-secondary'
                  }`}
                >
                  <CountryFlag code={code} size={14} /> {name}
                </a>
              ))}
            </div>
          </div>

          {/* Services — horizontal scroll */}
          <div>
            <h3 className="mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">Servicio</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {services.map((s) => (
                <a
                  key={s.slug}
                  href={buildFilterUrl({ ...paginationParams, service: s.slug })}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
                    serviceFilter === s.slug
                      ? 'bg-accent-purple/20 text-accent-purple-light'
                      : 'bg-bg-card text-text-secondary'
                  }`}
                >
                  {s.emoji} {s.name}
                </a>
              ))}
            </div>
          </div>

          {/* Traditions — horizontal scroll */}
          {traditions.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wide">Especialidad</h3>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {traditions.map((t) => (
                  <a
                    key={t.slug}
                    href={buildFilterUrl({ ...paginationParams, tradition: t.slug })}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                      traditionFilter === t.slug
                        ? 'bg-accent-purple/20 text-accent-purple-light'
                        : 'bg-bg-card text-text-secondary'
                    }`}
                  >
                    {t.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
