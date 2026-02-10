// Fichier : lib/security.ts

export function normalizeEmail(email: string): string {
  if (!email) return "";

  // CORRECTION : 'const' au lieu de 'let' car la variable n'est pas réassignée
  const normalized = email.toLowerCase().trim();

  const [localPart, domain] = normalized.split("@");

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = localPart.split("+")[0];
    const noDots = cleanLocal.replace(/\./g, "");
    return `${noDots}@${domain}`;
  }

  return normalized;
}

const BLOCKED_DOMAINS = ["yopmail.com", "tempmail.com", "guerrillamail.com"];

export function isBlockedEmail(email: string): boolean {
  if (!email) return false; // Sécurité anti-crash
  const domain = email.split("@")[1];
  return BLOCKED_DOMAINS.includes(domain);
}
