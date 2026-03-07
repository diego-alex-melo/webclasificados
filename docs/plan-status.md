# Plan Status — BrujosClassifieds

Last updated: 2026-03-06

## Implementados (25 escenarios)

| # | Escenario | Evidencia |
|---|---|---|
| 1 | Registro exitoso | `auth-service.ts`, `api/auth/register`, resend verification flow |
| 2 | Publicacion exitosa de anuncio | `ad-service.ts`, `api/ads/route.ts`, spam pipeline, image upload to R2 |
| 3 | Anti-spam bloquea telefono en texto | `spam-pipeline.ts` step 2, `text-validator.ts` |
| 5 | Duplicado detectado | `content-hash.ts`, `text-similarity.ts`, spam pipeline steps 3-4 |
| 6 | Click tracking WhatsApp | `click/whatsapp/[id]` (con titulo del anuncio), `click/web/[id]`, `click-tracker.ts` |
| 7 | Expiracion, renovacion y reactivacion | `cron-service.ts`, `api/ads/reactivate`, `api/ads/[id]/renew` (7 dias antes), tokens + emails |
| 8 | Republicar (Bump) | `api/ads/bump`, `BumpButton.tsx`, 48h cooldown, `lastBumpedAt` sort, `bumpCount` tracked |
| 9 | Paginas SEO auto-generadas | `[country]/page.tsx`, `[country]/[service]/page.tsx` (DB queries reales) |
| 10 | Validacion de texto estricta | `text-validator.ts` + tests |
| 11 | Limite de anuncios por cuenta | `spam-pipeline.ts` step 0: `checkAdLimit()` — max 3 activos/cuenta |
| 12 | Compartir anuncio (WhatsApp preview) | `ShareButton.tsx`, OG meta tags en `anuncio/[slug]/page.tsx` |
| 13 | Google indexa correctamente | `sitemap.ts` (dinamico con ads + blog), `robots.ts`, JSON-LD breadcrumbs |
| 14 | Favoritos | localStorage — suficiente para el flujo anonimo del visitante. No requiere cuenta. |
| 15 | Anuncios relacionados | `RelatedAds.tsx` (query por servicios + pais, 6 ads) |
| 16 | Pagina 404 personalizada | `not-found.tsx` (custom con SearchBar + categorias) |
| 17 | Paginas legales | `legal/terminos`, `privacidad`, `responsabilidad`, `faq` (contenido real) |
| 18 | Version machine (markdown) | Middleware content negotiation (`Accept: text/markdown`) + `api/markdown/*` (5 rutas) |
| 19 | Push notifications | `api/push/route.ts`, `push-service.ts` (VAPID, 3 tipos de notificacion) |
| 20 | Backlink progresivo por reputacion | <80 oculto, 80-149 nofollow, 150+ dofollow |
| 21 | SEO programatico por ciudad | `servicios/[slug]/page.tsx` — pages por ciudad, FAQs, JSON-LD, internal links |
| 22 | Referral "Invita a un colega" | `referral-service.ts`, `api/referrals`, `dashboard/referidos` (+10 rep) |
| 23 | PWA instalable | `manifest.ts` (standalone, iconos, colores) |
| 25 | Badge de verificacion (parcial) | `dashboard/badge` genera HTML snippet. Falta cron de verificacion automatica |
| 27 | Blog con contenido SEO | `blog/page.tsx`, `blog/[slug]`, `blog-service.ts` (DB, categorias, paginacion) |

## Categorias (5)

| Categoria | Slug |
|---|---|
| Amarres y Alejamientos | `amarres-y-alejamientos` |
| Prosperidad y Dinero | `prosperidad-y-dinero` |
| Limpiezas y Sanacion | `limpiezas-y-sanacion` |
| Tarot y Lecturas | `tarot-y-lecturas` |
| Tiendas Esotericas | `tiendas-esotericas` |

## Especialidades (13, reemplaza professionalType + tradiciones)

angelologia, astrologia, brujeria, cartomancia, chamanismo, curanderismo, espiritismo, herbolaria, magia-blanca, numerologia, santeria, videncia, vudu

## Reputacion

| Accion | Puntos |
|---|---|
| Badge verificado en web | +30 |
| Referir amigo | +10 |
| Renovar antes de expirar | +10 |
| Primer bump | +5 |
| Anuncio rechazado | -30 |

Base: 100 | Rango: 0-200 | Backlink: <80 oculto, 80-149 nofollow, 150+ dofollow

## Pipeline anti-spam

| Step | Check | Estado |
|---|---|---|
| 0 | Limite de anuncios (max 3 activos/cuenta) | Real |
| 1 | Rate limit (5 min entre publicaciones) | Real (Redis, fail-open) |
| 2 | Validacion de texto (mayusculas, telefonos, URLs) | Real |
| 3 | Duplicado exacto (hash titulo+desc+whatsapp) | Real |
| 4 | Similitud de texto (>80% = rechazado) | Real |
| 5 | OCR de imagen | STUB — falta Google Cloud Vision |
| 6 | AI moderation (OpenAI moderacion + GPT-4o-mini) | Real |
| 7 | Reputacion (< 50 revision, < 20 bloqueado) | Real |

## No implementados (2 escenarios)

| # | Escenario | Que falta |
|---|---|---|
| 24 | Auto-publicacion en redes sociales | `social-publisher.ts` es stub (console.log). Requiere apps aprobadas en Facebook, IG, X, Pinterest |
| 26 | Google Business Profile y resenas | Solo existe email de solicitud (dia 7). Requiere crear perfil de negocio en Google |

## Pendiente menor

| Area | Detalle |
|---|---|
| OCR (#4) | `checkOcr()` stub. Requiere Google Cloud Vision API key (~$1.50/1000 imagenes) |
| Badge verificacion (#25) | Cron quincenal implementado (`/api/cron/badge`, dias 1 y 15 del mes) |
| Tests | 29/29 passing (fixed 2026-03-06) |

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
