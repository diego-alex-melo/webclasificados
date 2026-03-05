import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WebClasificados — Servicios Esotéricos',
    short_name: 'WebClasificados',
    description: 'Encuentra servicios esotéricos profesionales en Latinoamérica',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0015',
    theme_color: '#1a0a2e',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['lifestyle', 'social'],
    lang: 'es',
    dir: 'ltr',
  };
}
