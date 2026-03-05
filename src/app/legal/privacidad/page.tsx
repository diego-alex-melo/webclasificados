import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de WebClasificados.',
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Política de Privacidad' },
        ]}
      />

      <article className="prose-invert space-y-6 text-text-secondary leading-relaxed">
        <h1 className="text-3xl font-bold text-text-primary">Política de Privacidad</h1>
        <p className="text-sm">Última actualización: marzo 2026</p>

        <h2 className="text-xl font-semibold text-text-primary">1. Información que Recopilamos</h2>
        <p>Recopilamos los siguientes datos personales:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li><strong>Datos de registro:</strong> correo electrónico, número de WhatsApp, país.</li>
          <li><strong>Datos de anuncios:</strong> título, descripción, imágenes, tipo de servicio.</li>
          <li><strong>Datos de uso:</strong> clics en botones de contacto, búsquedas, páginas visitadas.</li>
          <li><strong>Datos técnicos:</strong> dirección IP (hasheada), navegador, dispositivo.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">2. Uso de la Información</h2>
        <p>Utilizamos tu información para:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Proporcionar y mantener el servicio de clasificados.</li>
          <li>Verificar la identidad de los anunciantes.</li>
          <li>Prevenir fraude y spam mediante sistemas automatizados.</li>
          <li>Enviar notificaciones sobre el estado de tus anuncios (expiración, reactivación).</li>
          <li>Generar estadísticas anónimas de uso.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">3. Protección de tu Número de Teléfono</h2>
        <p>
          Tu número de WhatsApp <strong>NUNCA</strong> se muestra públicamente en la Plataforma.
          El contacto se realiza exclusivamente a través del botón de WhatsApp con mensaje predeterminado,
          que redirige a los interesados sin exponer tu número directamente.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">4. Almacenamiento y Seguridad</h2>
        <p>
          Tus datos se almacenan en servidores seguros. Las contraseñas se almacenan hasheadas
          con algoritmos seguros (bcrypt). Las direcciones IP se almacenan como hashes irreversibles.
          Las imágenes se procesan para eliminar metadatos EXIF antes de almacenarse.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">5. Compartir Información</h2>
        <p>NO vendemos ni compartimos tus datos personales con terceros, excepto:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Proveedores de servicio esenciales (alojamiento, envío de emails, SMS de verificación).</li>
          <li>Cuando sea requerido por ley o autoridad competente.</li>
          <li>Para proteger los derechos y seguridad de la Plataforma y sus usuarios.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">6. Cookies y Almacenamiento Local</h2>
        <p>
          Utilizamos cookies técnicas esenciales para el funcionamiento de la Plataforma.
          También usamos almacenamiento local (localStorage) para funciones como guardar favoritos,
          que se almacenan exclusivamente en tu navegador.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">7. Tus Derechos</h2>
        <p>De acuerdo con la Ley 1581 de 2012 (Colombia), tienes derecho a:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar la eliminación de tus datos cuando no sean necesarios.</li>
          <li>Revocar la autorización para el tratamiento de datos.</li>
          <li>Acceder de forma gratuita a tus datos personales.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">8. Retención de Datos</h2>
        <p>
          Mantenemos tus datos mientras tu cuenta esté activa. Los anuncios expirados se conservan
          por 90 días adicionales. Puedes solicitar la eliminación completa de tu cuenta y datos
          asociados en cualquier momento.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">9. Cambios a esta Política</h2>
        <p>
          Podemos actualizar esta política periódicamente. Te notificaremos cambios significativos
          por correo electrónico. El uso continuado de la Plataforma implica aceptación de la
          política actualizada.
        </p>
      </article>
    </div>
  );
}
