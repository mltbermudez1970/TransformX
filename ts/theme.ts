type ThemeChoice = "light" | "dark";

const STORAGE_KEY = "transformx-theme";

function getStoredTheme(): ThemeChoice | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    /* localStorage no disponible */
  }
  return null;
}

function getSystemTheme(): ThemeChoice {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getEffectiveTheme(): ThemeChoice {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(preference: ThemeChoice | null): void {
  const effective = preference ?? getSystemTheme();
  document.documentElement.setAttribute("data-theme", effective);
  updateThemeToggleUI(effective);
}

function updateThemeToggleUI(effective: ThemeChoice): void {
  const isDark = effective === "dark";

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Activar modo claro" : "Activar modo oscuro"
    );
  });
}

function initThemeToggle(): void {
  applyTheme(getStoredTheme());

  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme: ThemeChoice = getEffectiveTheme() === "dark" ? "light" : "dark";

      try {
        localStorage.setItem(STORAGE_KEY, nextTheme);
      } catch {
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
