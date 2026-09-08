/**
 * Generates a unique, random alphanumeric invite code for families.
 * Example without surname: MANDADO-K8Y4B2
 * Example with surname: MANDADO-GONZALEZ-K8Y4B2
 * Omits ambiguous characters (0, O, 1, I) to make it easy to type and share.
 */
export function generateFamilyInviteCode(surname?: string): string {
  let prefix = 'MANDADO';

  if (surname && surname.trim()) {
    const cleanSurname = surname
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents (e.g. González -> GONZALEZ)
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 14);

    if (cleanSurname) {
      prefix += `-${cleanSurname}`;
    }
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars.charAt(randomIndex);
  }
  return `${prefix}-${randomPart}`;
}
