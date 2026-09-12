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

/* --- Tipos mínimos del SDK (evita `any` bajo `strict`) -------------------- */

type MixpanelProps = Record<string, string | number | boolean | null>;

interface MixpanelApi {
  init(token: string, config?: Record<string, unknown>): void;
  track(event: string, properties?: MixpanelProps): void;
  track_pageview(properties?: MixpanelProps): void;
  register(properties: MixpanelProps): void;
  reset(): void;
  opt_in_tracking(): void;
  opt_out_tracking(): void;
  has_opted_in_tracking(): boolean;
}

declare const mixpanel: MixpanelApi | undefined;

/**
 * Token de proyecto de Mixpanel. Es una clave **pública** de cliente por
 * diseño: viaja en el JS del navegador y sólo permite escribir eventos en este
 * proyecto. No es un secreto y no debe tratarse como tal.
 */
const MIXPANEL_TOKEN = "d0ffdebfef6b9d8dde7704fc4f5dd4bb";

/** El prototipo autenticado vive bajo /workspace/. */
function esSuperficieDePrototipo(): boolean {
  return location.pathname.includes("/workspace/");
}

/** `true` sólo al abrir el sitio desde una máquina de desarrollo. */
function enDesarrollo(): boolean {
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

/**
 * Devuelve el SDK sólo si cargó. Un booleano no sirve: bajo `strict`,
 * TypeScript no puede estrechar un `declare const` a través de una función,
 * y devolver el objeto deja el tipo resuelto en cada punto de uso.
 */
function mp(): MixpanelApi | null {
  return typeof mixpanel !== "undefined" && mixpanel ? mixpanel : null;
}

/* ===========================================================================
 * Consentimiento
 * ===========================================================================
 * La analítica arranca DESACTIVADA (`opt_out_tracking_by_default`). Nada se
 * envía hasta que la persona acepta: mientras no decida, `mixpanel.track()` se
 * descarta en el cliente y ninguna petición sale del navegador.
 *
 * La decisión vive en `localStorage`, no en `sessionStorage`: preguntar otra
 * vez en cada pestaña sería hostil y, sobre todo, no sería respetar la
 * respuesta que ya dio.
 *
 * Este mismo estado gobernará Google Analytics cuando se incorpore: una sola
 * decisión para todas las herramientas, no un banner por proveedor.
 */

type DecisionDeConsentimiento = "granted" | "denied";

const CONSENT_KEY = "transformx-consent";

function leerConsentimiento(): DecisionDeConsentimiento | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;                 // navegador sin almacenamiento: se pregunta
  }
}

function guardarConsentimiento(v: DecisionDeConsentimiento): void {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* si no se puede guardar, la decisión aplica sólo a esta carga */
  }
}

/** Aplica la decisión al SDK. Es lo único que abre o cierra el grifo. */
function aplicarConsentimiento(v: DecisionDeConsentimiento): void {
  const api = mp();
  if (!api) return;
  try {
    if (v === "granted") api.opt_in_tracking();
    else api.opt_out_tracking();
  } catch {
    /* la analítica no interrumpe la navegación */
  }
}

/**
 * Envía un evento. Silencioso si la librería no cargó (bloqueador de anuncios,
 * red caída): la analítica nunca debe romper la página.
 */
function trackEvent(nombre: string, propiedades?: MixpanelProps): void {
  const api = mp();
  if (!api) return;
  try {
    api.track(nombre, propiedades);
  } catch {
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

interface EtiquetaDeSesion {
  participant_id: string;
  session_id: string;
}

function leerEtiquetaGuardada(): EtiquetaDeSesion | null {
  try {
    const raw = sessionStorage.getItem(PROTO_SESION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<EtiquetaDeSesion>;
    if (typeof p.participant_id !== "string" || typeof p.session_id !== "string") return null;
    return { participant_id: p.participant_id, session_id: p.session_id };
  } catch {
    return null;
  }
}

/** Etiqueta de la sesión moderada: de la URL si viene, si no la ya guardada. */
function etiquetaDeSesion(): EtiquetaDeSesion | null {
  const params = new URLSearchParams(location.search);
  const participante = params.get("participant");
  const sesion = params.get("session");

  if (participante && sesion) {
    const etiqueta: EtiquetaDeSesion = {
      // Se normaliza y se acota: la etiqueta la teclea una persona a mano.
      participant_id: participante.trim().slice(0, 24),
      session_id: sesion.trim().slice(0, 48),
    };
    try {
      sessionStorage.setItem(PROTO_SESION_KEY, JSON.stringify(etiqueta));
    } catch {
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
function propiedadesDeElemento(el: HTMLElement): MixpanelProps {
  const props: MixpanelProps = {};
  Object.entries(el.dataset).forEach(([clave, valor]) => {
    if (clave === "track" || valor === undefined) return;
    if (!clave.startsWith("track")) return;
    // dataset.trackBizcap → track_bizcap
    const nombre = clave
      .replace(/^track/, "")
      .replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
      .replace(/^_/, "");
    if (nombre) props[nombre] = valor;
  });
  return props;
}

/**
 * Delegación en `document`: funciona con contenido pintado por JS después de
 * la carga, que es como se construye todo el chrome de `workspace/`.
 */
function initTrackedElements(): void {
  document.addEventListener("click", (evento) => {
    const objetivo = evento.target;
    if (!(objetivo instanceof Element)) return;
    const el = objetivo.closest<HTMLElement>("[data-track]");
    if (!el) return;
    const nombre = el.dataset["track"];
    if (!nombre) return;
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

function porcentajeDeScroll(): number {
  const alto = document.documentElement.scrollHeight - window.innerHeight;
  if (alto <= 0) return 100;                       // página que cabe entera
  return Math.min(100, Math.round((window.scrollY / alto) * 100));
}

function initProfundidadDeLectura(): void {
  window.addEventListener("scroll", () => {
    const p = porcentajeDeScroll();
    if (p > profundidadMaxima) profundidadMaxima = p;
  }, { passive: true });

  // Una sección cuenta como vista cuando entra de verdad en pantalla, no
  // cuando el scroll la sobrepasa de golpe.
  const secciones = document.querySelectorAll<HTMLElement>("section[id], section[aria-labelledby]");
  if (secciones.length && "IntersectionObserver" in window) {
    const yaVistas = new Set<string>();
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const nombre = el.id || el.getAttribute("aria-labelledby") || "";
        if (!nombre || yaVistas.has(nombre)) return;
        yaVistas.add(nombre);
        seccionesVistas = yaVistas.size;
        trackEvent("section_viewed", {
          section_id: nombre,
          section_order: yaVistas.size,
          page: location.pathname,
        });
        observador.unobserve(el);              // una vez por sección, no más
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
  const emitirSalida = (): void => {
    if (salidaEmitida || document.visibilityState !== "hidden") return;
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
  document.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => {
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      const pregunta = d.querySelector("summary")?.textContent?.trim().slice(0, 120) ?? "";
      if (pregunta) trackEvent("faq_opened", { question: pregunta, page: location.pathname });
    });
  });
}

/* --- Banner de consentimiento ---------------------------------------------
 *
 * NO es un diálogo modal y no atrapa el foco: rechazar debe costar lo mismo
 * que aceptar, y nadie debería quedar bloqueado ante un muro para leer una
 * política de privacidad. Se inserta como primer hijo de `<body>` para que
 * quien navegue con teclado lo alcance en los primeros tabuladores.
 *
 * Usa la familia de componentes que corresponde a cada superficie: `.btn*` en
 * el sitio público y `.c-btn` bajo `workspace/`. El banner es lo único
 * transversal a las dos, así que elige en tiempo de ejecución en vez de
 * introducir una tercera familia.
 */
function protoRutaDePrivacidad(): string {
  // El prototipo cuelga de /workspace/…, con profundidad variable.
  if (!esSuperficieDePrototipo()) return "privacidad.html";
  const i = location.pathname.indexOf("/workspace/");
  return location.pathname.slice(0, i + 1) + "privacidad.html";
}

function mostrarBannerDeConsentimiento(): void {
  if (document.querySelector("[data-consent-banner]")) return;

  const esWs = esSuperficieDePrototipo();
  const claseBtn = esWs ? "c-btn" : "btn";
  const claseAceptar = esWs ? "c-btn c-btn--primary" : "btn btn--primary";
  const claseRechazar = esWs ? "c-btn c-btn--secondary" : "btn btn--secondary";

  const banner = document.createElement("aside");
  banner.className = "consent-banner";
  banner.setAttribute("data-consent-banner", "");
  banner.setAttribute("aria-label", "Consentimiento de analítica");
  banner.innerHTML = `
    <div class="consent-banner__inner">
      <p class="consent-banner__text">
        Usamos analítica para entender cómo se navega este prototipo de
        validación. <strong>No registramos lo que escribes</strong> ni grabamos
        la pantalla. Nada se envía hasta que aceptes.
        <a href="${protoRutaDePrivacidad()}" class="consent-banner__link">Ver la política de privacidad</a>
      </p>
      <div class="consent-banner__actions">
        <button type="button" class="${claseRechazar}" data-consent="denied">Rechazar</button>
        <button type="button" class="${claseAceptar}" data-consent="granted">Aceptar</button>
      </div>
    </div>`;

  document.body.insertBefore(banner, document.body.firstChild);
  void claseBtn;

  banner.querySelectorAll<HTMLButtonElement>("[data-consent]").forEach((b) => {
    b.addEventListener("click", () => {
      const v = b.getAttribute("data-consent") === "granted" ? "granted" : "denied";
      guardarConsentimiento(v);
      aplicarConsentimiento(v);
      banner.remove();
      // Al aceptar se emite el pageview que se había descartado: si no, la
      // primera página de cada visita quedaría sin registrar siempre.
      if (v === "granted") {
        const api = mp();
        try { api?.track_pageview(); } catch { /* silencioso */ }
      }
    });
  });
}

/* --- Arranque -------------------------------------------------------------- */

function initAnalytics(): void {
  const api = mp();
  if (!api) return;

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
       * Arranca DESACTIVADO. Ninguna petición sale del navegador hasta que la
       * persona acepta en el banner; mientras tanto `track()` se descarta en
       * el cliente. Es lo que convierte el banner en una decisión real y no en
       * un aviso decorativo que se muestra mientras ya se está midiendo.
       */
      opt_out_tracking_by_default: true,
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

    /*
     * Consentimiento antes que nada: si ya aceptó en una visita anterior se
     * abre el grifo aquí, ANTES del pageview, para que esa primera página
     * quede registrada. Si no ha decidido todavía, se le pregunta y el
     * pageview se emite al aceptar.
     */
    const decision = leerConsentimiento();
    if (decision) {
      aplicarConsentimiento(decision);
      if (decision === "granted") api.track_pageview();
    } else {
      mostrarBannerDeConsentimiento();
    }
  } catch {
    return;
  }

  initTrackedElements();
  initProfundidadDeLectura();
}

document.addEventListener("DOMContentLoaded", initAnalytics);
