import type { Metadata } from 'next';
import Link from 'next/link';
import {
  generateOrganizationJsonLd,
  generateWebSiteJsonLd,
} from '@/lib/utils/seo-utils';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BrujosClassifieds — Servicios Esotéricos',
    template: '%s | BrujosClassifieds',
  },
  description:
    'Encuentra servicios esotéricos profesionales en Latinoamérica. Brujos, tarotistas, santeros, videntes y más. Publica tu anuncio gratis.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com'),
  openGraph: {
    siteName: 'BrujosClassifieds',
    locale: 'es_CO',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-default.png'],
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
        <meta name="google-site-verification" content="nmN9OmgSk8IVTTH6h4DW0f20P5Y9SwckSIb1ZyvJSUs" />
        <meta name="theme-color" content="#140a26" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-BTM6MNLXKD" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-BTM6MNLXKD');`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="alternate" type="application/rss+xml" title="BrujosClassifieds" href="/feed.xml" />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vrs15l7vo3");`,
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
          BrujosClassifieds
        </Link>
        <ul className="flex items-center gap-2 sm:gap-6 text-sm">
          <li className="hidden sm:block">
            <Link href="/" className="text-text-secondary transition-colors hover:text-accent-gold">
              Inicio
            </Link>
          </li>
          <li>
            <Link
              href="/buscar"
              className="text-text-secondary transition-colors hover:text-accent-gold"
            >
              <span className="hidden sm:inline">Buscar</span>
              <svg className="sm:hidden w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </Link>
          </li>
          <li>
            <Link
              href="/favoritos"
              className="text-text-secondary transition-colors hover:text-accent-gold"
            >
              <span className="hidden sm:inline">Favoritos</span>
              <svg className="sm:hidden w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/anuncio?new=1"
              className="glow-gold inline-flex items-center gap-1.5 rounded-full bg-accent-gold/10 px-3 sm:px-4 py-1.5 text-accent-gold transition-all hover:bg-accent-gold/20"
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-gradient-gold mb-2 font-bold">BrujosClassifieds</p>
            <p className="text-sm text-text-secondary">
              Plataforma de servicios esotéricos profesionales para Latinoamérica.
            </p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text-primary">Categorías</p>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>
                <Link href="/buscar?service=amarres-y-alejamientos" prefetch={false} className="hover:text-accent-gold">
                  Amarres y Alejamientos
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=prosperidad-y-dinero" prefetch={false} className="hover:text-accent-gold">
                  Prosperidad y Dinero
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=limpiezas-y-sanacion" prefetch={false} className="hover:text-accent-gold">
                  Limpiezas y Sanación
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=tarot-y-lecturas" prefetch={false} className="hover:text-accent-gold">
                  Tarot y Lecturas
                </Link>
              </li>
              <li>
                <Link href="/buscar?service=tiendas-esotericas" prefetch={false} className="hover:text-accent-gold">
                  Tiendas Esotéricas
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
                <Link href="/guia" className="hover:text-accent-gold">
                  Guia del Anunciante
                </Link>
              </li>
              <li>
                <Link href="/ayuda" className="hover:text-accent-gold">
                  Ayuda y FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-accent-purple/10 pt-6 text-center text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} BrujosClassifieds. Todos los derechos reservados.</p>
          <p className="mt-1">
            BrujosClassifieds no se hace responsable de los servicios ofrecidos por los anunciantes.
          </p>
        </div>
      </div>
    </footer>
  );
}
