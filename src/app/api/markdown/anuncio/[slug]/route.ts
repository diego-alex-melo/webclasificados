import { NextRequest } from 'next/server';
import { getAdBySlug, AdError } from '@/lib/services/ad-service';
import { renderAdMarkdown } from '@/lib/services/markdown-renderer';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ad = await getAdBySlug(slug);

    if (ad.status !== 'ACTIVE') {
      return new Response('# Anuncio no disponible\n', {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }

    const markdown = renderAdMarkdown(ad);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    if (error instanceof AdError && error.statusCode === 404) {
      return new Response('# Anuncio no encontrado\n', {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }
    return new Response('# Error interno\n', {
      status: 500,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
}
