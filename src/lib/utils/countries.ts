export const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  CO: { name: 'Colombia', flag: '\u{1F1E8}\u{1F1F4}' },
  MX: { name: 'México', flag: '\u{1F1F2}\u{1F1FD}' },
  US: { name: 'Estados Unidos', flag: '\u{1F1FA}\u{1F1F8}' },
  CA: { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  PR: { name: 'Puerto Rico', flag: '\u{1F1F5}\u{1F1F7}' },
  ES: { name: 'España', flag: '\u{1F1EA}\u{1F1F8}' },
  PE: { name: 'Perú', flag: '\u{1F1F5}\u{1F1EA}' },
  CL: { name: 'Chile', flag: '\u{1F1E8}\u{1F1F1}' },
  AR: { name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  EC: { name: 'Ecuador', flag: '\u{1F1EA}\u{1F1E8}' },
  VE: { name: 'Venezuela', flag: '\u{1F1FB}\u{1F1EA}' },
  PA: { name: 'Panamá', flag: '\u{1F1F5}\u{1F1E6}' },
  CR: { name: 'Costa Rica', flag: '\u{1F1E8}\u{1F1F7}' },
  GT: { name: 'Guatemala', flag: '\u{1F1EC}\u{1F1F9}' },
  SV: { name: 'El Salvador', flag: '\u{1F1F8}\u{1F1FB}' },
  HN: { name: 'Honduras', flag: '\u{1F1ED}\u{1F1F3}' },
  NI: { name: 'Nicaragua', flag: '\u{1F1F3}\u{1F1EE}' },
  BO: { name: 'Bolivia', flag: '\u{1F1E7}\u{1F1F4}' },
  PY: { name: 'Paraguay', flag: '\u{1F1F5}\u{1F1FE}' },
  UY: { name: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}' },
  DO: { name: 'República Dominicana', flag: '\u{1F1E9}\u{1F1F4}' },
};

export function getCountryName(code: string): string {
  return COUNTRY_MAP[code.toUpperCase()]?.name ?? code;
}

export function getCountryFlag(code: string): string {
  return COUNTRY_MAP[code.toUpperCase()]?.flag ?? '';
}

export function getCountrySlug(code: string): string {
  return code.toLowerCase();
}

export function countryCodeFromSlug(slug: string): string {
  return slug.toUpperCase();
}

/** Map country code → hreflang locale (BCP 47). */
const HREFLANG_MAP: Record<string, string> = {
  CO: 'es-CO', MX: 'es-MX', US: 'es-US', CA: 'es-CA', PR: 'es-PR',
  ES: 'es-ES', PE: 'es-PE', CL: 'es-CL', AR: 'es-AR', EC: 'es-EC',
  VE: 'es-VE', PA: 'es-PA', CR: 'es-CR', GT: 'es-GT', SV: 'es-SV',
  HN: 'es-HN', NI: 'es-NI', BO: 'es-BO', PY: 'es-PY', UY: 'es-UY',
  DO: 'es-DO',
};

/**
 * Generate hreflang alternates for a path pattern.
 * @param pathTemplate - e.g. "/{country}" or "/{country}/amarres-y-alejamientos"
 * @returns Record<locale, url> for Next.js alternates.languages
 */
export function generateHreflangs(
  pathTemplate: string,
  baseUrl: string,
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const [code, locale] of Object.entries(HREFLANG_MAP)) {
    const path = pathTemplate.replace('{country}', code.toLowerCase());
    languages[locale] = `${baseUrl}${path}`;
  }
  languages['x-default'] = `${baseUrl}${pathTemplate.replace('{country}', 'co')}`;
  return languages;
}
