# End-to-End Review Findings — BrujosClassifieds

Date: 2026-03-06

## Summary: 25/27 scenarios implemented, 8 tests broken, 6 actionable findings

---

## Critical Findings

### 1. WhatsApp message missing ad title (HIGH)
- **File:** `src/app/click/whatsapp/[id]/route.ts:36`
- **Current:** Generic message "Hola, vi tu anuncio en www.brujosclassifieds.com y deseo una consulta."
- **Expected:** "Hola, vi tu anuncio '[TITULO]' en BrujosClassifieds y quiero mas informacion."
- **Fix:** Fetch ad title in route, interpolate into message

### 2. plan-status.md outdated on ad limits (MEDIUM)
- **File:** `docs/plan-status.md:18,38`
- **Current:** Says "max 1 activo/cuenta"
- **Reality:** Code is MAX=3 total, max 1 per country (since commit `9c7a354`)
- **Fix:** Update plan-status.md lines 18 and 38

### 3. 8 unit tests broken by mock issues (MEDIUM)
- **spam-pipeline.test.ts (5 tests):** Missing `prisma.ad.count()` mock — all fail at `checkAdLimit()`
- **auth-service.test.ts (3 tests):** Country extraction not implemented in `register()`, JWT missing countryCode
- **Fix:** Add `count: vi.fn().mockResolvedValue(0)` to spam mock; add `countryFromPhone()` call in register

### 4. Backlink rule <80 not enforced (MEDIUM)
- **File:** `src/app/(public)/anuncio/[slug]/page.tsx:168-176`
- **Plan says:** Hide website button if reputation < 80
- **Code does:** Shows website to everyone, only toggles nofollow at 150
- **Fix:** Wrap websiteUrl link in `ad.advertiser.reputation >= 80` condition

### 5. Badge verification cron missing (MEDIUM)
- **File:** `src/app/dashboard/badge/page.tsx` generates HTML snippet
- **Missing:** No `processBadgeVerification()` in cron-service.ts
- **Fix:** Add cron that fetches advertiser websites, checks for badge, boosts if found

### 6. OCR is stub (LOW — known)
- **File:** `src/lib/services/spam-pipeline.ts:174-182`
- **Status:** `checkOcr()` always returns `{ passed: true }`
- **Fix:** Integrate Google Cloud Vision API (~$1.50/1000 images)

---

## Secondary Findings

### 7. Country not extracted at registration (LOW)
- **File:** `src/lib/services/auth-service.ts:66-81`
- **Utility exists:** `countryFromPhone()` in `src/lib/utils/country-from-phone.ts`
- **Not called** in `register()` — workaround: country selected in ad form
- **Fix:** Call `countryFromPhone(whatsappNumber)` during registration

### 8. Spam pipeline per-country check missing (LOW)
- **File:** `src/lib/services/spam-pipeline.ts:38-61`
- **Issue:** `checkAdLimit()` only checks total count (3), not per-country
- **Mitigated by:** `ad-service.ts` does per-country check before DB write
- **Fix:** Optional — redundant but could add for defense-in-depth

---

## Pending Scenarios (not bugs — planned future work)

| # | Scenario | What's needed |
|---|----------|---------------|
| 4 | OCR image blocking | Google Cloud Vision API integration |
| 24 | Social auto-publish | 5 platform API integrations + app approvals |
| 26 | Google Business Profile | Profile creation, verification, review aggregation |

---

## SEO Status: Excellent

- Sitemap dynamic (ads + blog + 160 city pages)
- JSON-LD: 6 schemas across all page types
- OG tags on all pages
- Internal linking between cities and professionals
- robots.txt correct

## Anti-spam Pipeline: 7/8 steps real

| Step | Status |
|------|--------|
| 0 Ad limit (MAX=3) | Real |
| 1 Rate limit (Redis) | Real (fail-open) |
| 2 Text validation | Real (15 tests passing) |
| 3 Duplicate hash (SHA256) | Real |
| 4 Text similarity (Levenshtein 80%) | Real |
| 5 OCR | STUB |
| 6 AI moderation (OpenAI dual-layer) | Real |
| 7 Reputation (<20 block, <50 review) | Real |

## Emails: 10/10 via Resend

## Cron Jobs: 6/7 (missing badge verification)

---

## Pending: Analytics (implement later)

### Google Analytics 4 (GA4)
- Conversion funnels (visit → WhatsApp click), traffic sources, bounce rate
- Free, script tag in layout.tsx
- Needs: GA4 measurement ID

### Google Search Console (GSC)
- Query indexing, CTR, coverage errors for 160+ city pages + sitemap
- Free, verification via meta tag or DNS
- Already have sitemap.ts and robots.ts ready

### Microsoft Clarity (heatmaps)
- Free, unlimited sessions, heatmaps + session recordings + dead click detection
- Better than Hotjar for this case (no session limits)
- Script tag in layout.tsx

---

## Security Audit (2026-03-06)

### VULN-1: Stored XSS via JSON-LD script injection (HIGH)
- **Files:** `src/app/(public)/anuncio/[slug]/page.tsx:182-204`, `src/app/(public)/servicios/[slug]/page.tsx:179-221`
- **Vector:** Ad title/description containing `</script>` breaks out of JSON-LD `<script>` tag
- **Impact:** Arbitrary JS execution on every visitor's browser (session hijacking, credential theft)
- **Fix:** Escape `<`, `>`, `&` in JSON.stringify output before placing in script tag:
  ```typescript
  function safeJsonLd(obj: unknown): string {
    return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  }
  ```

### VULN-2: Stored XSS via unsanitized markdown in blog (MEDIUM)
- **File:** `src/app/(public)/blog/[slug]/page.tsx:44-66, 129`
- **Vector:** Custom regex markdown renderer does not strip raw HTML tags
- **Impact:** `<img onerror=...>` or `<script>` in blog content executes on visitors
- **Mitigated by:** Only admins create blog posts (no public API), but fragile
- **Fix:** Use `sanitize-html` or `isomorphic-dompurify` on `markdownToHtml()` output

### VULN-3: Hardcoded JWT secret fallback (HIGH)
- **File:** `src/lib/services/auth-service.ts:8`
- **Vector:** `JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'`
- **Impact:** If env var unset in production, attacker forges tokens with known secret
- **Fix:** Remove fallback, throw error if JWT_SECRET undefined

### Security: What's OK
- **SQL Injection:** No risk. Prisma ORM parametrizes all queries, no `$queryRaw` usage found
- **Input overflow:** Zod enforces title max 100, description max 2000 at API boundary
- **File upload:** MIME validation + 5MB limit + sharp WebP conversion
- **IDOR:** All mutation routes verify advertiserId from JWT
- **Next.js body limit:** Default 1MB for API routes (sufficient protection)
