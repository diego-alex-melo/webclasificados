# Conventions

## Naming
- Files/dirs: kebab-case (`ad-service.ts`, `click-tracker.ts`)
- Components: PascalCase (`AdCard.tsx`, `WhatsAppButton.tsx`)
- Functions/variables: camelCase
- DB tables: snake_case (Prisma maps automatically)
- Environment vars: SCREAMING_SNAKE (`DATABASE_URL`, `TWILIO_SID`)

## Errors
- Zod for input validation at API boundary
- Custom error classes extending base `AppError` with code + HTTP status
- Never expose internal errors to client — log server-side, return safe message

## Imports
- Absolute imports via `@/` alias (maps to `src/`)
- Group: external → internal → types → styles

## API Routes
- Return consistent shape: `{ data, error, meta }`
- Rate limit all mutation endpoints via Redis
- Validate all input with Zod schemas

## Images
- Strip EXIF metadata on upload
- Resize to max 1200px width
- Convert to WebP
- Store original filename hash, not user-provided name

## Testing
- Framework: Vitest (unit/integration), Playwright (e2e)
- Test files: colocated `*.test.ts` next to source
- Test command: `pnpm test`
- Critical paths require tests: anti-spam pipeline, duplicate detection, reputation scoring

## i18n
- UI text in Spanish (Colombia)
- Code, comments, commits, docs in English
