const COUNTRY_CODES: Record<string, string> = {
  '+57': 'CO',
  '+52': 'MX',
  '+1': 'US',
  '+34': 'ES',
  '+51': 'PE',
  '+56': 'CL',
  '+54': 'AR',
  '+593': 'EC',
  '+58': 'VE',
  '+507': 'PA',
  '+506': 'CR',
  '+502': 'GT',
  '+503': 'SV',
  '+504': 'HN',
  '+505': 'NI',
  '+591': 'BO',
  '+595': 'PY',
  '+598': 'UY',
  '+809': 'DO',
};

export function countryFromPhone(whatsappNumber: string): string {
  const sorted = Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (whatsappNumber.startsWith(prefix)) {
      return COUNTRY_CODES[prefix];
    }
  }
  return 'XX';
}
