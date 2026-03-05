import { prisma } from '@/lib/db/prisma';
import type { BlogPost } from '@/generated/prisma';

const DEFAULT_PAGE_SIZE = 12;

interface PaginatedPosts {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function paginate(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 50);
  return {
    skip: (safePage - 1) * safeSize,
    take: safeSize,
    page: safePage,
    pageSize: safeSize,
  };
}

/**
 * Get published blog posts with pagination.
 */
export async function getPublishedPosts(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedPosts> {
  const p = paginate(page, pageSize);

  const where = { publishedAt: { not: null } } as const;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: p.skip,
      take: p.take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

/**
 * Get a single blog post by slug. Returns null if not found or unpublished.
 */
export async function getPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  return prisma.blogPost.findFirst({
    where: {
      slug,
      publishedAt: { not: null },
    },
  });
}

/**
 * Get published blog posts filtered by category.
 */
export async function getPostsByCategory(
  category: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedPosts> {
  const p = paginate(page, pageSize);

  const where = {
    category,
    publishedAt: { not: null },
  } as const;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: p.skip,
      take: p.take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

/**
 * Get all distinct categories from published posts.
 */
export async function getCategories(): Promise<string[]> {
  const results = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return results.map((r) => r.category);
}
