# Project: WebClasificados

## Purpose
Self-moderated classified ads platform for Colombia. Near-zero human maintenance.
Users publish ads with controlled contact (WhatsApp button + website link only).

## Domain Concepts
- **Anuncio** (Ad): listing with title, description, images, category, location, contact buttons
- **Anunciante** (Advertiser): verified user who publishes ads
- **Reputación**: internal score governing publish limits and auto-moderation
- **Expiración**: ads auto-expire after 30 days, reactivatable via email link
- **Click tracking**: all WhatsApp/web button clicks pass through internal redirect for metrics

## Key Business Rules
- Phone number NEVER shown publicly — only WhatsApp button with pre-filled message
- Max 1 account per phone number
- Ads expire after 60 days (configurable via AD_EXPIRY_DAYS)
- Duplicate detection: hash(title+description+phone), text similarity, image hash
- OCR on uploaded images — block if phone/URL/WhatsApp detected
- Reputation system: auto-block users below threshold
- Backlinks: 1 optional URL per ad, rendered with rel="ugc nofollow"
- Email notifications: expiry warning (day 54), expiry (day 60), reactivation link
- WhatsApp button message: "Hola, vi tu anuncio '[TÍTULO]' en WebClasificados y quiero más información."

## Target Market
- Latin America + Spain (Spanish language)
- Categories: esoteric services (amor y relaciones, protección, prosperidad, salud, lectura y adivinación, trabajos especiales)
