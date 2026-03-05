import type { Metadata } from 'next';
import Link from 'next/link';
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from '@/lib/utils/seo-utils';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'WebClasificados — Servicios Esotéricos',
    template: '%s | WebClasificados',
  },
  description:
    'Encuentra servicios esotéricos profesionales en Latinoamérica. Brujos, tarotistas, santeros, videntes y más. Publica tu anuncio gratis.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://webclasificados.com'),
  openGraph: {
    siteName: 'WebClasificados',
    locale: 'es_CO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#1a0a2e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="alternate" type="application/rss+xml" title="WebClasificados" href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteJsonLd()),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')});}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Header />
        <main className="min-h-[calc(100vh-160px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-accent-purple/15 bg-bg-primary/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-gradient-gold text-xl font-bold tracking-tight">
          WebClasificados
        </Link>
        <ul className="flex items-center gap-6 text-sm">
          <li>
            <Link href="/" className="text-text-secondary transition-colors hover:text-accent-gold">
              Inicio
            </Link>
          </li>
          <li>
            <Link
              href="/buscar"
              className="text-text-secondary transition-colors hover:text-accent-gold"
            >
              Buscar
            </Link>
          </li>
          <li>
            <Link
              href="/favoritos"
              className="text-text-secondary transition-colors hover:text-accent-gold"
            >
              Favoritos
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="glow-gold inline-flex items-center gap-1.5 rounded-full bg-accent-gold/10 px-4 py-1.5 text-accent-gold transition-all hover:bg-accent-gold/20"
            >
              Publicar
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-accent-purple/10 bg-bg-secondary/50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-gradient-gold mb-2 font-bold">WebClasificados</p>
            <p className="text-sm text-text-secondary">
              Plataforma de servicios esotéricos profesionales para Latinoamérica.
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Categorías</p>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>
                <Link href="/buscar?service=amor-y-relaciones" className="hover:text-accent-gold">
                  Amor y Relaciones
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=proteccion-y-limpieza" className="hover:text-accent-gold">
                  Protección y Limpieza
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=lectura-y-adivinacion" className="hover:text-accent-gold">
                  Lectura y Adivinación
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Legal</p>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>
                <Link href="/legal/terminos" className="hover:text-accent-gold">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-accent-gold">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/responsabilidad" className="hover:text-accent-gold">
                  Descargo de Responsabilidad
                </Link>
              </li>
              <li>
                <Link href="/legal/faq" className="hover:text-accent-gold">
                  Preguntas Frecuentes
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-accent-purple/10 pt-6 text-center text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} WebClasificados. Todos los derechos reservados.</p>
          <p className="mt-1">
            WebClasificados no se hace responsable de los servicios ofrecidos por los anunciantes.
          </p>
        </div>
      </div>
    </footer>
  );
}
