import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Prisma ─────────────────────────────────────────────────────────────

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    ad: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    advertiser: {
      findUnique: vi.fn(),
    },
  },
}));

// ── Mock Redis ──────────────────────────────────────────────────────────────

vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
  }));
  return { default: RedisMock };
});

import { prisma } from '@/lib/db/prisma';
import { runSpamPipeline } from './spam-pipeline';

const mockPrisma = prisma as unknown as {
  ad: {
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  advertiser: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

const CLEAN_INPUT = {
  title: 'Lectura de tarot profesional en Bogotá',
  description:
    'Ofrezco lecturas de tarot con más de diez años de experiencia en el campo espiritual. Consultas presenciales y virtuales disponibles para guiarte.',
  whatsappNumber: '+573001234567',
  advertiserId: '00000000-0000-0000-0000-000000000001',
  ip: '127.0.0.1',
};

describe('runSpamPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks: everything passes
    mockPrisma.ad.count.mockResolvedValue(0);
    mockPrisma.ad.findFirst.mockResolvedValue(null);
    mockPrisma.ad.findMany.mockResolvedValue([]);
    mockPrisma.advertiser.findUnique.mockResolvedValue({
      id: CLEAN_INPUT.advertiserId,
      reputation: 100,
    } as never);
  });

  // ── S05: Exact duplicate detection ──────────────────────────────────────

  it('rejects exact duplicate (same content hash)', async () => {
    mockPrisma.ad.findFirst.mockResolvedValue({
      id: 'existing-ad',
      contentHash: 'some-hash',
    } as never);

    const result = await runSpamPipeline(CLEAN_INPUT);

    expect(result.passed).toBe(false);
    expect(result.step).toBe('exact_duplicate');
    expect(result.reason).toBe('Ya existe un anuncio con el mismo contenido');
  });

  // ── S05: Text similarity detection ────────────────────────────────────

  it('rejects text with >80% similarity to existing ad', async () => {
    // findFirst returns null (no exact duplicate)
    mockPrisma.ad.findFirst.mockResolvedValue(null);

    // findMany returns a similar ad
    mockPrisma.ad.findMany.mockResolvedValue([
      {
        title: 'Lectura de tarot profesional en Bogotá',
        description:
          'Ofrezco lecturas de tarot con más de diez años de experiencia en el campo espiritual. Consultas presenciales y virtuales disponibles para guiarte.',
      },
    ] as never);

    const result = await runSpamPipeline({
      ...CLEAN_INPUT,
      // Slightly different but >80% similar
      title: 'Lectura de tarot profesional en Bogota',
      description:
        'Ofrezco lecturas de tarot con más de diez años de experiencia en el campo espiritual. Consultas presenciales y virtuales disponibles para guiarte.',
    });

    expect(result.passed).toBe(false);
    expect(result.step).toBe('text_similarity');
    expect(result.reason).toBe('El anuncio es muy similar a uno existente');
  });

  // ── Full pipeline pass ────────────────────────────────────────────────

  it('passes with clean input when all checks clear', async () => {
    const result = await runSpamPipeline(CLEAN_INPUT);

    expect(result.passed).toBe(true);
    expect(result.step).toBe('all');
  });

  // ── Backlink relevance ───────────────────────────────────────────────

  it('blocks obviously non-esoteric backlink domains', async () => {
    const result = await runSpamPipeline({
      ...CLEAN_INPUT,
      websiteUrl: 'https://www.escorts-bogota.com/perfil',
    });

    expect(result.passed).toBe(false);
    expect(result.step).toBe('backlink_check');
  });

  it('blocks casino/gambling backlink domains', async () => {
    const result = await runSpamPipeline({
      ...CLEAN_INPUT,
      websiteUrl: 'https://casino-online-colombia.com',
    });

    expect(result.passed).toBe(false);
    expect(result.step).toBe('backlink_check');
  });

  it('allows esoteric or neutral backlink domains', async () => {
    const result = await runSpamPipeline({
      ...CLEAN_INPUT,
      websiteUrl: 'https://tarot-maria.com',
    });

    expect(result.passed).toBe(true);
  });

  it('allows ads without backlink', async () => {
    const result = await runSpamPipeline(CLEAN_INPUT);

    expect(result.passed).toBe(true);
  });

  // ── Reputation block ──────────────────────────────────────────────────

  it('blocks advertiser with reputation < 20', async () => {
    mockPrisma.advertiser.findUnique.mockResolvedValue({
      id: CLEAN_INPUT.advertiserId,
      reputation: 15,
    } as never);

    const result = await runSpamPipeline(CLEAN_INPUT);

    expect(result.passed).toBe(false);
    expect(result.step).toBe('reputation_check');
    expect(result.reason).toContain('bloqueada por baja reputación');
  });

  // ── Reputation pending review ─────────────────────────────────────────

  it('flags advertiser with reputation < 50 for manual review', async () => {
    mockPrisma.advertiser.findUnique.mockResolvedValue({
      id: CLEAN_INPUT.advertiserId,
      reputation: 40,
    } as never);

    const result = await runSpamPipeline(CLEAN_INPUT);

    expect(result.passed).toBe(false);
    expect(result.step).toBe('reputation_check');
    expect(result.reason).toContain('revisión manual');
  });
});
