import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPosts, getCategories } from '@/lib/services/blog-service';
import { generateOgTags } from '@/lib/utils/seo-utils';
import Breadcrumbs from '@/components/Breadcrumbs';
import Pagination from '@/components/Pagination';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://webclasificados.com';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata(): Promise<Metadata> {
  return generateOgTags(
    'Blog — Oraciones, Guías y Consejos Esotéricos',
    'Artículos sobre oraciones, guías espirituales, rituales y consejos de profesionales esotéricos en Latinoamérica.',
    undefined,
    `${BASE_URL}/blog`,
  );
}

export default async function BlogListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const categoryFilter = typeof sp.category === 'string' ? sp.category : '';

  const categories = await getCategories();

  // Fetch posts — filtered by category if specified
  const { posts, total, totalPages } = categoryFilter
    ? await (async () => {
        const { getPostsByCategory } = await import(
          '@/lib/services/blog-service'
        );
        return getPostsByCategory(categoryFilter, page, 12);
      })()
    : await getPublishedPosts(page, 12);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog' },
        ]}
      />

      <h1 className="mb-2 text-3xl font-bold">Blog</h1>
      <p className="mb-8 text-text-secondary">
        Oraciones, guías espirituales y consejos de profesionales esotéricos.
      </p>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !categoryFilter
                ? 'bg-accent-purple/20 text-accent-purple-light'
                : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${encodeURIComponent(cat)}`}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                categoryFilter === cat
                  ? 'bg-accent-purple/20 text-accent-purple-light'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {/* Posts grid */}
      {posts.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="card-gradient flex flex-col overflow-hidden rounded-xl transition-all"
              >
                <Link href={`/blog/${post.slug}`} className="flex flex-1 flex-col p-6">
                  <span className="mb-2 self-start rounded-full bg-accent-gold/10 px-2.5 py-0.5 text-xs font-medium text-accent-gold">
                    {post.category}
                  </span>
                  <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-text-primary">
                    {post.title}
                  </h2>
                  <p className="mb-4 line-clamp-3 flex-1 text-sm text-text-secondary">
                    {post.metaDescription ?? post.content.slice(0, 160)}
                  </p>
                  {post.publishedAt && (
                    <time className="text-xs text-text-secondary">
                      {new Date(post.publishedAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                </Link>
              </article>
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/blog"
            searchParams={categoryFilter ? { category: categoryFilter } : {}}
          />
        </>
      ) : (
        <div className="rounded-xl bg-bg-card p-12 text-center">
          <p className="mb-2 text-lg font-semibold">Aún no hay artículos</p>
          <p className="text-sm text-text-secondary">
            Pronto publicaremos contenido sobre oraciones, guías y consejos
            espirituales.
          </p>
        </div>
      )}

      <p className="mt-4 text-sm text-text-secondary">
        {total} artículo{total !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
