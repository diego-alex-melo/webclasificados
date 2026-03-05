# Architecture

## Stack Overview
- **Framework**: Next.js 15 (App Router, RSC)
- **Database**: PostgreSQL via Prisma ORM
- **Cache**: Redis (rate limiting, sessions, hot queries)
- **Auth**: phone SMS verification (primary) + email
- **Storage**: Cloudflare R2 (images)
- **Email**: Resend (transactional emails)
- **SMS**: Twilio Verify
- **Anti-spam AI**: OpenAI API (content moderation)
- **OCR**: Google Cloud Vision API
- **Deploy**: Vercel (app) + managed PostgreSQL + managed Redis

## Layers
```
src/
├── app/              # Next.js App Router (pages, layouts, API routes)
│   ├── (public)/     # Public pages (search, ad detail, categories)
│   ├── (auth)/       # Auth pages (login, verify)
│   ├── dashboard/    # Advertiser dashboard (my ads, metrics)
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Business logic, services, utilities
│   ├── services/     # Domain services (ads, auth, reputation, spam)
│   ├── db/           # Prisma client, queries
│   └── utils/        # Helpers (hash, text similarity, image processing)
├── hooks/            # React hooks
└── types/            # TypeScript types
prisma/
├── schema.prisma     # Database schema
└── migrations/       # Migration history
```

## Data Flow
1. User submits ad → API validates → anti-spam pipeline → publish or reject
2. Anti-spam pipeline: rate limit → duplicate check → content moderation → OCR check → reputation check
3. Contact click → internal redirect (tracked) → WhatsApp/external URL
4. Cron jobs: expire ads, send notifications, cleanup, reputation recalculation

## Boundaries
- All external services (Twilio, OpenAI, Vision, R2) accessed through service abstractions in `lib/services/`
- Database access only through Prisma queries in `lib/db/`
- API routes are thin — delegate to services
