"use strict";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSONAL_EMAIL_DOMAINS = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "live.com",
    "aol.com",
    "protonmail.com",
];
function esEmailValido(valor) {
    return EMAIL_REGEX.test(valor);
}
function esEmailCorporativo(email) {
    if (!esEmailValido(email))
        return false;
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain)
        return false;
    return !PERSONAL_EMAIL_DOMAINS.includes(domain);
}
