function esHTMLElement(el: Element | null): el is HTMLElement {
  return el !== null && el instanceof HTMLElement;
}

function mostrarFeedback(errores: string[]): void {
  const caja = document.querySelector(".form-feedback");
  if (!esHTMLElement(caja)) return;

  caja.classList.remove("error", "exito");
  caja.classList.add(errores.length > 0 ? "error" : "exito");
  caja.textContent =
    errores.length > 0 ? errores.join(", ") : "¡Mensaje enviado!";
}

function resaltarNavActivo(): void {
  const rutaActual = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("nav a").forEach(function (link) {
    if (!(link instanceof HTMLElement)) return;

    const href = link.getAttribute("href") ?? "";
    const destino = href.split("#")[0] || "index.html";
    const coincide =
      destino === rutaActual ||
      (rutaActual === "" && destino === "index.html") ||
      (rutaActual === "index.html" && (destino === "index.html" || destino === ""));

    link.classList.toggle("active", coincide);
  });
}

function initFadeInScroll(): void {
  const elementos = document.querySelectorAll<HTMLElement>("[data-animate]");

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elementos.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observer.observe(el));
}

function initMobileMenu(): void {
  const menuToggle = document.querySelector<HTMLButtonElement>(".header__menu-toggle:not(.mobile-menu__close)");
  const mobileMenu = document.querySelector<HTMLElement>(".mobile-menu");
  const mobileClose = document.querySelector<HTMLButtonElement>(".mobile-menu__close");
  const mobileLinks = document.querySelectorAll<HTMLAnchorElement>(".nav__link--drawer");
  const panel = mobileMenu?.querySelector<HTMLElement>(".mobile-menu__panel");

  if (!menuToggle || !mobileMenu || !panel) return;

  const toggle = menuToggle;
  const menu = mobileMenu;
  const drawer = panel;
  const focusSel = 'a[href], button:not([disabled]), input:not([disabled])';

  function openMenu(): void {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    const first = drawer.querySelector<HTMLElement>(focusSel);
    first?.focus();
  }

  function closeMenu(): void {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener("click", () => {
    menu.classList.contains("is-open") ? closeMenu() : openMenu();
  });

  mobileClose?.addEventListener("click", closeMenu);
  menu.addEventListener("click", (event) => {
    if (event.target === menu) closeMenu();
  });
  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });
}

function initHeaderScroll(): void {
  const header = document.querySelector<HTMLElement>(".header");
  if (!header) return;

  const siteHeader = header;

  function onScroll(): void {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initAnimaciones(): void {
  resaltarNavActivo();
  initFadeInScroll();
  initMobileMenu();
  initHeaderScroll();
}

document.addEventListener("DOMContentLoaded", initAnimaciones);
