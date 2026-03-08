import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import ContactForm from './ContactForm';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

export const metadata: Metadata = {
  title: 'Ayuda',
  description: 'Preguntas frecuentes y formulario de contacto de BrujosClassifieds.',
  alternates: { canonical: `${BASE_URL}/ayuda` },
};

const faqs = [
  {
    question: '¿Qué es BrujosClassifieds?',
    answer:
      'BrujosClassifieds es una plataforma de clasificados en línea especializada en servicios esotéricos. Conectamos a profesionales esotéricos (brujos, tarotistas, santeros, videntes, etc.) con personas que buscan sus servicios en toda Latinoamérica.',
  },
  {
    question: '¿Cómo publico un anuncio?',
    answer:
      'Para publicar un anuncio, debes crear una cuenta con tu número de WhatsApp y correo electrónico. Una vez verificados, puedes crear tu anuncio con título, descripción, categoría de servicio y fotos. El anuncio será revisado automáticamente y publicado en minutos.',
  },
  {
    question: '¿Cuánto cuesta publicar un anuncio?',
    answer:
      'Publicar un anuncio en BrujosClassifieds es completamente gratis. No cobramos por la publicación ni por los contactos que recibas.',
  },
  {
    question: '¿Cuántos anuncios puedo tener?',
    answer:
      'Cada cuenta puede tener máximo 3 anuncios activos, cada uno con un número de WhatsApp diferente. Esto nos permite mantener la calidad de la plataforma y asegurar que cada anuncio reciba visibilidad.',
  },
  {
    question: '¿Cuánto tiempo dura mi anuncio?',
    answer:
      'Los anuncios permanecen activos durante 60 días. Antes de expirar, te enviaremos un recordatorio por email. Una vez expirado, puedes reactivarlo gratuitamente desde el enlace que te enviaremos.',
  },
  {
    question: '¿Mi número de teléfono es visible?',
    answer:
      'No. Tu número de WhatsApp NUNCA se muestra públicamente. Los interesados te contactan a través del botón de WhatsApp que genera un mensaje predeterminado. Tu privacidad está protegida.',
  },
  {
    question: '¿Cómo me contactan los interesados?',
    answer:
      'Los usuarios interesados hacen clic en el botón "Contactar por WhatsApp" en tu anuncio, lo que abre WhatsApp con un mensaje predeterminado: "Hola, vi tu anuncio \'[TÍTULO]\' en BrujosClassifieds y quiero más información." También puedes incluir un enlace a tu sitio web.',
  },
  {
    question: '¿Qué es el botón de "destacar" anuncio?',
    answer:
      'Puedes destacar tu anuncio cada 48 horas para que aparezca en las primeras posiciones de las búsquedas. Esta función es gratuita.',
  },
  {
    question: '¿Por qué fue rechazado mi anuncio?',
    answer:
      'Los anuncios son revisados automáticamente. Pueden ser rechazados si contienen números de teléfono o URLs en las imágenes, contenido duplicado, texto sospechoso de fraude, o si tu cuenta tiene baja reputación. Si crees que fue un error, puedes editar y volver a publicar.',
  },
  {
    question: '¿Qué países están disponibles?',
    answer:
      'BrujosClassifieds está disponible para toda Latinoamérica y España. Los principales países incluyen Colombia, México, Argentina, Perú, Chile, Ecuador, Venezuela, y más.',
  },
  {
    question: '¿BrujosClassifieds garantiza los servicios de los anunciantes?',
    answer:
      'No. BrujosClassifieds es únicamente una plataforma de clasificados. No ofrecemos, respaldamos ni garantizamos los servicios publicados. Te recomendamos investigar al profesional antes de contratar cualquier servicio. Consulta nuestro Descargo de Responsabilidad para más información.',
  },
  {
    question: '¿Cómo reporto un anuncio fraudulento?',
    answer:
      'Si sospechas que un anuncio es fraudulento o viola nuestros términos, puedes reportarlo. Investigaremos y tomaremos medidas que pueden incluir la remoción del anuncio y bloqueo de la cuenta del anunciante.',
  },
];

export default function AyudaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Ayuda' },
        ]}
      />

      <h1 className="mb-8 text-3xl font-bold text-text-primary">Preguntas Frecuentes</h1>

      <div className="divide-y divide-white/5 rounded-xl border border-white/10">
        {faqs.map((faq, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-text-primary transition-colors hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
              <h2 className="text-base font-semibold">{faq.question}</h2>
              <span className="shrink-0 text-text-secondary transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-6 pb-5 pt-0">
              <p className="text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-accent-purple/20 bg-accent-purple/5 p-5 text-center">
        <p className="text-sm text-text-secondary">
          Si eres anunciante, consulta nuestra{' '}
          <Link href="/guia" className="font-medium text-accent-purple-light hover:text-accent-gold transition-colors">
            Guia del Anunciante
          </Link>{' '}
          para conocer todo sobre reputacion, limites, sello verificado y mas.
        </p>
      </div>

      <div id="contacto" className="mt-16">
        <h2 className="mb-2 text-2xl font-bold text-text-primary">¿No encontraste respuesta?</h2>
        <p className="mb-8 text-text-secondary">
          Envíanos un mensaje y te responderemos en 48 horas.
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
