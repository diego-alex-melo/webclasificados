import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env vars before module import (vi.hoisted runs before vi.mock factories)
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

// Mock Prisma before importing auth-service
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    advertiser: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
    verify: vi.fn(),
  },
}));

import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { register, login, verifyEmail, AuthError } from './auth-service';

const mockPrisma = prisma as unknown as {
  advertiser: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe('auth-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // S01: Successful registration
  // =========================================================================
  describe('register', () => {
    it('creates advertiser with correct fields', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue(null);
      mockPrisma.advertiser.findFirst.mockResolvedValue(null);
      mockPrisma.advertiser.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 'uuid-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await register({
        email: 'test@example.com',
        password: 'securepass123',
        whatsappNumber: '+573001234567',
      });

      // Verify Prisma create was called with correct shape
      const createCall = mockPrisma.advertiser.create.mock.calls[0][0].data;
      expect(createCall.email).toBe('test@example.com');
      expect(createCall.passwordHash).toBe('$2a$12$hashedpassword');
      expect(createCall.whatsappNumber).toBe('+573001234567');
      expect(createCall.reputation).toBe(100);
      expect(createCall.emailVerified).toBe(false);
      expect(createCall.referralCode).toHaveLength(8);
      expect(createCall.emailVerifyToken).toBeTruthy();
      expect(createCall.emailVerifyToken.length).toBe(64); // 32 bytes hex

      // Result should NOT contain passwordHash
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('test@example.com');
    });

    it('stores whatsappNumber when provided', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue(null);
      mockPrisma.advertiser.findFirst.mockResolvedValue(null);
      mockPrisma.advertiser.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 'uuid-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      await register({
        email: 'co@example.com',
        password: 'securepass123',
        whatsappNumber: '+573001234567',
      });

      const createCall = mockPrisma.advertiser.create.mock.calls[0][0].data;
      expect(createCall.whatsappNumber).toBe('+573001234567');
    });

    it('returns error for duplicate email', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        register({
          email: 'taken@example.com',
          password: 'securepass123',
          whatsappNumber: '+573001234567',
        }),
      ).rejects.toThrow(AuthError);

      await expect(
        register({
          email: 'taken@example.com',
          password: 'securepass123',
          whatsappNumber: '+573001234567',
        }),
      ).rejects.toThrow('Ya existe una cuenta con este email');
    });

    it('allows registration without whatsappNumber', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue(null);
      mockPrisma.advertiser.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 'uuid-1',
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const result = await register({
        email: 'new@example.com',
        password: 'securepass123',
      });

      const createCall = mockPrisma.advertiser.create.mock.calls[0][0].data;
      expect(createCall.whatsappNumber).toBeUndefined();
      expect(result.email).toBe('new@example.com');
    });
  });

  // =========================================================================
  // S04: Login with valid credentials
  // =========================================================================
  describe('login', () => {
    it('returns JWT token for valid credentials and verified email', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$hashedpassword',
        countryCode: 'CO',
        reputation: 100,
        emailVerified: true,
        emailVerifyToken: null,
        whatsappNumber: '+573001234567',
        referralCode: 'ABC12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await login('test@example.com', 'securepass123');

      expect(result.token).toBe('mock.jwt.token');
      expect(result.advertiser).not.toHaveProperty('passwordHash');
      expect(result.advertiser.email).toBe('test@example.com');
      expect(jwt.sign).toHaveBeenCalledWith(
        { advertiserId: 'uuid-1', email: 'test@example.com' },
        expect.any(String),
        { expiresIn: '30d' },
      );
    });

    // S05: Login with unverified email returns 403
    it('returns error for unverified email', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$hashedpassword',
        emailVerified: false,
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      try {
        await login('test@example.com', 'securepass123');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).statusCode).toBe(403);
        expect((err as AuthError).message).toBe('Debes verificar tu email antes de iniciar sesión');
      }
    });

    // S06: Login with wrong password returns 401
    it('returns error for invalid credentials', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        passwordHash: '$2a$12$hashedpassword',
        emailVerified: true,
      });
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      try {
        await login('test@example.com', 'wrongpassword');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).statusCode).toBe(401);
      }
    });
  });

  // =========================================================================
  // S07: Email verification
  // =========================================================================
  describe('verifyEmail', () => {
    it('sets emailVerified to true and clears token', async () => {
      mockPrisma.advertiser.findFirst.mockResolvedValue({
        id: 'uuid-1',
        emailVerifyToken: 'valid-token-hex',
      });
      mockPrisma.advertiser.update.mockResolvedValue({});

      await verifyEmail('valid-token-hex');

      expect(mockPrisma.advertiser.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
        },
      });
    });

    // S08: Invalid token returns error
    it('returns error for invalid token', async () => {
      mockPrisma.advertiser.findFirst.mockResolvedValue(null);

      await expect(verifyEmail('invalid-token')).rejects.toThrow(
        'Token de verificación inválido o expirado',
      );
    });
  });
});
