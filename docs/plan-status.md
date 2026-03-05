# Plan Status — BrujosClassifieds

Last updated: 2026-03-06

## Implementados (24 escenarios)

| # | Escenario | Evidencia |
|---|---|---|
| 1 | Registro exitoso | `auth-service.ts`, `api/auth/register`, resend verification flow |
| 2 | Publicacion exitosa de anuncio | `ad-service.ts`, `api/ads/route.ts`, spam pipeline, image upload to R2 |
| 3 | Anti-spam bloquea telefono en texto | `spam-pipeline.ts` step 2, `text-validator.ts` |
| 5 | Duplicado detectado | `content-hash.ts`, `text-similarity.ts`, spam pipeline steps 3-4 |
| 6 | Click tracking WhatsApp | `click/whatsapp/[id]`, `click/web/[id]`, `click-tracker.ts` (DB records) |
| 7 | Expiracion y reactivacion | `cron-service.ts` (processExpirations), `api/ads/reactivate`, tokens + emails |
| 8 | Republicar (Bump) | `api/ads/bump`, `BumpButton.tsx`, 48h cooldown, `lastBumpedAt` sort |
| 9 | Paginas SEO auto-generadas | `[country]/page.tsx`, `[country]/[service]/page.tsx` (DB queries reales) |
| 10 | Validacion de texto estricta | `text-validator.ts` + tests |
| 11 | Limite de anuncios por cuenta | `spam-pipeline.ts` step 0: `checkAdLimit()` — max 1 activo/cuenta |
| 12 | Compartir anuncio (WhatsApp preview) | `ShareButton.tsx`, OG meta tags en `anuncio/[slug]/page.tsx` |
| 13 | Google indexa correctamente | `sitemap.ts` (dinamico con ads + blog), `robots.ts`, JSON-LD breadcrumbs |
| 15 | Anuncios relacionados | `RelatedAds.tsx` (query por servicios + pais, 6 ads) |
| 16 | Pagina 404 personalizada | `not-found.tsx` (custom con SearchBar + categorias) |
| 17 | Paginas legales | `legal/terminos`, `privacidad`, `responsabilidad`, `faq` (contenido real) |
| 18 | Version machine (markdown) | `api/markdown/*` (5 rutas), `markdown-renderer.ts` |
| 19 | Push notifications | `api/push/route.ts`, `push-service.ts` (VAPID, 3 tipos de notificacion) |
| 20 | Backlink progresivo por reputacion | `anuncio/[slug]/page.tsx:175`: `rel={reputation >= 150 ? 'ugc' : 'ugc nofollow'}` |
| 21 | SEO programatico por ciudad | `servicios/[slug]/page.tsx` — 225+ pages (8 profesionales x 20 ciudades), FAQs, JSON-LD, internal links |
| 22 | Referral "Invita a un colega" | `referral-service.ts`, `api/referrals`, `dashboard/referidos` (+5 rep, boost) |
| 23 | PWA instalable | `manifest.ts` (standalone, iconos, colores) |
| 25 | Badge de verificacion (parcial) | `dashboard/badge` genera HTML snippet, pero sin verificacion automatica |
| 27 | Blog con contenido SEO | `blog/page.tsx`, `blog/[slug]`, `blog-service.ts` (DB, categorias, paginacion) |

## No implementados (3 escenarios)

| # | Escenario | Que falta |
|---|---|---|
| 4 | OCR bloquea imagen con telefono | `checkOcr()` es stub (siempre `passed: true`). Falta Google Cloud Vision API |
| 24 | Auto-publicacion en redes sociales | `social-publisher.ts` es stub completo (console.log + return null en todas) |
| 26 | Google Business Profile y resenas | Solo existe email de solicitud (dia 7). No hay proceso de reviews ni banner |

## Stubs parciales (implementados pero incompletos)

| Area | Estado | Detalle |
|---|---|---|
| Favoritos (#14) | STUB | Solo localStorage (`useFavorites.ts`). Sin persistencia en BD, sin sync entre dispositivos |
| Badge verificacion (#25) | STUB | Genera snippet HTML pero NO verifica si el badge esta en el sitio externo. No aplica boost |
| AI moderation (pipeline step 6) | STUB | `checkAiModeration()` siempre retorna `passed: true`. Falta OpenAI API |

## Cron scheduling

Configurado en `vercel.json`: diario a las 6AM UTC. Ejecuta todos los jobs secuencialmente via GET `/api/cron`.

## Emails implementados (via Resend)

| Email | Funcion | Trigger |
|---|---|---|
| Verificacion de cuenta | `sendVerificationEmail()` | Registro |
| Reenvio de verificacion | `/api/auth/resend-verification` | Boton en registro y login |
| Bienvenida | `sendWelcome()` | Post-verificacion email |
| Reset de contrasena | `sendPasswordResetEmail()` | Forgot password (1h expiry) |
| Aviso de expiracion | `sendExpirationWarning()` | Cron dia 54 |
| Notificacion de expiracion | `sendExpiredNotice()` | Cron dia 60 |
| Tips de onboarding | `sendOnboardingTips()` | Cron dia 1 post-publicacion |
| Recordatorio de metricas | `sendMetricsReminder()` | Cron dia 3 post-publicacion |
| Solicitud de resena Google | `sendGoogleReviewRequest()` | Cron dia 7 post-registro |
| Confirmacion de reactivacion | `sendReactivationConfirmation()` | Post-reactivacion |
