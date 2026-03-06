const APP_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

// ── Types ───────────────────────────────────────────────────────────────────

export interface MarkdownAd {
  id: string;
  slug: string;
  title: string;
  description: string;
  professionalType: string;
  countryCode: string;
  websiteUrl: string | null;
  expiresAt: Date | null;
  services: { service: { name: string; slug: string } }[];
  traditions: { tradition: { name: string; slug: string } }[];
  advertiser: {
    id: string;
    reputation: number;
  };
}

interface MarkdownBlogPost {
  title: string;
  slug: string;
  content: string;
  category: string;
  publishedAt: Date | null;
}

interface SearchFilters {
  countryCode?: string;
  serviceSlug?: string;
  traditionSlug?: string;
  professionalType?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

// ── Ad detail ───────────────────────────────────────────────────────────────

export function renderAdMarkdown(ad: MarkdownAd): string {
  const services = ad.services.map((s) => s.service.name).join(', ');
  const traditions = ad.traditions.map((t) => t.tradition.name).join(', ');
  const countryCode = ad.countryCode.toUpperCase();

  const lines: string[] = [
    `# ${ad.title}`,
    '',
    `**Profesional:** ${ad.professionalType}`,
  ];

  if (services) {
    lines.push(`**Servicios:** ${services}`);
  }
  if (traditions) {
    lines.push(`**Tradiciones:** ${traditions}`);
  }
  lines.push(`**Pais:** ${countryCode}`);

  lines.push('', '## Descripcion', '', truncate(ad.description, 3000));

  lines.push('', '## Contacto', '');
  lines.push(
    `- [Contactar por WhatsApp](${APP_URL}/click/whatsapp/${ad.id})`,
  );
  if (ad.websiteUrl) {
    lines.push(`- [Visitar sitio web](${APP_URL}/click/web/${ad.id})`);
  }

  lines.push(
    '',
    '---',
    `*Publicado en [BrujosClassifieds](${APP_URL}) | Expira: ${formatDate(ad.expiresAt)}*`,
  );

  return lines.join('\n');
}

// ── Category / country listing ──────────────────────────────────────────────

export function renderCategoryMarkdown(
  ads: MarkdownAd[],
  category: string,
  country: string,
): string {
  const heading = category
    ? `# ${category} en ${country}`
    : `# Anuncios en ${country}`;

  const lines: string[] = [heading, '', `${ads.length} anuncios activos`, ''];

  if (ads.length === 0) {
    lines.push('No se encontraron anuncios.');
    return lines.join('\n');
  }

  lines.push('| Anuncio | Profesional | Contacto |');
  lines.push('|---------|-------------|----------|');

  for (const ad of ads) {
    const adUrl = `${APP_URL}/anuncio/${ad.slug}`;
    const clickUrl = `${APP_URL}/click/whatsapp/${ad.id}`;
    lines.push(
      `| [${truncate(ad.title, 60)}](${adUrl}) | ${ad.professionalType} | [WhatsApp](${clickUrl}) |`,
    );
  }

  lines.push(
    '',
    '---',
    `*[BrujosClassifieds](${APP_URL})*`,
  );

  return lines.join('\n');
}

// ── Search results ──────────────────────────────────────────────────────────

export function renderSearchMarkdown(
  ads: MarkdownAd[],
  query: string,
  filters: SearchFilters,
  total: number,
): string {
  const filterParts: string[] = [];
  if (filters.countryCode) filterParts.push(`pais: ${filters.countryCode}`);
  if (filters.serviceSlug) filterParts.push(`servicio: ${filters.serviceSlug}`);
  if (filters.traditionSlug)
    filterParts.push(`tradicion: ${filters.traditionSlug}`);
  if (filters.professionalType)
    filterParts.push(`profesional: ${filters.professionalType}`);

  const filterText = filterParts.length > 0 ? ` (${filterParts.join(', ')})` : '';

  const lines: string[] = [
    `# Resultados de busqueda: "${query}"${filterText}`,
    '',
    `${total} resultado${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`,
    '',
  ];

  if (ads.length === 0) {
    lines.push('No se encontraron anuncios.');
    return lines.join('\n');
  }

  lines.push('| Anuncio | Profesional | Contacto |');
  lines.push('|---------|-------------|----------|');

  for (const ad of ads) {
    const adUrl = `${APP_URL}/anuncio/${ad.slug}`;
    const clickUrl = `${APP_URL}/click/whatsapp/${ad.id}`;
    lines.push(
      `| [${truncate(ad.title, 60)}](${adUrl}) | ${ad.professionalType} | [WhatsApp](${clickUrl}) |`,
    );
  }

  lines.push(
    '',
    '---',
    `*[BrujosClassifieds](${APP_URL})*`,
  );

  return lines.join('\n');
}

// ── Blog post ───────────────────────────────────────────────────────────────

export function renderBlogMarkdown(post: MarkdownBlogPost): string {
  const lines: string[] = [
    `# ${post.title}`,
    '',
    truncate(post.content, 4000),
    '',
    '---',
    `*Publicado en [BrujosClassifieds Blog](${APP_URL}/blog) | ${formatDate(post.publishedAt)}*`,
  ];

  return lines.join('\n');
}
