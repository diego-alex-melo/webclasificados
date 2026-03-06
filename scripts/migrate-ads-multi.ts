/**
 * Migration script: Move whatsappNumber, countryCode, websiteUrl from Advertiser to Ad.
 *
 * Steps:
 * 1. Add columns to ads table (nullable)
 * 2. Backfill from advertisers table
 * 3. Make whatsappNumber and countryCode NOT NULL
 * 4. Add unique constraint on whatsappNumber
 * 5. Add index on countryCode
 * 6. Make advertiser columns nullable
 *
 * Run: npx tsx scripts/migrate-ads-multi.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Starting migration: ads multi-country...\n');

  // Step 1: Add columns to ads (nullable first)
  // Prisma uses camelCase column names (quoted identifiers)
  console.log('Step 1: Adding columns to ads table...');
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT`;
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS "countryCode" VARCHAR(2)`;
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT`;
  console.log('  Done.\n');

  // Step 2: Backfill from advertisers
  console.log('Step 2: Backfilling from advertisers...');
  const result = await sql`
    UPDATE ads
    SET "whatsappNumber" = a."whatsappNumber",
        "countryCode" = a."countryCode",
        "websiteUrl" = a."websiteUrl"
    FROM advertisers a
    WHERE ads."advertiserId" = a.id
      AND ads."whatsappNumber" IS NULL
  `;
  console.log(`  Updated ${result.length ?? 0} rows.\n`);

  // Step 3: Check for any NULLs remaining
  const nulls = await sql`
    SELECT id FROM ads WHERE "whatsappNumber" IS NULL OR "countryCode" IS NULL
  `;
  if (nulls.length > 0) {
    console.error(`  ERROR: ${nulls.length} ads still have NULL whatsapp/country. Fix manually.`);
    process.exit(1);
  }

  // Step 4: Make NOT NULL
  console.log('Step 3: Making columns NOT NULL...');
  await sql`ALTER TABLE ads ALTER COLUMN "whatsappNumber" SET NOT NULL`;
  await sql`ALTER TABLE ads ALTER COLUMN "countryCode" SET NOT NULL`;
  console.log('  Done.\n');

  // Step 5: Add unique constraint and index
  console.log('Step 4: Adding unique constraint and index...');
  try {
    await sql`ALTER TABLE ads ADD CONSTRAINT "ads_whatsappNumber_key" UNIQUE ("whatsappNumber")`;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('already exists')) {
      console.log('  Unique constraint already exists.');
    } else throw e;
  }
  try {
    await sql`CREATE INDEX IF NOT EXISTS "ads_countryCode_idx" ON ads ("countryCode")`;
  } catch {
    console.log('  Index might already exist.');
  }
  console.log('  Done.\n');

  // Step 6: Make advertiser columns nullable
  console.log('Step 5: Making advertiser columns nullable...');
  await sql`ALTER TABLE advertisers ALTER COLUMN "whatsappNumber" DROP NOT NULL`;
  await sql`ALTER TABLE advertisers ALTER COLUMN "countryCode" DROP NOT NULL`;
  // Drop the whatsapp index on advertisers (no longer needed)
  try {
    await sql`DROP INDEX IF EXISTS "advertisers_whatsappNumber_idx"`;
  } catch {
    // ignore
  }
  console.log('  Done.\n');

  console.log('Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
