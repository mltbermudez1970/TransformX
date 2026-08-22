function resaltarNavActivo(): void {
  const rutaActual = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll<HTMLAnchorElement>("nav a").forEach((link) => {
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
