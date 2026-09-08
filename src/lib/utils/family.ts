/**
 * Generates a unique, random alphanumeric invite code for families.
 * Example: MANDADO-K8Y4B2
 * Omits ambiguous characters (0, O, 1, I) to make it easy to type and share.
 */
export function generateFamilyInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars.charAt(randomIndex);
  }
  return `MANDADO-${randomPart}`;
}
