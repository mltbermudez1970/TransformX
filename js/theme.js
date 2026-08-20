"use strict";
const STORAGE_KEY = "transformx-theme";
function getStoredTheme() {
    try {
        const value = localStorage.getItem(STORAGE_KEY);
        if (value === "light" || value === "dark")
            return value;
    }
    catch {
        /* localStorage no disponible */
    }
    return null;
}
function getSystemTheme() {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getEffectiveTheme() {
    return getStoredTheme() ?? getSystemTheme();
}
function applyTheme(preference) {
    const root = document.documentElement;
    if (preference === "light" || preference === "dark") {
        root.setAttribute("data-theme", preference);
    }
    else {
        root.removeAttribute("data-theme");
    }
    updateThemeToggleUI(getEffectiveTheme());
}
function updateThemeToggleUI(effective) {
    const isDark = effective === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.setAttribute("aria-pressed", String(isDark));
        button.setAttribute("aria-label", isDark ? "Activar modo claro" : "Activar modo oscuro");
    });
}
function initThemeToggle() {
    applyTheme(getStoredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const nextTheme = getEffectiveTheme() === "dark" ? "light" : "dark";
            try {
                localStorage.setItem(STORAGE_KEY, nextTheme);
            }
            catch {
                /* localStorage no disponible */
            }
            applyTheme(nextTheme);
        });
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (!getStoredTheme()) {
            applyTheme(null);
        }
    });
}
document.addEventListener("DOMContentLoaded", initThemeToggle);
