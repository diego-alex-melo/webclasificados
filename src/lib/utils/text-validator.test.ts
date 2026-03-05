import { describe, it, expect } from 'vitest';

import { validateText } from './text-validator';

const VALID_TITLE = 'Lectura de tarot profesional en Bogotá';
const VALID_DESC =
  'Ofrezco lecturas de tarot con más de diez años de experiencia en el campo espiritual. Consultas presenciales y virtuales disponibles para guiarte.';

describe('validateText', () => {
  // ── Min length ──────────────────────────────────────────────────────────

  it('rejects title shorter than 10 characters', () => {
    const result = validateText('Corto', VALID_DESC);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('El título debe tener al menos 10 caracteres');
  });

  it('rejects description shorter than 50 characters', () => {
    const result = validateText(VALID_TITLE, 'Descripción corta.');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('La descripción debe tener al menos 50 caracteres');
  });

  // ── Excessive uppercase ─────────────────────────────────────────────────

  it('rejects title with >30% uppercase', () => {
    const result = validateText('LECTURA DE TAROT PROFESIONAL EN BOGOTÁ', VALID_DESC);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('mayúsculas excesivas');
  });

  it('rejects description with >30% uppercase', () => {
    const loudDesc =
      'OFREZCO LECTURAS DE TAROT CON MÁS DE DIEZ AÑOS DE EXPERIENCIA EN EL CAMPO ESPIRITUAL. CONSULTAS PRESENCIALES Y VIRTUALES PARA GUIARTE.';
    const result = validateText(VALID_TITLE, loudDesc);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('mayúsculas excesivas');
  });

  // ── Phone numbers ─────────────────────────────────────────────────────

  it('detects phone number format 3001234567', () => {
    const desc = VALID_DESC + ' Llámame al 3001234567 para más información sobre las consultas.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten números de teléfono');
  });

  it('detects phone number format 300-123-4567', () => {
    const desc = VALID_DESC + ' Mi número es 300-123-4567, contáctame para reservar tu cita ahora.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten números de teléfono');
  });

  it('detects phone number format 300 123 4567', () => {
    const desc = VALID_DESC + ' Comunícate al 300 123 4567 para agendar tu lectura de tarot hoy.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten números de teléfono');
  });

  it('detects written phone numbers in Spanish', () => {
    const desc =
      VALID_DESC + ' Mi número es tres cero cero uno dos tres cuatro cinco seis siete.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten números de teléfono');
  });

  // ── URLs ──────────────────────────────────────────────────────────────

  it('detects http URLs', () => {
    const desc = VALID_DESC + ' Visita http://mitienda.com para ver más servicios espirituales.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten enlaces en la descripción');
  });

  it('detects www URLs', () => {
    const desc = VALID_DESC + ' Más información en www.mitienda.com sobre consultas espirituales.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten enlaces en la descripción');
  });

  it('detects .com domain references', () => {
    const desc = VALID_DESC + ' Visítame en mitienda.com para más detalles de mis lecturas de tarot.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten enlaces en la descripción');
  });

  // ── Prices ────────────────────────────────────────────────────────────

  it('detects dollar sign prices', () => {
    const desc = VALID_DESC + ' Consulta desde $50.000 pesos, con descuento en la primera visita.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten precios en el anuncio');
  });

  it('detects COP currency mention', () => {
    const desc = VALID_DESC + ' La consulta tiene un valor de cien mil COP incluido material.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('No se permiten precios en el anuncio');
  });

  // ── Emojis ────────────────────────────────────────────────────────────

  it('rejects more than 5 emojis', () => {
    const desc = VALID_DESC + ' 🔮✨🌟💫🌙⭐ Consulta espiritual de alto nivel para ti.';
    const result = validateText(VALID_TITLE, desc);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Demasiados emojis en el anuncio');
  });

  // ── Valid text ────────────────────────────────────────────────────────

  it('passes with clean text', () => {
    const result = validateText(VALID_TITLE, VALID_DESC);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
