import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { processAndUpload, ImageError } from '@/lib/services/image-service';
import { serverError } from '@/lib/services/error-logger';

import type { ApiResponse } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ── POST /api/ads/image — Upload image ──────────────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ url: string; hash: string }>>> {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    await getAdvertiserFromToken(token);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Archivo de imagen requerido' },
        { status: 400 },
      );
    }

    // Server-side size validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'La imagen no puede superar 5 MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processAndUpload(buffer, file.name, file.type);

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err instanceof ImageError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return serverError('/api/ads/image', 'POST', err);
  }
}
