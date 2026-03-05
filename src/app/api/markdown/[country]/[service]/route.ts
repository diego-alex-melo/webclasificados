import { NextRequest } from 'next/server';
import { getAdsByService } from '@/lib/services/ad-service';
import { renderCategoryMarkdown, type MarkdownAd } from '@/lib/services/markdown-renderer';
import { getCountryName, countryCodeFromSlug } from '@/lib/utils/countries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ country: string; service: string }> },
) {
  try {
    const { country, service } = await params;
    const countryCode = countryCodeFromSlug(country);
    const countryName = getCountryName(countryCode);

    const result = await getAdsByService(countryCode, service, 1, 50);

    // Capitalize service slug for display
    const serviceName = service
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const markdown = renderCategoryMarkdown(result.ads as unknown as MarkdownAd[], serviceName, countryName);

    return new Response(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response('# Error interno\n', {
      status: 500,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }
}
