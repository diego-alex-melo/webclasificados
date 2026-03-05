export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const PHONE_REGEX =
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;

// Written-out phone digits in Spanish: "tres cero cero uno dos tres..."
const WRITTEN_DIGITS =
  /(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)(?:[-\s]+(?:cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)){5,}/i;

const URL_REGEX =
  /https?:\/\/|www\.|\.com\b|\.co\b|\.net\b|\.org\b|\.io\b|\.info\b|\.biz\b/i;

const PRICE_REGEX =
  /\$\s?\d|COP|USD|EUR|precio\s*[:=]?\s*\d|\d+[.,]\d{3}\s*(?:pesos|cop|usd)/i;

// Match emoji Unicode ranges (comprehensive)
const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2702}-\u{27B0}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

function uppercaseRatio(text: string): number {
  const letters = text.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, '');
  if (letters.length === 0) return 0;
  const upper = letters.replace(/[^A-ZÁÉÍÓÚÑ]/g, '').length;
  return upper / letters.length;
}

export function validateText(
  title: string,
  description: string,
): ValidationResult {
  // 1. Min length
  if (title.length < 10) {
    return {
      valid: false,
      reason: 'El título debe tener al menos 10 caracteres',
    };
  }
  if (description.length < 50) {
    return {
      valid: false,
      reason: 'La descripción debe tener al menos 50 caracteres',
    };
  }

  // 2. Excessive uppercase
  if (uppercaseRatio(title) > 0.3) {
    return {
      valid: false,
      reason: 'El título no puede tener mayúsculas excesivas',
    };
  }
  if (uppercaseRatio(description) > 0.3) {
    return {
      valid: false,
      reason: 'La descripción no puede tener mayúsculas excesivas',
    };
  }

  // 3. Phone numbers
  const combined = `${title} ${description}`;
  if (PHONE_REGEX.test(combined) || WRITTEN_DIGITS.test(combined)) {
    return {
      valid: false,
      reason: 'No se permiten números de teléfono',
    };
  }

  // 4. URLs
  if (URL_REGEX.test(combined)) {
    return {
      valid: false,
      reason: 'No se permiten enlaces en la descripción',
    };
  }

  // 5. Prices/currency
  if (PRICE_REGEX.test(combined)) {
    return {
      valid: false,
      reason: 'No se permiten precios en el anuncio',
    };
  }

  // 6. Excessive emojis
  const emojiMatches = combined.match(EMOJI_REGEX);
  if (emojiMatches && emojiMatches.length > 5) {
    return {
      valid: false,
      reason: 'Demasiados emojis en el anuncio',
    };
  }

  return { valid: true };
}
