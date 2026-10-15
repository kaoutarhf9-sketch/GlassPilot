/**
 * Utilitaires de formatage de dates/heures pour le fuseau horaire France (Europe/Paris).
 * Toujours utiliser ces fonctions plutôt que new Date().toLocale*() directement.
 */

const LOCALE = 'fr-FR';
const TZ = 'Europe/Paris';

/**
 * Formate une date en date courte : "15/10/2025"
 */
export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(LOCALE, { timeZone: TZ });
}

/**
 * Formate une date en date longue : "15 octobre 2025"
 */
export function formatDateLong(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formate une date en date courte avec mois abrégé : "15 oct. 2025"
 */
export function formatDateShort(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formate une heure : "14:35"
 */
export function formatTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString(LOCALE, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formate date + heure courtes : "15/10/2025 14:35"
 */
export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString(LOCALE, {
    timeZone: TZ,
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Formate date + heure longues : "15 octobre 2025 à 14:35"
 */
export function formatDateTimeLong(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString(LOCALE, {
    timeZone: TZ,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retourne la date du jour formatée : "15/10/2025"
 */
export function todayFormatted() {
  return new Date().toLocaleDateString(LOCALE, { timeZone: TZ });
}

/**
 * Retourne l'heure actuelle formatée : "14:35"
 */
export function nowTimeFormatted() {
  return new Date().toLocaleTimeString(LOCALE, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
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
