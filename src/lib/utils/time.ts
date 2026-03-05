export function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'hace un momento';
  if (minutes === 1) return 'hace 1 minuto';
  if (minutes < 60) return `hace ${minutes} minutos`;
  if (hours === 1) return 'hace 1 hora';
  if (hours < 24) return `hace ${hours} horas`;
  if (days === 1) return 'hace 1 día';
  if (days < 30) return `hace ${days} días`;

  const months = Math.floor(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return `hace ${months} meses`;

  const years = Math.floor(days / 365);
  if (years === 1) return 'hace 1 año';
  return `hace ${years} años`;
}
