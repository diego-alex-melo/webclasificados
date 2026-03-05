import { createHash } from 'crypto';

export function contentHash(title: string, description: string, whatsapp: string): string {
  const normalized = `${title.toLowerCase().trim()}|${description.toLowerCase().trim()}|${whatsapp.trim()}`;
  return createHash('sha256').update(normalized).digest('hex');
}
