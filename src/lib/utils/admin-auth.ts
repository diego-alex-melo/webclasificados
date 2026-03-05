import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';

/**
 * Check if an email is in the ADMIN_EMAILS environment variable.
 */
export function isAdmin(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS ?? '';
  const list = adminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase().trim());
}

/**
 * Extract JWT from Authorization header, verify, and check admin status.
 * Throws 401 if not authenticated, 403 if not admin.
 */
export async function requireAdmin(
  request: Request,
): Promise<{ advertiserId: string; email: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Token de autenticación requerido', 401);
  }

  const token = authHeader.slice(7);
  const advertiser = await getAdvertiserFromToken(token);

  if (!isAdmin(advertiser.email)) {
    throw new AuthError('Acceso de administrador requerido', 403);
  }

  return { advertiserId: advertiser.id, email: advertiser.email };
}
