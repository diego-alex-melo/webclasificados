import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const services = [
    { name: 'Amarres y Alejamientos', slug: 'amarres-y-alejamientos' },
    { name: 'Prosperidad y Dinero', slug: 'prosperidad-y-dinero' },
    { name: 'Limpiezas y Sanación', slug: 'limpiezas-y-sanacion' },
    { name: 'Tarot y Lecturas', slug: 'tarot-y-lecturas' },
    { name: 'Tiendas Esotéricas', slug: 'tiendas-esotericas' },
  ];

  for (const s of services) {
    await sql`INSERT INTO services (name, slug) VALUES (${s.name}, ${s.slug}) ON CONFLICT (slug) DO NOTHING`;
  }
  console.log(`Seeded ${services.length} services`);

  const traditions = [
    { name: 'Angelología', slug: 'angelologia' },
    { name: 'Astrología', slug: 'astrologia' },
    { name: 'Brujería', slug: 'brujeria' },
    { name: 'Cartomancia', slug: 'cartomancia' },
    { name: 'Chamanismo', slug: 'chamanismo' },
    { name: 'Curanderismo', slug: 'curanderismo' },
    { name: 'Espiritismo', slug: 'espiritismo' },
    { name: 'Herbolaria', slug: 'herbolaria' },
    { name: 'Magia Blanca', slug: 'magia-blanca' },
    { name: 'Numerología', slug: 'numerologia' },
    { name: 'Santería', slug: 'santeria' },
    { name: 'Videncia', slug: 'videncia' },
    { name: 'Vudú', slug: 'vudu' },
  ];

  for (const t of traditions) {
    await sql`INSERT INTO traditions (name, slug) VALUES (${t.name}, ${t.slug}) ON CONFLICT (slug) DO NOTHING`;
  }
  console.log(`Seeded ${traditions.length} traditions`);

  // ── Helper: look up service/tradition ids by slug ──────────────────────────
  async function serviceId(slug: string): Promise<number> {
    const rows = await sql`SELECT id FROM services WHERE slug = ${slug} LIMIT 1`;
    if (!rows[0]) throw new Error(`Service not found: ${slug}`);
    return rows[0].id as number;
  }

  async function traditionId(slug: string): Promise<number> {
    const rows = await sql`SELECT id FROM traditions WHERE slug = ${slug} LIMIT 1`;
    if (!rows[0]) throw new Error(`Tradition not found: ${slug}`);
    return rows[0].id as number;
  }

  // ── Helper: generate a URL-safe slug from a title ─────────────────────────
  function toSlug(title: string, suffix: string): string {
    return (
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80) +
      '-' +
      suffix
    );
  }

  // ── Helper: generate a content hash ───────────────────────────────────────
  function contentHash(title: string, description: string, whatsapp: string): string {
    return createHash('sha256')
      .update(`${title}|${description}|${whatsapp}`)
      .digest('hex');
  }

  const DEFAULT_PASSWORD = 'BrujosClassifieds2024';
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // now + 60 days

  // ── Ad definitions ─────────────────────────────────────────────────────────
  const adsToSeed = [
    {
      advertiser: {
        email: 'maestrofaruk@brujeriaenmexico.com',
        whatsappNumber: '+527471668926',
        countryCode: 'MX',
        websiteUrl: 'https://brujeriaenmexico.com',
        referralCode: 'FARUK-MX',
      },
      ad: {
        title: 'Maestro Faruk — Brujo de Catemaco con 40 años de experiencia',
        description:
          'El Maestro Faruk y la Maestra Alma Rosa, auténticos brujos de Catemaco, Veracruz, te ayudan a recuperar el amor de tu vida con trabajos espirituales de tradición familiar de 4 generaciones. Especialistas en amarres de amor, retornos de parejas, endulzamientos, alejamientos de intrusos y limpias espirituales. Consulta gratis y sin compromiso.',
        professionalType: 'BRUJO',
        slugSuffix: 'mx',
      },
      serviceSlugs: ['amarres-y-alejamientos', 'limpiezas-y-sanacion'],
      traditionSlugs: ['brujeria', 'santeria'],
    },
    {
      advertiser: {
        email: 'contacto@brujosenchile.com',
        whatsappNumber: '+56929995769',
        countryCode: 'CL',
        websiteUrl: 'https://brujosenchile.com',
        referralCode: 'BRUJOS-CL',
      },
      ad: {
        title: 'Brujos de Salamanca — Especialistas en amarres de amor en Chile',
        description:
          'Somos los brujos de Salamanca reconocidos en Chile, con amplia experiencia en amarres de amor, recuperación de parejas y todo tipo de trabajos espirituales. Atención personalizada y confidencial. Primera consulta sin costo. Resultados comprobados con más de 15 años de trayectoria.',
        professionalType: 'BRUJO',
        slugSuffix: 'cl',
      },
      serviceSlugs: ['amarres-y-alejamientos', 'tarot-y-lecturas'],
      traditionSlugs: ['brujeria'],
    },
    {
      advertiser: {
        email: 'maestrojose@brujosenelsalvador.com',
        whatsappNumber: '+50375078593',
        countryCode: 'SV',
        websiteUrl: 'https://brujosenelsalvador.com',
        referralCode: 'IZALCO-SV',
      },
      ad: {
        title: 'Brujos de Izalco — Tradición ancestral al servicio del amor',
        description:
          'Los mejores brujos de Izalco, chamanes y hechiceros con más de 40 años de experiencia. Especialistas en amarres de amor, retorno de parejas, endulzamientos, alejamiento de intrusos, limpias espirituales y diagnóstico de brujería. Atendemos en San Salvador, Santa Ana, San Miguel, Sonsonate y todo El Salvador. Tradición ancestral al servicio del amor.',
        professionalType: 'CHAMAN',
        slugSuffix: 'sv',
      },
      serviceSlugs: ['amarres-y-alejamientos', 'limpiezas-y-sanacion', 'tarot-y-lecturas'],
      traditionSlugs: ['brujeria', 'chamanismo'],
    },
  ];

  for (const entry of adsToSeed) {
    const { advertiser, ad, serviceSlugs, traditionSlugs } = entry;

    // 1. Upsert advertiser (idempotent on email)
    await sql`
      INSERT INTO advertisers (
        id, email, "passwordHash", "whatsappNumber", "countryCode",
        reputation, "websiteUrl", "referralCode", "emailVerified",
        "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${advertiser.email},
        ${passwordHash},
        ${advertiser.whatsappNumber},
        ${advertiser.countryCode},
        100,
        ${advertiser.websiteUrl},
        ${advertiser.referralCode},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `;

    // Fetch the advertiser id (inserted or pre-existing)
    const advRows = await sql`SELECT id FROM advertisers WHERE email = ${advertiser.email} LIMIT 1`;
    const advertiserId = advRows[0].id as string;

    // 2. Insert ad (idempotent: skip if advertiser already has an ad with this title)
    const hash = contentHash(ad.title, ad.description, advertiser.whatsappNumber);
    const slug = toSlug(ad.title, ad.slugSuffix);

    await sql`
      INSERT INTO ads (
        id, "advertiserId", title, description, slug,
        "contentHash", status, "professionalType",
        "publishedAt", "expiresAt", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${advertiserId},
        ${ad.title},
        ${ad.description},
        ${slug},
        ${hash},
        'ACTIVE',
        ${ad.professionalType},
        ${now.toISOString()},
        ${expiresAt.toISOString()},
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO NOTHING
    `;

    // Fetch the ad id (inserted or pre-existing)
    const adRows = await sql`SELECT id FROM ads WHERE slug = ${slug} LIMIT 1`;
    const adId = adRows[0].id as string;

    // 3. Link services
    for (const sSlug of serviceSlugs) {
      const sId = await serviceId(sSlug);
      await sql`
        INSERT INTO ad_services ("adId", "serviceId")
        VALUES (${adId}, ${sId})
        ON CONFLICT DO NOTHING
      `;
    }

    // 4. Link traditions
    for (const tSlug of traditionSlugs) {
      const tId = await traditionId(tSlug);
      await sql`
        INSERT INTO ad_traditions ("adId", "traditionId")
        VALUES (${adId}, ${tId})
        ON CONFLICT DO NOTHING
      `;
    }

    console.log(`Seeded ad: "${ad.title}" (advertiser: ${advertiser.email})`);
  }

  console.log(`Seeded ${adsToSeed.length} example ads`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
