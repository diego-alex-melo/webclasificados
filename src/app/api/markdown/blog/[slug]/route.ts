import { NextRequest } from 'next/server';
import { getPostBySlug } from '@/lib/services/blog-service';
import { renderBlogMarkdown } from '@/lib/services/markdown-renderer';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return new Response('# Articulo no encontrado\n', {
        status: 404,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      });
    }

    const markdown = renderBlogMarkdown(post);

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
