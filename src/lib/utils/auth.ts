/**
 * Authentication helpers for Mandado
 * Generates deterministic internal credentials for users based on
 * username and family code, eliminating the need for email input.
 */

export function normalizeAuthIdentifier(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (e.g. nicolás -> nicolas)
    .replace(/[^a-z0-9]/g, '');      // only alphanumeric characters
}

export function getInternalAuthEmail(username: string, familyCode: string): string {
  const user = normalizeAuthIdentifier(username);
  const fam = normalizeAuthIdentifier(familyCode);
  return `${user}_${fam}@mandado.app`;
}
