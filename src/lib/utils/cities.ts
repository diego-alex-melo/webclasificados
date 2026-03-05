/**
 * City definitions for programmatic SEO pages.
 * Used to generate [professional]-en-[city] landing pages.
 */

export interface City {
  name: string;
  slug: string;
}

export const CITIES: Record<string, City[]> = {
  CO: [
    { name: 'Bogotá', slug: 'bogota' },
    { name: 'Medellín', slug: 'medellin' },
    { name: 'Cali', slug: 'cali' },
    { name: 'Barranquilla', slug: 'barranquilla' },
    { name: 'Cartagena', slug: 'cartagena' },
    { name: 'Bucaramanga', slug: 'bucaramanga' },
    { name: 'Pereira', slug: 'pereira' },
    { name: 'Manizales', slug: 'manizales' },
    { name: 'Santa Marta', slug: 'santa-marta' },
    { name: 'Cúcuta', slug: 'cucuta' },
    { name: 'Ibagué', slug: 'ibague' },
    { name: 'Villavicencio', slug: 'villavicencio' },
    { name: 'Pasto', slug: 'pasto' },
    { name: 'Armenia', slug: 'armenia' },
    { name: 'Neiva', slug: 'neiva' },
  ],
  MX: [
    { name: 'Ciudad de México', slug: 'cdmx' },
    { name: 'Guadalajara', slug: 'guadalajara' },
    { name: 'Monterrey', slug: 'monterrey' },
    { name: 'Puebla', slug: 'puebla' },
    { name: 'Tijuana', slug: 'tijuana' },
  ],
};

/**
 * Maps professional type display names to URL-friendly slugs.
 * Key: professionalType value stored in DB (matches PROFESSIONAL_TYPES).
 * Value: plural slug for URL generation.
 */
export const PROFESSIONAL_SLUGS: Record<string, string> = {
  'Brujo/a': 'brujos',
  'Chamán': 'chamanes',
  'Santero/a': 'santeros',
  'Tarotista': 'tarotistas',
  'Vidente': 'videntes',
  'Médium': 'mediums',
  'Astrólogo/a': 'astrologos',
  'Curandero/a': 'curanderos',
};

/**
 * Reverse lookup: slug -> professional type display name.
 */
export const SLUG_TO_PROFESSIONAL: Record<string, string> = Object.fromEntries(
  Object.entries(PROFESSIONAL_SLUGS).map(([name, slug]) => [slug, name]),
);

/**
 * Human-readable plural labels for professional type slugs (Spanish).
 */
export const PROFESSIONAL_LABELS: Record<string, string> = {
  brujos: 'Brujos',
  chamanes: 'Chamanes',
  santeros: 'Santeros',
  tarotistas: 'Tarotistas',
  videntes: 'Videntes',
  mediums: 'Médiums',
  astrologos: 'Astrólogos',
  curanderos: 'Curanderos',
};

/**
 * Find a city by slug across all countries. Returns city + country code.
 */
export function findCityBySlug(
  slug: string,
): { city: City; countryCode: string } | null {
  for (const [code, cities] of Object.entries(CITIES)) {
    const city = cities.find((c) => c.slug === slug);
    if (city) return { city, countryCode: code };
  }
  return null;
}

/**
 * Get all city slugs (flattened across all countries).
 */
export function getAllCitySlugs(): string[] {
  return Object.values(CITIES).flatMap((cities) =>
    cities.map((c) => c.slug),
  );
}
