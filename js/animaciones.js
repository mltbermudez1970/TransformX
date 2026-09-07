"use strict";
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
function resaltarNavActivo() {
    const rutaActual = window.location.pathname.split("/").pop() || "index.html";
    const listas = [
        document.querySelectorAll(".nav__link"),
        document.querySelectorAll(".nav__link--drawer"),
    ];
    listas.forEach((enlaces) => {
        let yaMarcado = false;
        enlaces.forEach((link) => {
            const href = link.getAttribute("href") ?? "";
            const destino = href.split("#")[0];
            // Enlace sólo-ancla: es una sección de esta página, no otra página.
            const coincide = destino !== "" && destino === rutaActual && !yaMarcado;
            if (coincide)
                yaMarcado = true;
            link.classList.toggle("active", coincide);
            // El estado de página actual no puede ser sólo visual (color/borde).
            if (coincide) {
                link.setAttribute("aria-current", "page");
            }
            else {
                link.removeAttribute("aria-current");
            }
        });
    });
}
function initFadeInScroll() {
    const elementos = document.querySelectorAll("[data-animate]");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        elementos.forEach((el) => el.classList.add("is-visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting || !(entry.target instanceof HTMLElement))
                return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });
    elementos.forEach((el) => observer.observe(el));
}
function initMobileMenu() {
    const menuToggle = document.querySelector(".header__menu-toggle:not(.mobile-menu__close)");
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileClose = document.querySelector(".mobile-menu__close");
    const mobileLinks = document.querySelectorAll(".nav__link--drawer");
    const panel = mobileMenu?.querySelector(".mobile-menu__panel");
    if (!menuToggle || !mobileMenu || !panel)
        return;
    const toggle = menuToggle;
    const menu = mobileMenu;
    const drawer = panel;
    const focusSel = 'a[href], button:not([disabled]), input:not([disabled])';
    function setMenuState(isOpen) {
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    }
    function openMenu() {
        if (!menu.open)
            menu.showModal();
        setMenuState(true);
        document.body.style.overflow = "hidden";
        const first = drawer.querySelector(focusSel);
        first?.focus();
    }
    function closeMenu() {
        if (menu.open)
            menu.close();
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
    menu.addEventListener("click", (event) => {
        if (event.target === menu)
            closeMenu();
    });
    mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
}
function initHeaderScroll() {
    const header = document.querySelector(".header");
    if (!header)
        return;
    const siteHeader = header;
    function onScroll() {
        siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
}
function initAnimaciones() {
    resaltarNavActivo();
    initFadeInScroll();
    initMobileMenu();
    initHeaderScroll();
}
document.addEventListener("DOMContentLoaded", initAnimaciones);
