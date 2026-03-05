import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

export default function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  function buildUrl(page: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(page) });
    return `${baseUrl}?${params.toString()}`;
  }

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="rounded-lg border border-accent-purple/20 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent-purple/40 hover:text-text-primary"
        >
          Anterior
        </Link>
      )}
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e${i}`} className="px-2 text-text-secondary">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              p === currentPage
                ? 'bg-accent-purple text-white'
                : 'border border-accent-purple/20 text-text-secondary hover:border-accent-purple/40 hover:text-text-primary'
            }`}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="rounded-lg border border-accent-purple/20 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent-purple/40 hover:text-text-primary"
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
