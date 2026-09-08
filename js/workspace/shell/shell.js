"use strict";
/**
 * App Shell del Workspace autenticado — CÓDIGO EXCLUSIVO DE PROTOTIPO.
 *
 * Renderiza el chrome compartido (skip link, banner de frontera de confianza,
 * cabecera, navegación, breadcrumbs, menú de cuenta) en todas las superficies
 * del workspace. Se hace por JS y no por copia literal en cada HTML —al revés
 * que en las páginas comerciales— porque este chrome es simulación desechable,
 * no producto; así una corrección se aplica a las 13 superficies a la vez.
 *
 * El shell NO decide permisos ni acciones disponibles: sólo pinta navegación y
 * refleja el estado de sesión simulada.
 */
const PROTO_SHELL_MOUNT = "[data-workspace-shell]";
function protoEscape(texto) {
    const d = document.createElement("div");
    d.textContent = texto;
    return d.innerHTML;
}
/** Marca la frontera público ↔ autenticado, visual y semánticamente. */
function protoRenderTrustBanner() {
    return `
    <div class="ws-banner" role="note" aria-label="Frontera de confianza del prototipo">
      <span class="ws-banner__tag">Prototipo</span>
      <p class="ws-banner__text">Workspace autenticado <strong>simulado</strong> — TX-UX-014-PROT-002. Sin backend, IdP, MFA ni sesión reales. Datos sintéticos.</p>
      <a class="ws-banner__exit" href="${protoEscape(protoGetSiteBase())}index.html">Salir al sitio público</a>
    </div>`;
}
function protoRenderNavNode(node, actual, nivel) {
    const route = protoFindRoute(node.routeId);
    if (!route)
        return "";
    const esActual = node.routeId === actual;
    const enRama = protoRouteEnRama(actual, node.routeId);
    const pendiente = route.phase !== "PM-UX14-03";
    const hijos = node.children?.length
        ? `<ul class="ws-nav__list ws-nav__list--nivel${nivel + 1}">${node.children
            .map((h) => protoRenderNavNode(h, actual, nivel + 1))
            .join("")}</ul>`
        : "";
    return `
    <li class="ws-nav__item">
      <a class="ws-nav__link ws-nav__link--nivel${nivel}${esActual ? " is-current" : ""}${enRama && !esActual ? " is-branch" : ""}"
         href="${protoEscape(protoRouteHref(node.routeId))}"
         ${esActual ? 'aria-current="page"' : ""}>
        <span class="ws-nav__label">${protoEscape(route.label)}</span>
        ${pendiente ? `<span class="ws-nav__phase" title="Se construye en ${protoEscape(route.phase)}">${protoEscape(route.phase.replace("PM-UX14-", "P"))}</span>` : ""}
      </a>
      ${hijos}
    </li>`;
}
/** ¿La ruta actual cuelga de `routeId`? */
function protoRouteEnRama(actual, routeId) {
    const r = protoFindRoute(actual);
    if (!r)
        return false;
    return r.parents.includes(routeId);
}
function protoRenderBreadcrumbs() {
    const route = protoCurrentRoute();
    if (!route)
        return "";
    const cadena = [...route.parents, route.routeId];
    const items = cadena
        .map((id, i) => {
        const r = protoFindRoute(id);
        if (!r)
            return "";
        const ultimo = i === cadena.length - 1;
        return ultimo
            ? `<li class="ws-crumbs__item"><span aria-current="page">${protoEscape(r.label)}</span></li>`
            : `<li class="ws-crumbs__item"><a href="${protoEscape(protoRouteHref(id))}">${protoEscape(r.label)}</a></li>`;
    })
        .join("");
    return `
    <nav class="ws-crumbs" aria-label="Ruta de navegación">
      <ol class="ws-crumbs__list">${items}</ol>
    </nav>`;
}
function protoRenderAccountMenu(user) {
    if (!user) {
        // En las propias superficies de identidad el CTA sería redundante.
        if (protoCurrentRouteId() === "auth")
            return "";
        return `<a class="c-btn c-btn--primary" href="${protoEscape(protoRouteHref("auth", { screen: "sign-in" }))}">Iniciar sesión</a>`;
    }
    const policy = protoPolicyOf(user);
    const session = protoGetSession();
    const minutos = session ? Math.max(0, Math.round((session.expiresAt - Date.now()) / 60_000)) : 0;
    return `
    <div class="c-menu-wrapper ws-account">
      <button type="button" class="c-menu-account-toggle ws-account__toggle"
              id="ws-account-trigger" aria-haspopup="true" aria-expanded="false" aria-controls="ws-account-panel">
        <span class="ws-account__avatar" aria-hidden="true">${protoEscape(user.initials)}</span>
        <span class="ws-account__name">${protoEscape(user.displayName)}</span>
      </button>
      <div class="c-menu-account c-menu-account--categorized ws-account__panel"
           id="ws-account-panel" role="menu" aria-labelledby="ws-account-trigger" hidden>
        <div class="c-menu__group" role="group" aria-labelledby="ws-account-cat-identidad">
          <h3 class="c-menu__category" id="ws-account-cat-identidad">Identidad</h3>
          <p class="ws-account__meta"><strong>${protoEscape(user.displayName)}</strong><br>${protoEscape(user.email)}</p>
          ${protoRenderEffectiveAccessSummary(user)}
          <p class="ws-account__meta">Política: ${protoEscape(policy ? policy.label : user.policyId)}</p>
          <p class="ws-account__meta">Sesión simulada: ~${String(minutos)} min restantes${session?.trustedDevice ? " · dispositivo de confianza" : ""}</p>
        </div>
        <div class="c-menu__group" role="group" aria-labelledby="ws-account-cat-cuenta">
          <h3 class="c-menu__category" id="ws-account-cat-cuenta">Cuenta</h3>
          <ul class="c-menu__list">
            <li role="none"><a href="${protoEscape(protoRouteHref("auth", { screen: "change-password" }))}" role="menuitem" tabindex="-1">Cambiar contraseña</a></li>
            <li role="none"><a href="${protoEscape(protoRouteHref("auth", { screen: "mfa-enrollment" }))}" role="menuitem" tabindex="-1">Gestionar MFA</a></li>
          </ul>
        </div>
        <div class="c-menu__group" role="group" aria-labelledby="ws-account-cat-sesion">
          <h3 class="c-menu__category" id="ws-account-cat-sesion">Sesión</h3>
          <ul class="c-menu__list">
            <li role="none"><button type="button" role="menuitem" tabindex="-1" data-ws-expire>Simular sesión caducada</button></li>
            <li role="none"><button type="button" role="menuitem" tabindex="-1" class="c-menu__item--danger" data-ws-signout>Cerrar sesión</button></li>
          </ul>
        </div>
      </div>
    </div>`;
}
function protoRenderShell() {
    const mount = document.querySelector(PROTO_SHELL_MOUNT);
    if (!mount)
        return;
    const user = protoGetSessionUser();
    const actual = protoCurrentRouteId();
    const route = protoCurrentRoute();
    const mostrarNav = route ? route.requiresAuth : false;
    mount.innerHTML = `
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
    ${protoRenderTrustBanner()}
    <header class="ws-header" aria-label="Cabecera del workspace">
      <div class="ws-header__left">
        ${mostrarNav
        ? `<button type="button" class="ws-nav-toggle" aria-expanded="false" aria-controls="ws-nav" aria-label="Abrir navegación del workspace">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
               </button>`
        : ""}
        <a class="ws-brand" href="${protoEscape(protoRouteHref("home"))}" aria-label="TransformX — Workspace">
          <span class="ws-brand__mark" aria-hidden="true">TX</span>
          <span class="ws-brand__name">TRANSFORMX</span>
        </a>
        ${mostrarNav ? protoRenderTenantBadge() : ""}
      </div>
      <div class="ws-header__right">
        ${mostrarNav
        ? `<button type="button" class="ws-scenario-chip" data-scenario-open
                       aria-haspopup="dialog" aria-controls="ws-scenario-dialog">
                 <span class="ws-scenario-chip__id">${protoEscape(protoGetActiveScenarioId())}</span>
                 <span class="ws-scenario-chip__label">Escenario</span>
               </button>
               <a class="c-btn c-btn--secondary ws-capio-entry" href="${protoEscape(protoRouteHref("capio"))}">Preguntar a Capio</a>`
        : ""}
        ${protoRenderAccountMenu(user)}
      </div>
    </header>
    ${mostrarNav ? protoRenderBreadcrumbs() : ""}
    ${mostrarNav ? protoRenderScenarioPanel() : ""}`;
    if (mostrarNav)
        protoRenderSidebar(actual);
    protoWireShell();
    if (mostrarNav) {
        protoWireScenarioSelector();
        protoWireTenantSwitcher();
    }
}
function protoRenderSidebar(actual) {
    const host = document.querySelector("[data-workspace-nav]");
    if (!host)
        return;
    // El árbol se genera desde el Tenant activo: un BizCap no asignado no está
    // en la navegación, no es que esté oculto (TX-UX-MTAC-AMD-001 §7).
    const user = protoGetSessionUser();
    const nav = user ? protoBuildNav(user.userId, protoGetActiveTenantId()) : [];
    host.innerHTML = `
    <nav class="ws-nav" id="ws-nav" aria-label="Navegación del workspace">
      <ul class="ws-nav__list ws-nav__list--nivel0">
        ${nav.map((n) => protoRenderNavNode(n, actual, 0)).join("")}
      </ul>
      <p class="ws-nav__note">Sólo aparecen las BizCaps asignadas en la organización activa.</p>
    </nav>`;
}
function protoWireShell() {
    /**
     * Menú de cuenta con el patrón ARIA de `role="menu"`: tabindex móvil,
     * navegación con flechas, Home/End, Escape y retorno de foco.
     */
    const toggle = document.querySelector(".ws-account__toggle");
    const panel = document.querySelector("#ws-account-panel");
    if (toggle && panel) {
        const items = () => [...panel.querySelectorAll('[role="menuitem"]')];
        const enfocar = (indice) => {
            const lista = items();
            if (lista.length === 0)
                return;
            const i = (indice + lista.length) % lista.length;
            lista.forEach((el, n) => el.setAttribute("tabindex", n === i ? "0" : "-1"));
            lista[i]?.focus();
        };
        const cerrar = (devolverFoco) => {
            panel.hidden = true;
            toggle.setAttribute("aria-expanded", "false");
            items().forEach((el) => el.setAttribute("tabindex", "-1"));
            if (devolverFoco)
                toggle.focus();
        };
        const abrir = (alFinal = false) => {
            panel.hidden = false;
            toggle.setAttribute("aria-expanded", "true");
            enfocar(alFinal ? items().length - 1 : 0);
        };
        toggle.addEventListener("click", () => {
            if (toggle.getAttribute("aria-expanded") === "true")
                cerrar(true);
            else
                abrir();
        });
        toggle.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrir();
            }
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                abrir(true);
            }
        });
        panel.addEventListener("keydown", (e) => {
            const lista = items();
            const actual = lista.indexOf(document.activeElement);
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    enfocar(actual + 1);
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    enfocar(actual - 1);
                    break;
                case "Home":
                    e.preventDefault();
                    enfocar(0);
                    break;
                case "End":
                    e.preventDefault();
                    enfocar(lista.length - 1);
                    break;
                case "Escape":
                    e.preventDefault();
                    cerrar(true);
                    break;
                case "Tab":
                    cerrar(false);
                    break;
                default: break;
            }
        });
        document.addEventListener("click", (e) => {
            if (panel.hidden)
                return;
            const t = e.target;
            if (t instanceof Node && !panel.contains(t) && !toggle.contains(t))
                cerrar(false);
        });
    }
    document.querySelector("[data-ws-signout]")?.addEventListener("click", () => {
        protoClearSession();
        location.assign(protoRouteHref("auth", { screen: "sign-in" }));
    });
    document.querySelector("[data-ws-expire]")?.addEventListener("click", () => {
        protoExpireSessionNow();
        location.assign(protoRouteHref("system", { state: "session-expired" }));
    });
    // Navegación lateral en móvil: drawer con Escape y retorno de foco.
    const navToggle = document.querySelector(".ws-nav-toggle");
    const navHost = document.querySelector("[data-workspace-nav]");
    if (navToggle && navHost) {
        const cerrarNav = (devolverFoco) => {
            navHost.classList.remove("is-open");
            navToggle.setAttribute("aria-expanded", "false");
            navToggle.setAttribute("aria-label", "Abrir navegación del workspace");
            if (devolverFoco)
                navToggle.focus();
        };
        navToggle.addEventListener("click", () => {
            const abierto = navHost.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(abierto));
            navToggle.setAttribute("aria-label", abierto ? "Cerrar navegación del workspace" : "Abrir navegación del workspace");
            if (abierto)
                navHost.querySelector("a")?.focus();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navHost.classList.contains("is-open"))
                cerrarNav(true);
        });
    }
}
/**
 * Guarda de sesión. Redirige a AUTH-01 conservando el contexto original
 * (return-to-context) o a SYS session_expired si la ventana venció.
 */
function protoGuardRoute() {
    const route = protoCurrentRoute();
    if (!route || !route.requiresAuth)
        return true;
    if (protoIsAuthenticated())
        return true;
    const destino = encodeURIComponent(protoCurrentRelativeRoute());
    if (protoSessionExpired()) {
        location.replace(protoRouteHref("system", { state: "session-expired", returnTo: destino }));
        return false;
    }
    const session = protoGetSession();
    const screen = session && !session.mfaSatisfied ? "mfa-challenge" : "sign-in";
    location.replace(protoRouteHref("auth", { screen, returnTo: destino }));
    return false;
}
/**
 * Segunda guarda: identidad válida pero contexto de Tenant ausente, revocado,
 * obsoleto, o ruta que pertenece a un BizCap no asignado en este Tenant.
 * Corre después de `protoGuardRoute()` porque sin identidad no hay contexto.
 */
function protoGuardTenant() {
    const route = protoCurrentRoute();
    if (!route || !route.requiresAuth)
        return true;
    const destino = protoTenantGuardRedirect();
    if (!destino)
        return true;
    location.replace(destino);
    return false;
}
document.addEventListener("DOMContentLoaded", () => {
    if (!protoGuardRoute())
        return;
    if (!protoGuardTenant())
        return;
    protoRenderShell();
});
