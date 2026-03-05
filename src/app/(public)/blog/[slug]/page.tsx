import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug } from '@/lib/services/blog-service';
import {
  generateOgTags,
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
} from '@/lib/utils/seo-utils';
import Breadcrumbs from '@/components/Breadcrumbs';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Artículo no encontrado' };

  const description =
    post.metaDescription ?? post.content.slice(0, 160);

  return {
    ...generateOgTags(
      post.metaTitle ?? post.title,
      description,
      undefined,
      `${BASE_URL}/blog/${post.slug}`,
    ),
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
  };
}

/**
 * Convert basic markdown to HTML.
 * Handles: headings (##, ###), bold (**), italic (*), links, paragraphs.
 */
function markdownToHtml(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="mt-6 mb-3 text-lg font-semibold">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-8 mb-4 text-xl font-bold">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent-gold underline hover:text-accent-gold/80" rel="noopener">$1</a>')
    // Paragraphs: wrap lines that aren't already HTML tags
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return trimmed;
      }
      return `<p class="mb-4 leading-relaxed text-text-secondary">${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const contentHtml = markdownToHtml(post.content);

  const breadcrumbItems = [
    { name: 'Inicio', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: post.title, url: `${BASE_URL}/blog/${post.slug}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      />

      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateArticleJsonLd(post)),
        }}
      />

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbJsonLd(breadcrumbItems)),
        }}
      />

      {/* Header */}
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full bg-accent-gold/10 px-3 py-1 text-sm font-medium text-accent-gold">
          {post.category}
        </span>
        <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">
          {post.title}
        </h1>
        {post.publishedAt && (
          <time className="text-sm text-text-secondary">
            {new Date(post.publishedAt).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}
      </header>

      {/* Content */}
      <article
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Related ads CTA */}
      <section className="mt-12 rounded-xl bg-bg-card p-8 text-center">
        <h2 className="mb-2 text-xl font-bold">
          Encuentra profesionales esotéricos
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          Conecta con brujos, tarotistas, santeros y videntes verificados en tu
          ciudad.
        </p>
        <Link
          href="/buscar"
          className="glow-gold inline-flex items-center gap-1.5 rounded-full bg-accent-gold/10 px-6 py-2.5 text-sm font-medium text-accent-gold transition-all hover:bg-accent-gold/20"
        >
          Buscar profesionales
        </Link>
      </section>
    </div>
  );
}
