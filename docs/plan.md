# Plan: WebClasificados — Sistema de Clasificados Esotericos

## Contexto

Plataforma de clasificados auto-moderada para servicios esotericos (brujos, tarotistas, santeros, chamanes, videntes, etc.). Multi-pais desde el dia 1, mantenimiento casi cero por humanos. El anunciante (profesional esoterico) es el cliente principal. El consumidor navega anonimamente sin cuenta.

**Decisiones clave validadas en brainstorming:**
- Stack: Next.js 15 (App Router) + PostgreSQL + Prisma + Redis
- Auth: email verificado + WhatsApp como contacto
- 1 imagen por anuncio (WebP, <200KB, OCR anti-texto)
- 1 anuncio activo por cuenta
- 3 dimensiones de categorizacion: Servicio (que) + Profesional (quien) + Tradicion (SEO tags)
- Pais determinado por codigo telefonico del WhatsApp (+57=CO, +52=MX, etc.)
- Expiracion a 60 dias con reactivacion por email
- Boton "Republicar" cada 24-48h para subir posicion
- Backlink progresivo: nofollow → dofollow segun reputacion
- Version markdown para agentes IA (Accept: text/markdown)

---

## Seccion 1: Modelo de Datos Principal

**Anunciante (Advertiser)**
- Email (verificado, unico) — ancla de la cuenta
- WhatsApp (numero completo con codigo de pais) — contacto del anuncio
- Pais (detectado del codigo de WhatsApp: +57=CO, +52=MX, etc.)
- Reputacion (score interno, empieza en 100)
- Website opcional (1 URL, `rel="ugc nofollow"`)
- Fecha de registro

**Anuncio (Ad)**
- Titulo (texto libre, max 100 chars)
- Descripcion (texto libre, max 2000 chars)
- 1 imagen (WebP, max 200KB, OCR verificado)
- Servicios (seleccion manual): Amor y Relaciones, Consultas y Lecturas, Limpiezas y Sanacion, Proteccion, Prosperidad, Trabajos Espirituales
- Tipo de profesional: Brujo/a, Chaman, Santero/a, Tarotista, Vidente, Medium, Astrologo/a, Curandero/a
- Tradiciones/herramientas (tags SEO): Santeria, Tarot, Chamanismo, Brujeria, Astrologia, Numerologia, Reiki, etc.
- Alcance: automatico segun pais del telefono
- Estado: Pendiente → Activo → Expirado → Reactivado
- Fecha de creacion, fecha de expiracion (creacion + 60 dias)
- Hash anti-duplicado: hash(titulo + descripcion + whatsapp)

**Metricas (Click Tracking)**
- Vistas del anuncio
- Clics en boton WhatsApp
- Clics en boton Website
- Por dia, para mostrar graficas al anunciante

---

## Seccion 2: Pipeline Anti-Spam

Cuando un anuncio se publica, pasa por esta cadena automatica en orden:

1. **Rate limit** — Este email/IP publico hace menos de 5 minutos? → rechazar
2. **Validacion de texto** — Tiene mayusculas excesivas, telefonos, URLs, precios? → rechazar con mensaje especifico
3. **Duplicado** — El hash(titulo+descripcion+whatsapp) ya existe? → rechazar
4. **Similitud de texto** — Hay otro anuncio con >80% similitud del mismo WhatsApp? → rechazar
5. **OCR de imagen** — La imagen contiene telefono, URL, WhatsApp, texto de contacto? → rechazar imagen
6. **IA anti-spam** — OpenAI analiza titulo+descripcion buscando spam, estafas, contenido prohibido → rechazar o marcar
7. **Reputacion** — El usuario tiene score < 50? → enviar a cola de revision. < 20? → bloquear

Si pasa todo → **publicado automaticamente**.

---

## Seccion 3: Flujo del Cliente (quien busca el servicio)

**Pagina principal:**
- Barra de busqueda
- Categorias de servicio como cards clicleables (Amor y Relaciones, Consultas, Limpiezas, etc.)
- Anuncios recientes/destacados

**Pagina de categoria** (ej: `/co/amor-y-relaciones`):
- Lista de anuncios filtrados
- Filtros laterales: tipo de profesional, tradicion, pais
- Cada anuncio muestra: imagen, titulo, tipo de profesional, tradiciones como tags clicleables

**Pagina de detalle del anuncio:**
- Imagen
- Titulo + descripcion
- Tags clicleables (servicios, profesional, tradiciones) → cada uno lleva a su pagina SEO
- 2 botones unicamente:
  - Contactar por WhatsApp → redirect interno (tracking) → abre WhatsApp con mensaje prefijado
  - Visitar sitio web (si tiene) → redirect interno (tracking) → abre URL con `rel="ugc nofollow"`
- Sin telefono visible, sin email, sin otra forma de contacto

**Paginas SEO auto-generadas:**
- `/co/amarres-de-amor` — anuncios de Amor y Relaciones en Colombia
- `/co/santeros` — anuncios de Santeros en Colombia
- `/co/tarot` — anuncios con tradicion Tarot en Colombia

---

## Seccion 4: Dashboard del Anunciante

**Mis Anuncios:**
- Lista de sus anuncios con estado (Activo, Expirado, Rechazado)
- Boton "Reactivar" en anuncios expirados (1 clic)
- Boton "Editar" (pasa de nuevo por el pipeline anti-spam)
- Boton "Eliminar"

**Metricas por anuncio:**
- Vistas del anuncio (cuanta gente lo vio)
- Clics en WhatsApp (cuantos contactaron)
- Clics en sitio web (si tiene)
- Grafica semanal simple (ultimas 4 semanas)
- Tasa de conversion: clics WhatsApp / vistas

**Boton "Republicar" (Bump):**
- 1 clic → el anuncio sube al tope de la lista
- Orden: Patrocinados (futuro) > Republicados recientes > Cronologico normal
- Limite: maximo 1 republicacion cada 24-48 horas
- Futuro: feature de pago ("republicar ilimitado por $X/mes")

**Metrica de posicion:**
- "Tu anuncio esta en posicion #12 de 45 en Amor y Relaciones / Colombia"
- Recalculada periodicamente
- Motiva al anunciante a republicar y mejorar su anuncio

**Emails automaticos:**
- Dia 54: "Tu anuncio expirara en 6 dias. Tiene 83 vistas y 12 contactos. Reactivalo aqui."
- Dia 60: "Tu anuncio ha expirado. Reactivalo en 1 clic."
- Semanal (opcional): "Tu anuncio recibio 15 vistas y 3 contactos esta semana."

---

## Seccion 5: Panel de Administracion

- **Metricas globales:** total anuncios activos, usuarios registrados, clics totales del dia/semana/mes
- **Anuncios reportados:** lista de anuncios con >3 reportes, con boton ocultar/bloquear
- **Usuarios bloqueados:** lista con opcion de desbloquear
- **Anuncios rechazados:** ver por que el pipeline los rechazo

**Cron jobs automaticos:**
- Cada hora: expirar anuncios que cumplieron 60 dias
- Diario: enviar emails de aviso (dia 54) y expiracion (dia 60)
- Semanal: recalcular reputacion de usuarios, enviar reporte semanal
- Mensual: limpiar anuncios expirados hace >90 dias

---

## Seccion 6: Features Avanzadas

### Version Machine (Markdown para agentes IA)
- Cualquier pagina con `Accept: text/markdown` devuelve markdown puro (<5KB)
- Los links de contacto pasan por redirect (tracking funciona igual)

### Push Notifications + PWA
- PWA instalable desde el navegador
- Push notifications: contactos nuevos, expiracion, metricas

### Backlink Progresivo
| Reputacion | Backlink | Mensaje al anunciante |
|---|---|---|
| Nueva cuenta | Sin backlink | "Publica tu primer anuncio" |
| > 80 puntos | `rel="ugc nofollow"` | "Tu sitio web aparece en tu anuncio" |
| > 150 puntos | `rel="ugc"` (dofollow) | "Tu sitio web recibe un backlink SEO" |

### Referral "Invita a un colega"
- Anunciante invita a otro profesional → ambos reciben beneficio
- Compartir via WhatsApp

### Badge de Verificacion
- Anunciante agrega sello de WebClasificados en su web
- Sistema verifica periodicamente → boost de posicion

### SEO Programatico por Ciudad
- 225+ landing pages automaticas: 15 servicios x 15 ciudades principales
- `/brujos-en-bogota`, `/tarotistas-en-medellin`, `/amarres-de-amor-en-cali`
- Contenido util (FAQ, descripcion del servicio) aunque no haya anuncios aun

### Blog con Contenido SEO
- `/blog/oraciones/oracion-para-el-amor`
- `/blog/guias/como-funciona-un-amarre`
- Cada articulo incluye al final anuncios relacionados

### Auto-publicacion en Redes Sociales
- Al publicar anuncio → posts automaticos en Facebook, Instagram, X, Pinterest
- Anunciante recibe links para interactuar con los posts
- Seguir la cuenta en redes → badge "Verificado en redes"

### Google Business Profile
- Pedir resenas a anunciantes satisfechos (dia 7 post-registro)
- Banner sutil en dashboard

---

## 27 Escenarios Observables

| # | Escenario | Area |
|---|---|---|
| 1 | Registro exitoso | Auth |
| 2 | Publicacion exitosa de anuncio | Publicacion |
| 3 | Pipeline anti-spam bloquea telefono en texto | Anti-spam |
| 4 | OCR bloquea imagen con telefono | Anti-spam |
| 5 | Duplicado detectado | Anti-spam |
| 6 | Click tracking en WhatsApp | Metricas |
| 7 | Expiracion y reactivacion | Ciclo de vida |
| 8 | Republicar (Bump) | Ciclo de vida |
| 9 | Paginas SEO auto-generadas | SEO |
| 10 | Validacion de texto estricta | Anti-spam |
| 11 | Limite de anuncios por cuenta | Publicacion |
| 12 | Compartir anuncio en WhatsApp muestra preview | UX |
| 13 | Google indexa correctamente | SEO |
| 14 | Favoritos | UX |
| 15 | Anuncios relacionados | UX |
| 16 | Pagina 404 personalizada | UX |
| 17 | Paginas legales | Legal |
| 18 | Version machine (markdown para agentes IA) | Machine |
| 19 | Push notification de contacto nuevo | Notificaciones |
| 20 | Backlink progresivo por reputacion | SEO |
| 21 | SEO programatico con paginas por ciudad | SEO |
| 22 | Referral "Invita a un colega" | Growth |
| 23 | PWA instalable | UX |
| 24 | Auto-publicacion en redes sociales | Growth |
| 25 | Badge de verificacion para backlinks | Growth |
| 26 | Google Business Profile y resenas | Growth |
| 27 | Blog con contenido SEO | SEO |
