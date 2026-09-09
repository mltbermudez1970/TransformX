"use strict";
/**
 * Analítica de producto — Mixpanel (SDK de navegador).
 *
 * Cómo se carga: la librería entra por un `<script defer>` normal desde el CDN
 * de Mixpanel, **antes** de este archivo. Los scripts `defer` se ejecutan en el
 * orden del documento, así que cuando esto corre `window.mixpanel` ya existe.
 * Por eso no hace falta el snippet minificado con cola de llamadas: ese stub
 * sólo sirve para encolar llamadas que ocurren antes de que cargue la librería,
 * y aquí no puede haber ninguna.
 *
 * QUÉ NO SE ENVÍA NUNCA
 * Este sitio es una landing de validación y el prototipo trabaja con datos
 * sintéticos, pero las personas que lo visitan son reales. No se envía:
 *   · el texto que alguien escribe a Capio (puede traer nombre de empresa,
 *     volúmenes, o cualquier detalle de su negocio),
 *   · ningún campo del formulario de contacto (nombre, correo, mensaje),
 *   · identificadores de lead, oportunidad o revisión del prototipo.
 * Se envía QUÉ pasó y CON QUÉ resultado, no el contenido que la persona tecleó.
 *
 * No se llama a `mixpanel.identify()` ni a `people.set()`: no hay cuentas
 * reales en este proyecto, así que no hay un identificador de usuario legítimo
 * que asociar. Los usuarios del prototipo son perfiles sintéticos.
 */
/**
 * Token de proyecto de Mixpanel. Es una clave **pública** de cliente por
 * diseño: viaja en el JS del navegador y sólo permite escribir eventos en este
 * proyecto. No es un secreto y no debe tratarse como tal.
 */
const MIXPANEL_TOKEN = "d0ffdebfef6b9d8dde7704fc4f5dd4bb";
/** El prototipo autenticado vive bajo /workspace/. */
function esSuperficieDePrototipo() {
    return location.pathname.includes("/workspace/");
}
/** `true` sólo al abrir el sitio desde una máquina de desarrollo. */
function enDesarrollo() {
    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}
/**
 * Devuelve el SDK sólo si cargó. Un booleano no sirve: bajo `strict`,
 * TypeScript no puede estrechar un `declare const` a través de una función,
 * y devolver el objeto deja el tipo resuelto en cada punto de uso.
 */
function mp() {
    return typeof mixpanel !== "undefined" && mixpanel ? mixpanel : null;
}
/**
 * Envía un evento. Silencioso si la librería no cargó (bloqueador de anuncios,
 * red caída): la analítica nunca debe romper la página.
 */
function trackEvent(nombre, propiedades) {
    const api = mp();
    if (!api)
        return;
    try {
        api.track(nombre, propiedades);
    }
    catch {
        /* la analítica no interrumpe la navegación */
    }
}
/* --- Instrumentación declarativa ------------------------------------------
 * Un elemento se instrumenta añadiéndole `data-track="nombre_del_evento"` en el
 * HTML; los `data-track-*` restantes viajan como propiedades. Así no hay que
 * tocar este archivo cada vez que se quiera medir un CTA nuevo.
 *
 *   <a href="…" data-track="adoption_started" data-track-bizcap="LAB-001">
 */
function propiedadesDeElemento(el) {
    const props = {};
    Object.entries(el.dataset).forEach(([clave, valor]) => {
        if (clave === "track" || valor === undefined)
            return;
        if (!clave.startsWith("track"))
            return;
        // dataset.trackBizcap → track_bizcap
        const nombre = clave
            .replace(/^track/, "")
            .replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
            .replace(/^_/, "");
        if (nombre)
            props[nombre] = valor;
    });
    return props;
}
/**
 * Delegación en `document`: funciona con contenido pintado por JS después de
 * la carga, que es como se construye todo el chrome de `workspace/`.
 */
function initTrackedElements() {
    document.addEventListener("click", (evento) => {
        const objetivo = evento.target;
        if (!(objetivo instanceof Element))
            return;
        const el = objetivo.closest("[data-track]");
        if (!el)
            return;
        const nombre = el.dataset["track"];
        if (!nombre)
            return;
        trackEvent(nombre, propiedadesDeElemento(el));
    });
}
/* --- Arranque -------------------------------------------------------------- */
function initAnalytics() {
    const api = mp();
    if (!api)
        return;
    try {
        api.init(MIXPANEL_TOKEN, {
            debug: enDesarrollo(),
            track_pageview: true,
            persistence: "localStorage",
            /*
             * Autocapture DESACTIVADO a propósito. Viene activo por defecto en el
             * SDK y registra clics con el texto del elemento pulsado. En este sitio
             * hay un chat donde la gente escribe su problema de negocio y un
             * formulario de contacto: capturar el DOM a ciegas puede arrastrar ese
             * contenido a Mixpanel sin que nadie lo haya decidido. Se prefiere la
             * instrumentación explícita de `data-track` y los eventos con nombre,
             * donde cada propiedad enviada está escrita a mano y revisada.
             */
            autocapture: false,
        });
        // Propiedades que acompañan a TODOS los eventos de esta sesión. `is_prototype`
        // existe para poder separar en Mixpanel la actividad de validación del
        // prototipo de la de visitantes reales del sitio comercial.
        api.register({
            is_prototype: esSuperficieDePrototipo(),
            surface: esSuperficieDePrototipo() ? "workspace" : "public",
            site_version: "ux-14",
        });
    }
    catch {
        return;
    }
    initTrackedElements();
}
document.addEventListener("DOMContentLoaded", initAnalytics);
