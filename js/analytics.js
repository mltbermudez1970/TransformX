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
/* --- Etiquetado de sesiones moderadas -------------------------------------
 *
 * En una sesión de validación UX interesa poder decir "el participante 3 chocó
 * tres veces con lo mismo", no sólo "hubo N choques". Sin esto, ocho personas
 * producen ocho conjuntos de eventos indistinguibles.
 *
 * NO identifica a nadie: `P03` es una etiqueta que asigna el moderador, no un
 * dato personal. No se llama a `mixpanel.identify()` ni se crean perfiles.
 *
 * El moderador abre el prototipo con:
 *   /workspace/?participant=P03&session=vj11-2026-09-10
 *
 * y a partir de ahí la etiqueta sobrevive a toda la sesión. Persistirla es
 * obligatorio, no una comodidad: el prototipo es multipágina y
 * `protoResolveRoute()` reconstruye la query en cada salto, así que los
 * parámetros desaparecerían de la URL en la primera navegación.
 */
const PROTO_SESION_KEY = "transformx-analytics-sesion";
function leerEtiquetaGuardada() {
    try {
        const raw = sessionStorage.getItem(PROTO_SESION_KEY);
        if (!raw)
            return null;
        const p = JSON.parse(raw);
        if (typeof p.participant_id !== "string" || typeof p.session_id !== "string")
            return null;
        return { participant_id: p.participant_id, session_id: p.session_id };
    }
    catch {
        return null;
    }
}
/** Etiqueta de la sesión moderada: de la URL si viene, si no la ya guardada. */
function etiquetaDeSesion() {
    const params = new URLSearchParams(location.search);
    const participante = params.get("participant");
    const sesion = params.get("session");
    if (participante && sesion) {
        const etiqueta = {
            // Se normaliza y se acota: la etiqueta la teclea una persona a mano.
            participant_id: participante.trim().slice(0, 24),
            session_id: sesion.trim().slice(0, 48),
        };
        try {
            sessionStorage.setItem(PROTO_SESION_KEY, JSON.stringify(etiqueta));
        }
        catch {
            /* sessionStorage no disponible */
        }
        return etiqueta;
    }
    return leerEtiquetaGuardada();
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
/* --- Profundidad de lectura ------------------------------------------------
 *
 * Se mide con dos eventos, no con scroll continuo. El scroll por píxel genera
 * un volumen enorme y no responde nada que estos dos no respondan mejor:
 *
 *  · `section_viewed` — qué secciones llegó a ver de verdad. Dice si abandonan
 *    en "Problema de negocio" o si llegan hasta "Modelo comercial", que es lo
 *    que permite decidir el ORDEN de la página.
 *  · `page_exit` — un único evento al salir, con la profundidad máxima y el
 *    tiempo. Resume la visita sin inundar el proyecto.
 */
let profundidadMaxima = 0;
let seccionesVistas = 0;
const inicioDeVisita = Date.now();
function porcentajeDeScroll() {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    if (alto <= 0)
        return 100; // página que cabe entera
    return Math.min(100, Math.round((window.scrollY / alto) * 100));
}
function initProfundidadDeLectura() {
    window.addEventListener("scroll", () => {
        const p = porcentajeDeScroll();
        if (p > profundidadMaxima)
            profundidadMaxima = p;
    }, { passive: true });
    // Una sección cuenta como vista cuando entra de verdad en pantalla, no
    // cuando el scroll la sobrepasa de golpe.
    const secciones = document.querySelectorAll("section[id], section[aria-labelledby]");
    if (secciones.length && "IntersectionObserver" in window) {
        const yaVistas = new Set();
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting)
                    return;
                const el = e.target;
                const nombre = el.id || el.getAttribute("aria-labelledby") || "";
                if (!nombre || yaVistas.has(nombre))
                    return;
                yaVistas.add(nombre);
                seccionesVistas = yaVistas.size;
                trackEvent("section_viewed", {
                    section_id: nombre,
                    section_order: yaVistas.size,
                    page: location.pathname,
                });
                observador.unobserve(el); // una vez por sección, no más
            });
        }, { threshold: 0.5 });
        secciones.forEach((s) => observador.observe(s));
    }
    /*
     * `visibilitychange` en vez de `beforeunload`: es el único que dispara de
     * forma fiable en móvil, donde el navegador puede descartar la pestaña sin
     * avisar. Se emite una sola vez.
     */
    let salidaEmitida = false;
    const emitirSalida = () => {
        if (salidaEmitida || document.visibilityState !== "hidden")
            return;
        salidaEmitida = true;
        trackEvent("page_exit", {
            max_scroll_percent: profundidadMaxima,
            seconds_on_page: Math.round((Date.now() - inicioDeVisita) / 1000),
            sections_seen: seccionesVistas,
            page: location.pathname,
        });
    };
    document.addEventListener("visibilitychange", emitirSalida);
    /*
     * FAQ de precios: qué pregunta abre alguien es su objeción comercial real,
     * y es información que hoy sólo tendrías preguntándole.
     */
    document.querySelectorAll("details").forEach((d) => {
        d.addEventListener("toggle", () => {
            if (!d.open)
                return;
            const pregunta = d.querySelector("summary")?.textContent?.trim().slice(0, 120) ?? "";
            if (pregunta)
                trackEvent("faq_opened", { question: pregunta, page: location.pathname });
        });
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
            /*
             * El pageview automático se dispara DENTRO de `init()`, es decir antes
             * de que `register()` haya podido declarar las super propiedades: llegaba
             * a Mixpanel sin `is_prototype` ni `surface`. Como es el evento más
             * numeroso, eso dejaba sin filtrar la mayor parte del tráfico y mezclaba
             * las visitas del prototipo con las de personas reales. Se desactiva
             * aquí y se emite a mano más abajo, ya con el contexto puesto.
             */
            track_pageview: false,
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
        const etiqueta = etiquetaDeSesion();
        api.register({
            is_prototype: esSuperficieDePrototipo(),
            surface: esSuperficieDePrototipo() ? "workspace" : "public",
            site_version: "ux-14",
            // Sin etiqueta, la navegación es tráfico suelto: hay que poder separarlo
            // de las sesiones moderadas al analizar.
            is_moderated_session: etiqueta !== null,
            participant_id: etiqueta ? etiqueta.participant_id : null,
            session_id: etiqueta ? etiqueta.session_id : null,
        });
        // Ahora sí: el pageview sale con las super propiedades ya registradas.
        api.track_pageview();
    }
    catch {
        return;
    }
    initTrackedElements();
    initProfundidadDeLectura();
}
document.addEventListener("DOMContentLoaded", initAnalytics);
