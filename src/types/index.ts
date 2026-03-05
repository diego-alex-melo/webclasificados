export type AdStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REJECTED';
export type ClickType = 'WHATSAPP' | 'WEBSITE' | 'VIEW';
export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'PINTEREST' | 'GOOGLE_BUSINESS';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export const PROFESSIONAL_TYPES = [
  'Brujo/a',
  'Chamán',
  'Santero/a',
  'Tarotista',
  'Vidente',
  'Médium',
  'Astrólogo/a',
  'Curandero/a',
] as const;

export type ProfessionalType = typeof PROFESSIONAL_TYPES[number];

export const COUNTRY_CODES: Record<string, string> = {
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
