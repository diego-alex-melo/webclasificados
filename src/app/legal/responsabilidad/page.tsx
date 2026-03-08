import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

export const metadata: Metadata = {
  title: 'Descargo de Responsabilidad',
  description: 'Descargo de responsabilidad sobre los servicios esotéricos publicados en BrujosClassifieds.',
  alternates: { canonical: `${BASE_URL}/legal/responsabilidad` },
};

export default function ResponsabilidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Descargo de Responsabilidad' },
        ]}
      />

      <article className="prose-invert space-y-6 text-text-secondary leading-relaxed">
        <h1 className="text-3xl font-bold text-text-primary">Descargo de Responsabilidad</h1>
        <p className="text-sm">Última actualización: marzo 2026</p>

        <div className="rounded-xl border border-accent-gold/20 bg-accent-gold/5 p-6">
          <p className="font-semibold text-accent-gold">Aviso Importante</p>
          <p className="mt-2">
            BrujosClassifieds es una plataforma de clasificados que facilita el contacto entre
            profesionales esotéricos y personas interesadas en sus servicios.
            <strong> BrujosClassifieds NO ofrece, respalda, garantiza ni se hace responsable de
            ningún servicio esotérico publicado en la Plataforma.</strong>
          </p>
        </div>

        <h2 className="text-xl font-semibold text-text-primary">1. Naturaleza de los Servicios</h2>
        <p>
          Los servicios esotéricos publicados en la Plataforma (incluyendo pero no limitado a
          tarot, brujería, santería, chamanismo, videncia, astrología, curandería y trabajos
          espirituales) son ofrecidos por terceros independientes. BrujosClassifieds no verifica
          la efectividad, autenticidad o resultados de dichos servicios.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">2. Sin Garantías</h2>
        <p>BrujosClassifieds NO garantiza:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>La efectividad o resultados de los servicios anunciados.</li>
          <li>La veracidad de las afirmaciones hechas por los anunciantes.</li>
          <li>Las credenciales, experiencia o capacidades de los profesionales.</li>
          <li>Que los servicios cumplan con las expectativas del usuario.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">3. Responsabilidad del Usuario</h2>
        <p>
          Al contactar a un anunciante a través de la Plataforma, lo haces bajo tu propia
          responsabilidad y criterio. Te recomendamos:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Investigar al profesional antes de contratar sus servicios.</li>
          <li>No compartir información financiera sensible.</li>
          <li>Desconfiar de promesas de resultados garantizados.</li>
          <li>Consultar a un profesional de salud para temas médicos.</li>
          <li>Nunca sustituir tratamientos médicos por servicios esotéricos.</li>
        </ul>

        <h2 className="text-xl font-semibold text-text-primary">4. Servicios NO Médicos</h2>
        <p>
          Los servicios esotéricos NO son servicios médicos, psicológicos ni terapéuticos reconocidos
          por la ciencia. No deben utilizarse como sustituto de atención médica profesional.
          Si tienes un problema de salud, consulta a un profesional médico certificado.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">5. Transacciones Económicas</h2>
        <p>
          Cualquier pago o transacción económica entre usuarios y anunciantes se realiza fuera
          de la Plataforma y bajo la exclusiva responsabilidad de las partes involucradas.
          BrujosClassifieds no procesa pagos ni media en disputas económicas.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">6. Reporte de Fraude</h2>
        <p>
          Si sospechas que un anunciante está cometiendo fraude o actividades ilícitas, te invitamos
          a reportarlo. Investigaremos y tomaremos las medidas correspondientes, incluyendo la
          remoción del anuncio y bloqueo de la cuenta.
        </p>

        <h2 className="text-xl font-semibold text-text-primary">7. Limitación de Responsabilidad</h2>
        <p>
          En la máxima medida permitida por la ley, BrujosClassifieds, sus propietarios, empleados
          y afiliados no serán responsables por daños directos, indirectos, incidentales o
          consecuentes derivados del uso de la Plataforma o de la contratación de servicios
          publicados en ella.
        </p>
      </article>
    </div>
  );
}
