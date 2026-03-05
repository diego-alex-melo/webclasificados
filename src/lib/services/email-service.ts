import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key');
}
const EMAIL_FROM = process.env.EMAIL_FROM || 'WebClasificados <noreply@webclasificados.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';

/**
 * Send a verification email with a magic link.
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verifica tu cuenta en WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">¡Bienvenido a WebClasificados!</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente botón:
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Verificar mi cuenta
        </a>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
          Si no creaste esta cuenta, puedes ignorar este mensaje.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send a welcome email after successful email verification.
 */
export async function sendWelcome(email: string, name: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '¡Tu cuenta está verificada! — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">¡Hola${name ? `, ${name}` : ''}!</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Tu cuenta en WebClasificados ha sido verificada exitosamente. Ya puedes publicar tus anuncios.
        </p>
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Ir a mi panel
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send an expiration warning email for an ad.
 */
export async function sendExpirationWarning(
  email: string,
  adTitle: string,
  daysLeft: number,
  metrics: { views: number; clicks: number },
) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Tu anuncio expira en ${daysLeft} días — WebClasificados`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Tu anuncio expira pronto</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Tu anuncio <strong>"${adTitle}"</strong> expira en <strong>${daysLeft} días</strong>.
        </p>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
          Hasta ahora ha recibido ${metrics.views} vistas y ${metrics.clicks} clics.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Si deseas que siga activo, no necesitas hacer nada adicional por ahora.
          Te notificaremos cuando expire para que puedas reactivarlo.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send an expiration notice with a reactivation link.
 */
export async function sendExpiredNotice(
  email: string,
  adTitle: string,
  reactivationToken: string,
) {
  const reactivateUrl = `${APP_URL}/reactivar?token=${reactivationToken}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Tu anuncio ha expirado — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Tu anuncio ha expirado</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Tu anuncio <strong>"${adTitle}"</strong> ha expirado y ya no es visible para los usuarios.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          Si deseas reactivarlo por 30 días más, haz clic en el siguiente botón:
        </p>
        <a href="${reactivateUrl}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Reactivar anuncio
        </a>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
          Este enlace es válido por 7 días.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send onboarding tips email (Day 1 after registration).
 * Teaches advertisers how to improve their ad visibility.
 */
export async function sendOnboardingTips(email: string, adTitle: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Cómo mejorar tu anuncio — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Consejos para mejorar tu anuncio</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          ¡Hola! Tu anuncio <strong>"${adTitle}"</strong> ya está activo. Aquí tienes algunos consejos para que reciba más contactos:
        </p>
        <ul style="font-size: 15px; line-height: 1.8; color: #374151;">
          <li><strong>Título claro y específico:</strong> Incluye tu especialidad y ubicación.</li>
          <li><strong>Descripción detallada:</strong> Explica tus servicios, experiencia y lo que te diferencia.</li>
          <li><strong>Imagen profesional:</strong> Una buena foto genera más confianza.</li>
          <li><strong>Mantén tu anuncio actualizado:</strong> Usa el botón "Destacar" cada 48 horas para aparecer primero.</li>
        </ul>
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Editar mi anuncio
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send metrics reminder email (Day 3 after first ad).
 * Encourages advertisers to check their dashboard.
 */
export async function sendMetricsReminder(
  email: string,
  adTitle: string,
  metrics: { views: number; clicks: number },
) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '¿Ya revisaste tus métricas? — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Tus métricas hasta ahora</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Tu anuncio <strong>"${adTitle}"</strong> ha recibido:
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 20px; margin: 8px 0;"><strong>${metrics.views}</strong> vistas</p>
          <p style="font-size: 20px; margin: 8px 0;"><strong>${metrics.clicks}</strong> clics en WhatsApp</p>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">
          Visita tu panel para ver las estadísticas completas y destacar tu anuncio.
        </p>
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Ver mis métricas
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send Google Business review request email (Day 7 after first ad).
 */
export async function sendGoogleReviewRequest(email: string) {
  const GOOGLE_REVIEW_URL = process.env.GOOGLE_REVIEW_URL || 'https://g.page/webclasificados/review';

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '¿Nos dejas una reseña en Google? — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">¿Cómo ha sido tu experiencia?</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Llevas una semana usando WebClasificados. Tu opinión nos ayuda a mejorar
          y a que más personas conozcan la plataforma.
        </p>
        <p style="font-size: 16px; line-height: 1.5;">
          ¿Nos dejarías una reseña rápida en Google? Solo toma 30 segundos.
        </p>
        <a href="${GOOGLE_REVIEW_URL}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Dejar reseña en Google
        </a>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
          ¡Gracias por ser parte de WebClasificados!
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send a password reset email with a secure link valid for 1 hour.
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Recupera tu contraseña — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Recupera tu contraseña</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en WebClasificados.
          Si fuiste tú, haz clic en el botón de abajo:
        </p>
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Restablecer contraseña
        </a>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
          Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste este cambio,
          puedes ignorar este mensaje — tu contraseña no será modificada.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}

/**
 * Send reactivation confirmation email after an ad is successfully reactivated.
 */
export async function sendReactivationConfirmation(email: string, adTitle: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: '¡Tu anuncio fue reactivado! — WebClasificados',
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">¡Anuncio reactivado!</h1>
        <p style="font-size: 16px; line-height: 1.5;">
          Tu anuncio <strong>"${adTitle}"</strong> ha sido reactivado exitosamente y
          estará visible por 60 días más.
        </p>
        <a href="${APP_URL}/dashboard"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
          Ver mi anuncio
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
          — Equipo WebClasificados
        </p>
      </body>
      </html>
    `,
  });
}
