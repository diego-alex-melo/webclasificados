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
    slug: 'consultas-y-lecturas',
    name: 'Consultas y Lecturas',
    emoji: '\u{1F0CF}',
    description: 'Tarot, lectura de cartas, adivinación, consultas espirituales',
  },
  {
    slug: 'limpiezas-y-sanacion',
    name: 'Limpiezas y Sanación',
    emoji: '\u{1F33F}',
    description: 'Limpiezas espirituales, sanación energética, baños de descarga',
  },
  {
    slug: 'proteccion',
    name: 'Protección',
    emoji: '\u{1F9FF}',
    description: 'Protección contra envidias, trabajos de defensa, resguardos espirituales',
  },
  {
    slug: 'prosperidad',
    name: 'Prosperidad',
    emoji: '\u{2728}',
    description: 'Rituales de abundancia, apertura de caminos, suerte en negocios',
  },
  {
    slug: 'trabajos-espirituales',
    name: 'Trabajos Espirituales',
    emoji: '\u{1F319}',
    description: 'Trabajos a medida, consultas personalizadas, casos difíciles',
  },
] as const;

export function getServiceBySlug(slug: string) {
  return SERVICE_CATEGORIES.find((s) => s.slug === slug);
}
