import type { MetadataRoute } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/oraculo', '/api', '/click'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
