const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PERSONAL_EMAIL_DOMAINS: readonly string[] = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "protonmail.com",
];

function esEmailValido(valor: string): boolean {
  return EMAIL_REGEX.test(valor);
}

function esEmailCorporativo(email: string): boolean {
  if (!esEmailValido(email)) return false;

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return !PERSONAL_EMAIL_DOMAINS.includes(domain);
}
