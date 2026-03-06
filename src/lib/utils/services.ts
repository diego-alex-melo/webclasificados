/**
 * Service category definitions with display metadata.
 * These map to the Service model slugs in the database.
 */
export const SERVICE_CATEGORIES = [
  {
    slug: 'amarres-y-alejamientos',
    name: 'Amarres y Alejamientos',
    emoji: '\u{1F52E}',
    description: 'Amarres de amor, endulzamientos, retornos de pareja, alejamientos',
  },
  {
    slug: 'prosperidad-y-dinero',
    name: 'Prosperidad y Dinero',
    emoji: '\u{2728}',
    description: 'Rituales de abundancia, apertura de caminos, suerte en negocios',
  },
  {
    slug: 'limpiezas-y-sanacion',
    name: 'Limpiezas y Sanación',
    emoji: '\u{1F33F}',
    description: 'Limpiezas espirituales, sanación energética, protección, baños de descarga',
  },
  {
    slug: 'tarot-y-lecturas',
    name: 'Tarot y Lecturas',
    emoji: '\u{1F0CF}',
    description: 'Tarot, lectura de cartas, adivinación, consultas espirituales',
  },
  {
    slug: 'tiendas-esotericas',
    name: 'Tiendas Esotéricas',
    emoji: '\u{1F56F}',
    description: 'Velas, hierbas, amuletos, inciensos, cristales y productos esotéricos',
  },
] as const;

export function getServiceBySlug(slug: string) {
  return SERVICE_CATEGORIES.find((s) => s.slug === slug);
}
