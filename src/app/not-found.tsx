import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="mb-4 text-6xl">&#x1F52E;</p>
      <h1 className="mb-3 text-3xl font-bold">Página no encontrada</h1>
      <p className="mb-8 text-text-secondary">
        La página que buscas no existe o fue movida. Intenta buscar lo que necesitas.
      </p>

      <div className="mx-auto mb-10 max-w-md">
        <SearchBar />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Categorías populares</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {SERVICE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/buscar?service=${cat.slug}`}
              className="rounded-full bg-bg-card px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            >
              {cat.emoji} {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/"
        className="glow-gold inline-block rounded-full bg-accent-gold px-6 py-2 text-sm font-medium text-bg-primary transition-all hover:bg-accent-gold-light"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
