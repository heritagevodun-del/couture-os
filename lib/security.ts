// Fichier : lib/security.ts

export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";

  const normalized = email.toLowerCase().trim();

  // 🛡️ SÉCURITÉ : On vérifie que c'est bien une structure d'e-mail avant de parser
  if (!normalized.includes("@")) return normalized;

  const [localPart, domain] = normalized.split("@");

  // 🛡️ ANTI-ABUS : Neutralise les alias Gmail (empêche la création de multiples comptes d'essai)
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const cleanLocal = localPart.split("+")[0];
    const noDots = cleanLocal.replace(/\./g, "");
    return `${noDots}@${domain}`;
  }

  return normalized;
}

// 🛡️ BASE DE DONNÉES ÉTENDUE : Les services d'e-mails jetables les plus utilisés
const BLOCKED_DOMAINS = [
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "trashmail.com",
  "dispostable.com",
  "sharklasers.com",
  "getairmail.com",
  "anonaddy.me",
  "catchinator.com",
  "throwawaymail.com",
  "maildrop.cc",
];

export function isBlockedEmail(email: string): boolean {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return false;
  }

  const domain = email.split("@")[1].toLowerCase().trim();
  return BLOCKED_DOMAINS.includes(domain);
}
