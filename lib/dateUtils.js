/**
 * Utilitaires de formatage de dates/heures pour le fuseau horaire France (Europe/Paris).
 * Toujours utiliser ces fonctions plutôt que new Date().toLocale*() directement.
 */

const LOCALE = 'fr-FR';
const TZ = 'Europe/Paris';

/**
 * Normalise n'importe quelle entrée (string ISO, Date, timestamp)
 * pour éviter les décalages de parsing UTC/local.
 */
function toDate(input) {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  let str = String(input).trim();
  // Si la chaîne ressemble à un timestamp SQL 'YYYY-MM-DD HH:mm:ss' sans fuseau, on l'interprète en UTC
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(str)) {
    if (!str.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formate une date en date courte : "15/10/2026"
 */
export function formatDate(date) {
  const d = toDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formate une date en date longue : "15 octobre 2026"
 */
export function formatDateLong(date) {
  const d = toDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Formate une date en date courte avec mois abrégé : "15 oct. 2026"
 */
export function formatDateShort(date) {
  const d = toDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formate une heure en fuseau France : "14:35"
 */
export function formatTime(date) {
  const d = toDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Formate date + heure courtes : "15/10/2026 14:35"
 */
export function formatDateTime(date) {
  const d = toDate(date);
  if (!d) return '-';
  const datePart = formatDate(d);
  const timePart = formatTime(d);
  return `${datePart} ${timePart}`;
}

/**
 * Formate la date et l'heure pour la messagerie et les notes : "15/10/2026 14:35"
 * Garanti à 100% dans le fuseau Europe/Paris.
 */
export function formatMessageDate(date) {
  const d = toDate(date);
  if (!d) return '';
  const datePart = formatDate(d);
  const timePart = formatTime(d);
  return `${datePart} ${timePart}`;
}

/**
 * Formate date + heure longues : "15 octobre 2026 à 14:35"
 */
export function formatDateTimeLong(date) {
  const d = toDate(date);
  if (!d) return '-';
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/**
 * Retourne la date du jour formatée : "15/10/2026"
 */
export function todayFormatted() {
  return formatDate(new Date());
}

/**
 * Retourne l'heure actuelle formatée : "14:35"
 */
export function nowTimeFormatted() {
  return formatTime(new Date());
}

/**
 * Formate un montant en euros : "1 234,56 €"
 */
export function formatEuro(amount) {
  if (amount === null || amount === undefined) return '-';
  return Number(amount).toLocaleString(LOCALE, {
    style: 'currency',
    currency: 'EUR',
  });
}
