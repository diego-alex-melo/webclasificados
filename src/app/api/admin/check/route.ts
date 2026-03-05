import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { isAdmin } from '@/lib/utils/admin-auth';

import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    return NextResponse.json({
      data: { isAdmin: isAdmin(advertiser.email) },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('GET /api/admin/check error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
