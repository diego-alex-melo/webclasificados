import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    ad: {
      create: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    advertiser: {
      findUnique: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    tradition: {
      findMany: vi.fn(),
    },
    adService: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    adTradition: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// ── Mock spam pipeline ──────────────────────────────────────────────────────

vi.mock('@/lib/services/spam-pipeline', () => ({
  runSpamPipeline: vi.fn(),
}));

// ── Mock admin auth ─────────────────────────────────────────────────────────

vi.mock('@/lib/utils/admin-auth', () => ({
  isAdmin: vi.fn().mockReturnValue(false),
}));

import { prisma } from '@/lib/db/prisma';
import { runSpamPipeline } from '@/lib/services/spam-pipeline';
import { isAdmin } from '@/lib/utils/admin-auth';
import { createAd, bumpAd, renewAd, reactivateAd, getAdsByCountry, AdError } from './ad-service';

const mockPrisma = prisma as unknown as {
  ad: {
    create: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findUniqueOrThrow: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  advertiser: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  service: {
    findMany: ReturnType<typeof vi.fn>;
  };
  tradition: {
    findMany: ReturnType<typeof vi.fn>;
  };
  adService: {
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  adTradition: {
    create: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const mockSpamPipeline = runSpamPipeline as ReturnType<typeof vi.fn>;
const mockIsAdmin = isAdmin as ReturnType<typeof vi.fn>;

const BASE_INPUT = {
  title: 'Lectura de tarot profesional',
  description: 'Ofrezco lecturas con experiencia',
  services: ['tarot-y-lecturas'],
  traditions: ['cartomancia'],
  advertiserId: 'adv-001',
  whatsappNumber: '+573001234567',
  countryCode: 'CO',
  ip: '127.0.0.1',
};

const MOCK_ADVERTISER = {
  id: 'adv-001',
  email: 'test@example.com',
  emailVerified: true,
  reputation: 100,
};

const MOCK_AD = {
  id: 'ad-001',
  advertiserId: 'adv-001',
  title: 'Lectura de tarot',
  status: 'ACTIVE',
  lastBumpedAt: null,
  bumpCount: 0,
  expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  whatsappNumber: '+573001234567',
  websiteUrl: null,
  rejectionReason: null,
};

describe('ad-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    mockPrisma.advertiser.findUnique.mockResolvedValue(MOCK_ADVERTISER as never);
    mockPrisma.ad.count.mockResolvedValue(0);
    mockPrisma.ad.findFirst.mockResolvedValue(null);
    mockPrisma.ad.create.mockResolvedValue(MOCK_AD as never);
    mockPrisma.ad.findUniqueOrThrow.mockResolvedValue(MOCK_AD as never);
    mockPrisma.service.findMany.mockResolvedValue([{ id: 'svc-1', slug: 'tarot-y-lecturas' }] as never);
    mockPrisma.tradition.findMany.mockResolvedValue([{ id: 'trad-1', slug: 'cartomancia' }] as never);
    mockPrisma.adService.create.mockResolvedValue({} as never);
    mockPrisma.adTradition.create.mockResolvedValue({} as never);
    mockSpamPipeline.mockResolvedValue({ passed: true, step: 'all' });
    mockIsAdmin.mockReturnValue(false);
  });

  // ── createAd ────────────────────────────────────────────────────────────

  describe('createAd', () => {
    it('creates ad successfully with clean input', async () => {
      const result = await createAd(BASE_INPUT);

      expect(mockSpamPipeline).toHaveBeenCalled();
      expect(mockPrisma.ad.create).toHaveBeenCalled();
      expect(result).toEqual(MOCK_AD);
    });

    it('rejects when spam pipeline fails', async () => {
      mockSpamPipeline.mockResolvedValue({ passed: false, reason: 'spam detected', step: 'content_moderation' });

      const result = await createAd(BASE_INPUT);

      // Ad is created with REJECTED status
      expect(mockPrisma.ad.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: 'spam detected',
          }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws when advertiser not found', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue(null);

      await expect(createAd(BASE_INPUT)).rejects.toThrow('Anunciante no encontrado');
    });

    it('throws when email not verified', async () => {
      mockPrisma.advertiser.findUnique.mockResolvedValue({
        ...MOCK_ADVERTISER,
        emailVerified: false,
      } as never);

      await expect(createAd(BASE_INPUT)).rejects.toThrow('Debes verificar tu email');
    });

    it('throws when ad limit reached (3 ads)', async () => {
      mockPrisma.ad.count.mockResolvedValue(3);

      await expect(createAd(BASE_INPUT)).rejects.toThrow('Solo puedes tener 3 anuncios activos');
    });

    it('allows admin to bypass ad limit', async () => {
      mockPrisma.ad.count.mockResolvedValue(3);
      mockIsAdmin.mockReturnValue(true);

      const result = await createAd(BASE_INPUT);
      expect(result).toBeDefined();
    });

    it('throws on WhatsApp number conflict with another advertiser', async () => {
      // First findFirst for WhatsApp uniqueness check returns an existing ad from another user
      mockPrisma.ad.findFirst.mockResolvedValue({ id: 'other-ad', advertiserId: 'other-adv' } as never);

      await expect(createAd(BASE_INPUT)).rejects.toThrow('WhatsApp ya esta en uso por otro anunciante');
    });

    it('throws on same WhatsApp reused by same advertiser', async () => {
      mockPrisma.ad.findFirst.mockResolvedValue({ id: 'my-other-ad', advertiserId: 'adv-001' } as never);

      await expect(createAd(BASE_INPUT)).rejects.toThrow('Ya tienes un anuncio activo con este numero');
    });

    it('links services and traditions to the created ad', async () => {
      await createAd(BASE_INPUT);

      expect(mockPrisma.adService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ serviceId: 'svc-1' }),
        }),
      );
      expect(mockPrisma.adTradition.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ traditionId: 'trad-1' }),
        }),
      );
    });
  });

  // ── bumpAd ──────────────────────────────────────────────────────────────

  describe('bumpAd', () => {
    it('bumps ad after cooldown period', async () => {
      const oldBump = new Date(Date.now() - 49 * 60 * 60 * 1000); // 49h ago
      mockPrisma.ad.findFirst.mockResolvedValue({
        ...MOCK_AD,
        lastBumpedAt: oldBump,
      } as never);
      mockPrisma.ad.update.mockResolvedValue({} as never);

      const result = await bumpAd('ad-001', 'adv-001');
      expect(mockPrisma.ad.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when bump is within 48h cooldown', async () => {
      const recentBump = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10h ago
      mockPrisma.ad.findFirst.mockResolvedValue({
        ...MOCK_AD,
        lastBumpedAt: recentBump,
      } as never);

      await expect(bumpAd('ad-001', 'adv-001')).rejects.toThrow('Debes esperar');
    });
  });

  // ── renewAd ─────────────────────────────────────────────────────────────

  describe('renewAd', () => {
    it('renews ad within 7-day window', async () => {
      const expiresIn5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      mockPrisma.ad.findFirst.mockResolvedValue({
        ...MOCK_AD,
        expiresAt: expiresIn5Days,
      } as never);
      mockPrisma.ad.update.mockResolvedValue({} as never);

      const result = await renewAd('ad-001', 'adv-001');
      expect(mockPrisma.ad.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when too early to renew (more than 7 days left)', async () => {
      const expiresIn30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockPrisma.ad.findFirst.mockResolvedValue({
        ...MOCK_AD,
        expiresAt: expiresIn30Days,
      } as never);

      await expect(renewAd('ad-001', 'adv-001')).rejects.toThrow('Solo puedes renovar');
    });

    it('throws when ad already expired', async () => {
      const expiredYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockPrisma.ad.findFirst.mockResolvedValue({
        ...MOCK_AD,
        expiresAt: expiredYesterday,
      } as never);

      await expect(renewAd('ad-001', 'adv-001')).rejects.toThrow('ya expiró');
    });
  });

  // ── reactivateAd ────────────────────────────────────────────────────────

  describe('reactivateAd', () => {
    it('reactivates an expired ad', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue({
        ...MOCK_AD,
        status: 'EXPIRED',
      } as never);
      mockPrisma.ad.count.mockResolvedValue(0);
      mockPrisma.ad.findFirst.mockResolvedValue(null);
      mockPrisma.ad.update.mockResolvedValue({} as never);

      const result = await reactivateAd('ad-001');
      expect(mockPrisma.ad.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      );
      expect(result).toBeDefined();
    });

    it('throws when ad is not expired', async () => {
      mockPrisma.ad.findUnique.mockResolvedValue(MOCK_AD as never);

      await expect(reactivateAd('ad-001')).rejects.toThrow('Solo se pueden reactivar anuncios expirados');
    });
  });

  // ── getAdsByCountry ─────────────────────────────────────────────────────

  describe('getAdsByCountry', () => {
    it('returns paginated results with metadata', async () => {
      mockPrisma.ad.findMany.mockResolvedValue([MOCK_AD] as never);
      mockPrisma.ad.count.mockResolvedValue(25);

      const result = await getAdsByCountry('CO', 2, 10);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.ads).toHaveLength(1);
    });
  });
});
