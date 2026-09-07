/**
 * Marca la página actual en la navegación principal y en el drawer.
 *
 * Reglas:
 *  - Sólo navegación de cabecera y drawer. El footer queda fuera: allí el
 *    resaltado no aporta orientación y su color de marca no contrasta contra
 *    el fondo navy permanente.
 *  - Un enlace que sólo lleva ancla (`#plataforma`) apunta a una sección de la
 *    página actual, no a "la página actual": no recibe `aria-current`.
 *  - Como máximo un enlace por lista queda marcado, para que un lector de
 *    pantalla no anuncie varias veces "página actual".
 */
function resaltarNavActivo(): void {
  const rutaActual = window.location.pathname.split("/").pop() || "index.html";

  const listas = [
    document.querySelectorAll<HTMLAnchorElement>(".nav__link"),
    document.querySelectorAll<HTMLAnchorElement>(".nav__link--drawer"),
  ];

  listas.forEach((enlaces) => {
    let yaMarcado = false;

    enlaces.forEach((link) => {
      const href = link.getAttribute("href") ?? "";
      const destino = href.split("#")[0];

      // Enlace sólo-ancla: es una sección de esta página, no otra página.
      const coincide = destino !== "" && destino === rutaActual && !yaMarcado;
      if (coincide) yaMarcado = true;

      link.classList.toggle("active", coincide);

      // El estado de página actual no puede ser sólo visual (color/borde).
      if (coincide) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  });
}

function initFadeInScroll(): void {
  const elementos = document.querySelectorAll<HTMLElement>("[data-animate]");

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elementos.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
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
  const menuToggle = document.querySelector<HTMLButtonElement>(
    ".header__menu-toggle:not(.mobile-menu__close)"
  );
  const mobileMenu = document.querySelector<HTMLDialogElement>(".mobile-menu");
  const mobileClose = document.querySelector<HTMLButtonElement>(".mobile-menu__close");
  const mobileLinks = document.querySelectorAll<HTMLAnchorElement>(".nav__link--drawer");
  const panel = mobileMenu?.querySelector<HTMLElement>(".mobile-menu__panel");

  if (!menuToggle || !mobileMenu || !panel) return;

  const toggle = menuToggle;
  const menu = mobileMenu;
  const drawer = panel;
  const focusSel = 'a[href], button:not([disabled]), input:not([disabled])';

  function setMenuState(isOpen: boolean): void {
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
  }

  function openMenu(): void {
    if (!menu.open) menu.showModal();
    setMenuState(true);
    document.body.style.overflow = "hidden";
    const first = drawer.querySelector<HTMLElement>(focusSel);
    first?.focus();
  }

  function closeMenu(): void {
    if (menu.open) menu.close();
  }

  menu.addEventListener("close", () => {
    setMenuState(false);
    document.body.style.overflow = "";
    toggle.focus();
  });

  toggle.addEventListener("click", () => {
    menu.open ? closeMenu() : openMenu();
  });

  mobileClose?.addEventListener("click", closeMenu);
  menu.addEventListener("click", (event: MouseEvent) => {
    if (event.target === menu) closeMenu();
  });
  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
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
