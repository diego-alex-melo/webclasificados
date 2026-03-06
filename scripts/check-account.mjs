import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`SELECT id, email, "whatsappNumber", "countryCode", "emailVerified", reputation, "referralCode" FROM advertisers WHERE email = 'delavegadiego91@gmail.com'`;
console.log(JSON.stringify(rows[0], null, 2));
