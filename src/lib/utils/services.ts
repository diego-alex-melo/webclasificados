/**
 * Service category definitions with display metadata.
 * These map to the Service model slugs in the database.
 */
export const SERVICE_CATEGORIES = [
  {
    slug: 'amor-y-relaciones',
    name: 'Amor y Relaciones',
    emoji: '\u{1F52E}',
    description: 'Amarres, endulzamientos, recuperar pareja, limpiezas de amor',
  },
  {
    slug: 'proteccion-y-limpieza',
    name: 'Protección y Limpieza',
    emoji: '\u{1F9FF}',
    description: 'Limpiezas espirituales, protección contra envidias, baños de descarga',
  },
  {
    slug: 'prosperidad-y-dinero',
    name: 'Prosperidad y Dinero',
    emoji: '\u{2728}',
    description: 'Rituales de abundancia, apertura de caminos, suerte en negocios',
  },
  {
    slug: 'salud-y-bienestar',
    name: 'Salud y Bienestar',
    emoji: '\u{1F33F}',
    description: 'Sanación espiritual, equilibrio energético, medicina tradicional',
  },
  {
    slug: 'lectura-y-adivinacion',
    name: 'Lectura y Adivinación',
    emoji: '\u{1F0CF}',
    description: 'Tarot, lectura de cartas, adivinación, consultas espirituales',
  },
  {
    slug: 'trabajos-especiales',
    name: 'Trabajos Especiales',
    emoji: '\u{1F319}',
    description: 'Trabajos a medida, consultas personalizadas, casos difíciles',
  },
] as const;

export function getServiceBySlug(slug: string) {
  return SERVICE_CATEGORIES.find((s) => s.slug === slug);
}
