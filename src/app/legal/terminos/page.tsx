import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Términos de Servicio',
  description: 'Términos y condiciones de uso de BrujosClassifieds, plataforma de servicios esotéricos.',
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Términos de Servicio' },
        ]}
      />

      <article className="prose-invert space-y-6 text-text-secondary leading-relaxed">
        <h1 className="text-3xl font-bold text-text-primary">Términos de Servicio</h1>
        <p className="text-sm">Última actualización: marzo 2026</p>

        <h2 className="text-xl font-semibold text-text-primary">1. Aceptación de los Términos</h2>
        <p>
          Al acceder y utilizar BrujosClassifieds (&ldquo;la Plataforma&rdquo;), aceptas cumplir con estos
          Términos de Servicio. Si no estás de acuerdo, no utilices la Plataforma.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">2. Descripción del Servicio</h2>
        <p>
          BrujosClassifieds es una plataforma de clasificados en línea que permite a profesionales
          esotéricos publicar anuncios de sus servicios. La Plataforma actúa únicamente como
          intermediario de contacto entre anunciantes y usuarios.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">3. Registro y Cuenta</h2>
        <p>
          Para publicar anuncios, debes crear una cuenta proporcionando un número de teléfono
          válido y un correo electrónico. Solo se permite una cuenta por número de teléfono.
          Eres responsable de mantener la confidencialidad de tu cuenta.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">4. Publicación de Anuncios</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Cada anunciante puede tener máximo 1 anuncio activo.</li>
          <li>Los anuncios expiran automáticamente después de 60 días.</li>
          <li>Los anuncios pueden ser reactivados mediante el enlace enviado por email.</li>
          <li>El contenido debe ser veraz y no engañoso.</li>
          <li>Está prohibido incluir números de teléfono o URLs en imágenes.</li>
          <li>La Plataforma se reserva el derecho de rechazar o remover anuncios que incumplan estas condiciones.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">5. Conducta del Usuario</h2>
        <p>Te comprometes a no:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Publicar contenido ilegal, fraudulento o engañoso.</li>
          <li>Crear múltiples cuentas.</li>
          <li>Manipular el sistema de reputación.</li>
          <li>Utilizar la Plataforma para actividades que violen la ley colombiana o las leyes de tu país.</li>
          <li>Enviar spam o comunicaciones no solicitadas a través de la Plataforma.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">6. Propiedad Intelectual</h2>
        <p>
          Al publicar contenido en la Plataforma, otorgas a BrujosClassifieds una licencia no exclusiva,
          gratuita y mundial para mostrar, distribuir y promocionar tu contenido dentro de la Plataforma
          y en redes sociales asociadas.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">7. Limitación de Responsabilidad</h2>
        <p>
          BrujosClassifieds NO es responsable de los servicios ofrecidos por los anunciantes.
          La Plataforma no garantiza la veracidad, calidad o efectividad de los servicios publicados.
          Los usuarios contratan servicios bajo su propia responsabilidad.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">8. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios
          serán efectivos al publicarlos en la Plataforma. El uso continuado implica aceptación de
          los nuevos términos.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">9. Ley Aplicable</h2>
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa
          será sometida a los tribunales de Colombia.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">10. Contacto</h2>
        <p>
          Para consultas sobre estos Términos, contáctanos a través de los canales disponibles
          en la Plataforma.
        </p>
      </article>
    </div>
  );
}
