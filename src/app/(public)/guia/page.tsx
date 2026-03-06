import type { Metadata } from 'next';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guia del Anunciante',
  description:
    'Todo lo que necesitas saber para publicar y gestionar tus anuncios en BrujosClassifieds: reputacion, limites, sello verificado y mas.',
};

export default function GuiaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Guia del Anunciante' },
        ]}
      />

      <h1 className="mb-2 text-3xl font-bold text-text-primary">
        Guia del Anunciante
      </h1>
      <p className="mb-10 text-text-secondary">
        Todo lo que necesitas saber para aprovechar al maximo tu presencia en BrujosClassifieds.
      </p>

      {/* Table of contents */}
      <nav className="mb-12 rounded-xl border border-white/10 p-6">
        <p className="mb-3 text-sm font-semibold text-text-primary">Contenido</p>
        <ol className="space-y-1.5 text-sm text-accent-purple-light">
          <li><a href="#primeros-pasos" className="hover:text-accent-gold transition-colors">1. Primeros pasos</a></li>
          <li><a href="#tus-anuncios" className="hover:text-accent-gold transition-colors">2. Tus anuncios</a></li>
          <li><a href="#reputacion" className="hover:text-accent-gold transition-colors">3. Tu reputacion</a></li>
          <li><a href="#sello-verificado" className="hover:text-accent-gold transition-colors">4. Sello verificado</a></li>
          <li><a href="#moderacion" className="hover:text-accent-gold transition-colors">5. Moderacion</a></li>
        </ol>
      </nav>

      {/* 1. Primeros pasos */}
      <Section id="primeros-pasos" title="1. Primeros pasos">
        <ol className="list-decimal space-y-3 pl-5 text-text-secondary leading-relaxed">
          <li>
            <strong className="text-text-primary">Crea tu cuenta</strong> — Registrate con tu
            numero de WhatsApp y correo electronico. Verificaremos ambos para proteger la plataforma.
          </li>
          <li>
            <strong className="text-text-primary">Publica tu anuncio</strong> — Agrega un titulo
            descriptivo, una descripcion detallada de tus servicios, selecciona tu pais, categoria y
            tradicion. Puedes subir una imagen representativa.
          </li>
          <li>
            <strong className="text-text-primary">Revision automatica</strong> — Nuestro sistema
            revisa el contenido en segundos. Si todo esta bien, tu anuncio se publica de inmediato.
          </li>
          <li>
            <strong className="text-text-primary">Recibe contactos</strong> — Los interesados te
            escriben por WhatsApp con un mensaje predeterminado. Tu numero nunca se muestra
            publicamente.
          </li>
        </ol>
      </Section>

      {/* 2. Tus anuncios */}
      <Section id="tus-anuncios" title="2. Tus anuncios">
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <InfoRow label="Anuncios activos" value="Maximo 3 por cuenta (1 por pais)" />
          <InfoRow label="Duracion" value="60 dias desde la publicacion" />
          <InfoRow
            label="Expiracion"
            value="Recibiras un recordatorio por email antes de que expire. Una vez expirado, puedes reactivarlo gratis desde el enlace en el email."
          />
          <InfoRow
            label="Destacar (bump)"
            value="Cada 48 horas puedes destacar tu anuncio para que suba a las primeras posiciones de busqueda. Es gratis."
          />
          <InfoRow
            label="Enlace web"
            value="Puedes agregar 1 URL a tu sitio web en cada anuncio. Los interesados pueden visitarlo desde tu anuncio."
          />
          <InfoRow
            label="Contacto"
            value='Los usuarios te contactan por WhatsApp con el mensaje: "Hola, vi tu anuncio [TITULO] en BrujosClassifieds y quiero mas informacion."'
          />
        </div>
      </Section>

      {/* 3. Reputacion */}
      <Section id="reputacion" title="3. Tu reputacion">
        <p className="mb-4 text-text-secondary leading-relaxed">
          Cada cuenta tiene un puntaje de reputacion entre 0 y 200. Comienzas con <strong className="text-text-primary">100 puntos</strong>.
          A mayor reputacion, mas beneficios obtienes.
        </p>

        <h3 className="mb-3 text-sm font-semibold text-accent-gold">Como ganar puntos</h3>
        <div className="mb-6 overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Accion</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <ReputationRow action="Anuncio con mas de 10 clics en WhatsApp" points="+20" positive />
              <ReputationRow action="Cuenta con mas de 30 dias" points="+10" positive />
              <ReputationRow action="Cuenta con mas de 90 dias" points="+20" positive />
              <ReputationRow action="Tener URL de sitio web en tu anuncio" points="+10" positive />
            </tbody>
          </table>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-red-400">Como perder puntos</h3>
        <div className="mb-6 overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Accion</th>
                <th className="px-4 py-2.5 text-right font-medium text-text-secondary">Puntos</th>
              </tr>
            </thead>
            <tbody>
              <ReputationRow action="Anuncio rechazado por moderacion" points="-30" positive={false} />
            </tbody>
          </table>
        </div>

        <h3 className="mb-3 text-sm font-semibold text-text-primary">Beneficios por nivel</h3>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Reputacion</th>
                <th className="px-4 py-2.5 text-left font-medium text-text-secondary">Beneficio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="px-4 py-2.5 text-text-primary">0</td>
                <td className="px-4 py-2.5 text-red-400">Cuenta bloqueada — no puedes publicar</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-primary">100+</td>
                <td className="px-4 py-2.5 text-text-secondary">Publicacion normal (cuenta nueva)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-primary">150+</td>
                <td className="px-4 py-2.5 text-accent-gold">Tu enlace web pasa de <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">nofollow</code> a <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">dofollow</code> (beneficio SEO)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4. Sello verificado */}
      <Section id="sello-verificado" title="4. Sello verificado">
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            Puedes obtener un sello de &ldquo;Verificado en BrujosClassifieds&rdquo; para mostrar en tu
            sitio web. Esto genera confianza en tus visitantes y te da un beneficio adicional.
          </p>

          <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-3 text-sm text-accent-gold">
            Si detectamos el sello en tu sitio web, tu anuncio recibe un boost de posicion en las
            busquedas.
          </div>

          <h3 className="text-sm font-semibold text-text-primary">Como obtenerlo</h3>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Ve a tu <Link href="/dashboard/badge" className="text-accent-purple-light hover:text-accent-gold transition-colors">panel &rarr; Sello verificado</Link>.</li>
            <li>Copia el codigo HTML.</li>
            <li>Pegalo en tu sitio web (footer, sidebar o pagina de contacto).</li>
            <li>Nuestro sistema verificara automaticamente que el sello este presente.</li>
          </ol>
        </div>
      </Section>

      {/* 5. Moderacion */}
      <Section id="moderacion" title="5. Moderacion">
        <div className="space-y-4 text-text-secondary leading-relaxed">
          <p>
            Todos los anuncios pasan por un sistema de moderacion automatica antes de ser publicados.
            Esto protege a los usuarios y mantiene la calidad de la plataforma.
          </p>

          <h3 className="text-sm font-semibold text-text-primary">Motivos de rechazo</h3>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Numeros de telefono o URLs visibles en las imagenes</li>
            <li>Contenido duplicado (titulo + descripcion ya existente)</li>
            <li>Texto que el sistema detecta como fraude o spam</li>
            <li>Reputacion de cuenta por debajo del umbral minimo</li>
            <li>Superar el limite de 3 anuncios activos</li>
          </ul>

          <h3 className="text-sm font-semibold text-text-primary">Si tu anuncio fue rechazado</h3>
          <p>
            Puedes editar tu anuncio y volver a publicarlo. Si crees que fue un error, puedes{' '}
            <Link href="/ayuda#contacto" className="text-accent-purple-light hover:text-accent-gold transition-colors">
              contactarnos
            </Link>{' '}
            y revisaremos tu caso.
          </p>
        </div>
      </Section>

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-accent-purple/20 bg-accent-purple/5 p-6 text-center">
        <p className="mb-3 text-lg font-semibold text-text-primary">
          Listo para publicar?
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-full bg-accent-purple px-6 py-3 text-sm font-medium text-white transition-all hover:brightness-110"
        >
          Crear mi anuncio
        </Link>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="mb-4 text-xl font-bold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-sm font-medium text-text-primary sm:w-40">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ReputationRow({
  action,
  points,
  positive,
}: {
  action: string;
  points: string;
  positive: boolean;
}) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-text-secondary">{action}</td>
      <td className={`px-4 py-2.5 text-right font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {points}
      </td>
    </tr>
  );
}
