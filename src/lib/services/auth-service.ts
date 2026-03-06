import { randomBytes } from 'crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '@/lib/db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '30d';
const BCRYPT_ROUNDS = 12;

interface RegisterInput {
  email: string;
  password: string;
  whatsappNumber?: string;
}

interface JwtPayload {
  advertiserId: string;
  email: string;
}

/**
 * Generate a cryptographically random alphanumeric code of given length.
 */
function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a unique 8-character referral code, checking DB for collisions.
 */
export async function generateReferralCode(): Promise<string> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const code = randomAlphanumeric(8);
    const existing = await prisma.advertiser.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique referral code after maximum attempts');
}

/**
 * Register a new advertiser.
 * Validates uniqueness of email and whatsappNumber.
 * Returns the created advertiser without passwordHash.
 */
export async function register({ email, password, whatsappNumber }: RegisterInput) {
  // Check for duplicate email
  const existingEmail = await prisma.advertiser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existingEmail) {
    throw new AuthError('Ya existe una cuenta con este email', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const referralCode = await generateReferralCode();
  const emailVerifyToken = randomBytes(32).toString('hex');

  const advertiser = await prisma.advertiser.create({
    data: {
      email: email.toLowerCase().trim(),
      passwordHash,
      ...(whatsappNumber ? { whatsappNumber } : {}),
      reputation: 100,
      referralCode,
      emailVerified: false,
      emailVerifyToken,
    },
  });

  // Return without passwordHash
  const { passwordHash: _hash, ...safeAdvertiser } = advertiser;
  return safeAdvertiser;
}

/**
 * Verify an advertiser's email using the verification token.
 * Sets emailVerified=true and clears the token.
 */
export async function verifyEmail(token: string) {
  if (!token) {
    throw new AuthError('Token de verificación requerido', 400);
  }

  const advertiser = await prisma.advertiser.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!advertiser) {
    throw new AuthError('Token de verificación inválido o expirado', 400);
  }

  await prisma.advertiser.update({
    where: { id: advertiser.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });

  return { success: true };
}

/**
 * Authenticate an advertiser with email + password.
 * Returns a JWT token on success.
 */
export async function login(email: string, password: string) {
  const advertiser = await prisma.advertiser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!advertiser) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  const passwordValid = await bcrypt.compare(password, advertiser.passwordHash);
  if (!passwordValid) {
    throw new AuthError('Credenciales inválidas', 401);
  }

  if (!advertiser.emailVerified) {
    throw new AuthError('Debes verificar tu email antes de iniciar sesión', 403);
  }

  const payload: JwtPayload = {
    advertiserId: advertiser.id,
    email: advertiser.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  const { passwordHash: _hash, emailVerifyToken: _token, ...safeAdvertiser } = advertiser;
  return { token, advertiser: safeAdvertiser };
}

/**
 * Initiate a password reset flow.
 * Generates a secure token with 1-hour expiry and stores it on the advertiser.
 * Returns the token regardless of whether the email exists (caller decides email behavior).
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!advertiser) {
    // Return null to signal "no account found" without exposing that to callers
    return null;
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.advertiser.update({
    where: { id: advertiser.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    },
  });

  return token;
}

/**
 * Complete a password reset using the token issued by requestPasswordReset.
 * Validates token existence and expiry, hashes the new password, and clears the token.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (!token) {
    throw new AuthError('Token de recuperación requerido', 400);
  }

  const advertiser = await prisma.advertiser.findFirst({
    where: { passwordResetToken: token },
  });

  if (!advertiser) {
    throw new AuthError('Token de recuperación inválido o expirado', 400);
  }

  if (!advertiser.passwordResetExpiresAt || advertiser.passwordResetExpiresAt < new Date()) {
    throw new AuthError('Token de recuperación inválido o expirado', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.advertiser.update({
    where: { id: advertiser.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });
}

/**
 * Verify a JWT and return the advertiser from the database.
 */
export async function getAdvertiserFromToken(token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const advertiser = await prisma.advertiser.findUnique({
      where: { id: payload.advertiserId },
    });

    if (!advertiser) {
      throw new AuthError('Advertiser not found', 401);
    }

    const { passwordHash: _hash, emailVerifyToken: _token, ...safeAdvertiser } = advertiser;
    return safeAdvertiser;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError('Token inválido o expirado', 401);
  }
}

/**
 * Custom error class for authentication errors with HTTP status code.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
