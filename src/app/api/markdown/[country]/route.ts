import { NextRequest } from 'next/server';
import { getAdsByCountry } from '@/lib/services/ad-service';
import { renderCategoryMarkdown, type MarkdownAd } from '@/lib/services/markdown-renderer';
import { getCountryName, countryCodeFromSlug } from '@/lib/utils/countries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ country: string }> },
) {
  try {
    const { country } = await params;
    const countryCode = countryCodeFromSlug(country);
    const countryName = getCountryName(countryCode);

    const result = await getAdsByCountry(countryCode, 1, 50);
    const markdown = renderCategoryMarkdown(result.ads as unknown as MarkdownAd[], '', countryName);

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
