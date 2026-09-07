"use strict";
/**
 * Prototype mode — detección explícita del modo prototipo.
 *
 * Todo símbolo global de esta capa usa el prefijo PROTO_ / proto* para no
 * colisionar con los scripts globales del sitio público (ts/*.ts).
 *
 * Se activa por cualquiera de estas vías:
 *  1. Query string `?prototype=true`
 *  2. Ruta dedicada bajo `/workspace/` (todas sus páginas son prototipo)
 *  3. Flag persistido en sessionStorage (se mantiene al navegar dentro del prototipo)
 *
 * Este archivo NO contiene mocks ni datos de negocio: solo detecta el modo y
 * revela los accesos al prototipo que están ocultos por defecto.
 */
const PROTO_MODE_STORAGE_KEY = "transformx-prototype-mode";
const PROTO_MODE_PARAM = "prototype";
const PROTO_WORKSPACE_PATH_SEGMENT = "/workspace/";
function protoReadStoredMode() {
    try {
        return sessionStorage.getItem(PROTO_MODE_STORAGE_KEY) === "true";
    }
    catch {
        /* sessionStorage no disponible */
        return false;
    }
}
function protoPersistMode(active) {
    try {
        if (active) {
            sessionStorage.setItem(PROTO_MODE_STORAGE_KEY, "true");
        }
        else {
            sessionStorage.removeItem(PROTO_MODE_STORAGE_KEY);
        }
    }
    catch {
        /* sessionStorage no disponible */
    }
}
/** Indica si la página actual pertenece al prototipo autenticado (`/workspace/`). */
function protoIsWorkspaceRoute() {
    return location.pathname.includes(PROTO_WORKSPACE_PATH_SEGMENT);
}
/** True si el modo prototipo está activo en esta sesión. */
function protoIsPrototypeMode() {
    if (protoIsWorkspaceRoute())
        return true;
    const param = new URLSearchParams(location.search).get(PROTO_MODE_PARAM);
    if (param === "true") {
        protoPersistMode(true);
        return true;
    }
    if (param === "false") {
        protoPersistMode(false);
        return false;
    }
    return protoReadStoredMode();
}
/**
 * Propaga `?prototype=true` a una URL relativa, para que el modo sobreviva
 * a la navegación entre páginas públicas y el prototipo.
 */
function protoWithPrototypeParam(href) {
    if (href.includes(`${PROTO_MODE_PARAM}=`))
        return href;
    const separator = href.includes("?") ? "&" : "?";
    return `${href}${separator}${PROTO_MODE_PARAM}=true`;
}
/**
 * Revela los elementos marcados con `[data-prototype-entry]` cuando el modo
 * prototipo está activo. Fuera de modo prototipo permanecen ocultos (atributo
 * `hidden` en el HTML), por lo que el flujo público no cambia.
 */
function initPrototypeMode() {
    if (!protoIsPrototypeMode())
        return;
    document.documentElement.setAttribute("data-prototype", "true");
    document
        .querySelectorAll("[data-prototype-entry]")
        .forEach((element) => {
        element.hidden = false;
        const link = element instanceof HTMLAnchorElement ? element : element.querySelector("a");
        if (link instanceof HTMLAnchorElement) {
            const raw = link.getAttribute("href");
            if (raw && !raw.startsWith("#")) {
                link.setAttribute("href", protoWithPrototypeParam(raw));
            }
        }
    });
}
document.addEventListener("DOMContentLoaded", initPrototypeMode);
