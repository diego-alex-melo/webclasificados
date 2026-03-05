# Stack

## Runtime
- Node.js 20 LTS
- TypeScript 5.x (strict mode)
- Next.js 15 (App Router)

## Dependencies (core)
- prisma + @prisma/client — ORM
- ioredis — Redis client
- zod — validation
- next-auth or custom JWT — auth
- resend — email
- twilio — SMS verification
- openai — content moderation
- @google-cloud/vision — OCR
- @aws-sdk/client-s3 — R2 storage (S3-compatible)
- sharp — image processing (resize, strip metadata)

## Dev Dependencies
- vitest — testing
- playwright — e2e testing
- eslint + prettier — formatting
- prisma migrate — db migrations

## Scripts
- `dev` — next dev
- `build` — next build
- `start` — next start
- `db:migrate` — prisma migrate dev
- `db:seed` — prisma db seed
- `test` — vitest run
- `test:e2e` — playwright test
- `lint` — eslint
