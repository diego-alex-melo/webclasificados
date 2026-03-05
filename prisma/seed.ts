import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const services = [
    { name: 'Amor y Relaciones', slug: 'amor-y-relaciones' },
    { name: 'Consultas y Lecturas', slug: 'consultas-y-lecturas' },
    { name: 'Limpiezas y Sanación', slug: 'limpiezas-y-sanacion' },
    { name: 'Protección', slug: 'proteccion' },
    { name: 'Prosperidad', slug: 'prosperidad' },
    { name: 'Trabajos Espirituales', slug: 'trabajos-espirituales' },
  ];

  for (const s of services) {
    await sql`INSERT INTO services (name, slug) VALUES (${s.name}, ${s.slug}) ON CONFLICT (slug) DO NOTHING`;
  }
  console.log(`Seeded ${services.length} services`);

  const traditions = [
    { name: 'Santería', slug: 'santeria' },
    { name: 'Tarot', slug: 'tarot' },
    { name: 'Chamanismo', slug: 'chamanismo' },
    { name: 'Brujería', slug: 'brujeria' },
    { name: 'Astrología', slug: 'astrologia' },
    { name: 'Numerología', slug: 'numerologia' },
    { name: 'Reiki', slug: 'reiki' },
    { name: 'Velas', slug: 'velas' },
    { name: 'Cristales', slug: 'cristales' },
    { name: 'Médiumship', slug: 'mediumship' },
  ];

  for (const t of traditions) {
    await sql`INSERT INTO traditions (name, slug) VALUES (${t.name}, ${t.slug}) ON CONFLICT (slug) DO NOTHING`;
  }
  console.log(`Seeded ${traditions.length} traditions`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
