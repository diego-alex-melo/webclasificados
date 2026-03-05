export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export function generateAdSlug(title: string, id: string): string {
  const base = generateSlug(title);
  const shortId = id.slice(0, 8);
  return `${base}-${shortId}`;
}
