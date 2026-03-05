import { NextRequest } from 'next/server';
import { searchAds } from '@/lib/services/ad-service';
import { renderSearchMarkdown, type MarkdownAd } from '@/lib/services/markdown-renderer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q') ?? '';
    const countryCode = searchParams.get('country') ?? undefined;
    const serviceSlug = searchParams.get('service') ?? undefined;
    const traditionSlug = searchParams.get('tradition') ?? undefined;
    const professionalType = searchParams.get('type') ?? undefined;

    const filters = { countryCode, serviceSlug, traditionSlug, professionalType };

    const result = await searchAds(query, filters, 1, 50);
    const markdown = renderSearchMarkdown(result.ads as unknown as MarkdownAd[], query, filters, result.total);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
      },
    });
  } catch {
    return new Response('# Error interno\n', {
      status: 500,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
}
