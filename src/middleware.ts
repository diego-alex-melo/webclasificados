import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept') || '';

  // Only intercept for markdown-requesting clients on public content pages
  if (accept.includes('text/markdown')) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/markdown' + url.pathname;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/anuncio/:slug*',
    '/:country(co|mx|us|es|pe|cl|ar|ec|ve|pa|cr|gt|sv|hn|ni|bo|py|uy|do)/:path*',
    '/buscar',
    '/blog/:slug*',
  ],
};
