/**
 * Analítica de producto — Mixpanel + Google Analytics 4.
 *
 * Los dos proveedores conviven a propósito y responden preguntas distintas:
 * Mixpanel contesta "qué recorrió esta persona y dónde chocó" (análisis de
 * producto, por evento y por participante); GA4 contesta "de dónde vino el
 * tráfico y cómo se comporta el sitio comercial" (adquisición, audiencias), y
 * además es lo que suelen pedir terceros. La instrumentación es la misma para
 * ambos: **un solo `trackEvent()` los alimenta a los dos**, de modo que no
 * pueden divergir.
 *
 * Cómo se cargan: `js/mixpanel-loader.js` y `js/ga4-loader.js` entran por
 * `<script defer>` **antes** que este archivo. Los scripts `defer` se ejecutan
 * en el orden del documento, así que cuando esto corre ambos SDK ya están
 * preparados y con el consentimiento cerrado de fábrica.
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

/* --- Google Analytics 4 ----------------------------------------------------
 *
 * `ts/ga4-loader.ts` sólo define `window.gtag` si el Measurement ID tiene
 * formato válido. Así que preguntar por él aquí responde a la vez "¿cargó?" y
 * "¿está configurado?", y todo lo de abajo degrada en silencio si la respuesta
 * es no: GA4 puede faltar sin que Mixpanel ni la página se vean afectados.
 */
type GtagFn = (...args: unknown[]) => void;

function ga4(): GtagFn | null {
  const w = window as unknown as { gtag?: GtagFn };
  return typeof w.gtag === "function" ? w.gtag : null;
}

/**
 * Contexto de sesión ya normalizado para GA4. Se adjunta a cada evento que
 * emitimos, además de ir en `config`. Redundante a propósito: sin
 * `is_prototype` en el evento, la actividad del prototipo se mezcla con la de
 * visitantes reales y ya no hay forma de separarlas a posteriori.
 */
let contextoGa4: Record<string, string | number> = {};

/**
 * Grifo de GA4. Mixpanel lleva el suyo dentro del SDK (`opt_out_tracking`);
 * GA4 no tiene equivalente —Consent Mode regula el almacenamiento, no el
 * envío— así que el corte lo hacemos aquí. Sin esto, los eventos previos al
 * consentimiento se quedarían en `dataLayer` y saldrían todos de golpe si la
 * persona aceptara más tarde en la misma página.
 */
let ga4Permitido = false;

/**
 * Adapta las propiedades a los límites de GA4. No es cosmético: GA4 **descarta
 * en silencio** lo que no cumple, así que sin esto un evento parecería enviado
 * y llegaría incompleto.
 *
 *  · `null` no es un valor válido de parámetro — se omite (en Mixpanel sí se
 *    manda, porque allí "sin etiqueta" es un dato que se filtra).
 *  · los valores de texto se truncan a 100 caracteres, el máximo de GA4.
 *  · los booleanos viajan como texto: GA4 no tiene tipo booleano y una
 *    dimensión personalizada muestra `true` / `false` como cadenas.
 */
function propiedadesParaGa4(props?: MixpanelProps): Record<string, string | number> {
  const salida: Record<string, string | number> = {};
  if (!props) return salida;
  Object.entries(props).forEach(([clave, valor]) => {
    if (valor === null || valor === undefined) return;
    if (typeof valor === "number") salida[clave] = valor;
    else if (typeof valor === "boolean") salida[clave] = valor ? "true" : "false";
    else salida[clave] = String(valor).slice(0, 100);
  });
  return salida;
}

/* ===========================================================================
 * Consentimiento
 * ===========================================================================
 * Los dos proveedores arrancan DESACTIVADOS —`opt_out_tracking_by_default` en
 * Mixpanel, `consent default: denied` en GA4— y una **sola** decisión gobierna
 * a ambos: un banner por proveedor sería ruido para la persona y, en la
 * práctica, dos estados que acaban desincronizados.
 *
 * Mientras no decida, `mixpanel.track()` se descarta en el cliente y GA4 no
 * escribe cookies ni envía golpes: ninguna petición de analítica sale del
 * navegador.
 *
 * La decisión vive en `localStorage`, no en `sessionStorage`: preguntar otra
 * vez en cada pestaña sería hostil y, sobre todo, no sería respetar la
 * respuesta que ya dio.
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

/**
 * Aplica la decisión a **los dos** proveedores. Es lo único que abre o cierra
 * el grifo, y por eso está en un solo sitio: un banner con dos interruptores
 * detrás acaba tarde o temprano con uno de los dos desincronizado.
 */
function aplicarConsentimiento(v: DecisionDeConsentimiento): void {
  const concedido = v === "granted";

  const api = mp();
  if (api) {
    try {
      /*
       * Sólo se llama si el estado CAMBIA. `opt_in_tracking()` emite un evento
       * `$opt_in` cada vez, y como el consentimiento se reaplica en cada carga
       * de página, eso generaba un `$opt_in` por página: en una medición de
       * prueba fueron 55 para 59 vistas, un tercio del volumen sin significado
       * alguno. Mixpanel ya persiste la decisión, así que reafirmarla no
       * aporta nada.
       */
      if (concedido) {
        if (!api.has_opted_in_tracking()) api.opt_in_tracking();
      } else {
        api.opt_out_tracking();
      }
    } catch {
      /* la analítica no interrumpe la navegación */
    }
  }

  ga4Permitido = concedido;
  const g = ga4();
  if (g) {
    try {
      // Consent Mode v2: `default` ya quedó en `denied` en el loader; esto sólo
      // lo levanta. Los de publicidad siguen denegados siempre — este sitio no
      // hace remarketing y el banner no pide permiso para eso.
      g("consent", "update", {
        analytics_storage: concedido ? "granted" : "denied",
      });
      // La descarga de gtag.js ocurre aquí y no antes: ver ts/ga4-loader.ts.
      if (concedido) activarGa4();
    } catch {
      /* la analítica no interrumpe la navegación */
    }
  }
}

/** Pide al loader que descargue y configure gtag.js. Idempotente. */
function activarGa4(): void {
  const w = window as unknown as { __ga4Activar?: (c: Record<string, string | number>) => void };
  if (typeof w.__ga4Activar !== "function") return;
  try {
    w.__ga4Activar(contextoGa4);
  } catch {
    /* la analítica no interrumpe la navegación */
  }
}

/**
 * Envía un evento a Mixpanel y a GA4. Silencioso si un SDK no cargó
 * (bloqueador de anuncios, red caída, GA4 sin configurar): la analítica nunca
 * debe romper la página, y que falte un proveedor no debe impedir al otro
 * registrar.
 *
 * Este es el **único** punto por el que salen eventos del sitio. Instrumentar
 * en un solo sitio es lo que garantiza que los dos proyectos vean lo mismo.
 */
function trackEvent(nombre: string, propiedades?: MixpanelProps): void {
  const api = mp();
  if (api) {
    try {
      api.track(nombre, propiedades);
    } catch {
      /* la analítica no interrumpe la navegación */
    }
  }

  const g = ga4();
  if (g && ga4Permitido) {
    try {
      g("event", nombre, { ...contextoGa4, ...propiedadesParaGa4(propiedades) });
    } catch {
      /* la analítica no interrumpe la navegación */
    }
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
  /**
   * Recorrido automatizado (ensayo, humo, carga), no una persona.
   *
   * Existe porque sin él el tráfico de prueba entra en
   * `is_moderated_session = true`, que es exactamente el filtro con el que se
   * analizan las sesiones de validación. Separarlo por una convención de
   * nombres —"los que empiezan por SYN"— depende de que alguien se acuerde;
   * esto no.
   */
  es_sintetico: boolean;
}

function leerEtiquetaGuardada(): EtiquetaDeSesion | null {
  try {
    const raw = sessionStorage.getItem(PROTO_SESION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<EtiquetaDeSesion>;
    if (typeof p.participant_id !== "string" || typeof p.session_id !== "string") return null;
    return {
      participant_id: p.participant_id,
      session_id: p.session_id,
      es_sintetico: p.es_sintetico === true,
    };
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
      es_sintetico: params.get("synthetic") === "true",
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
      if (v === "granted") emitirPageview();
    });
  });
}

/* --- Arranque -------------------------------------------------------------- */

/**
 * Contexto que acompaña a **todos** los eventos. En Mixpanel son super
 * propiedades (`register`); en GA4 no existe tal cosa, así que se fijan con
 * `gtag("set", …)` y viajan como parámetros de cada evento — que es
 * exactamente para lo que se crearon `is_prototype` y `surface` como
 * dimensiones personalizadas de ámbito *evento* en la propiedad.
 */
function contextoDeSesion(): MixpanelProps {
  const etiqueta = etiquetaDeSesion();
  return {
    is_prototype: esSuperficieDePrototipo(),
    surface: esSuperficieDePrototipo() ? "workspace" : "public",
    site_version: "ux-14",
    /*
     * Sin etiqueta, la navegación es tráfico suelto: hay que poder separarlo
     * de las sesiones moderadas al analizar. Un recorrido automatizado lleva
     * etiqueta pero NO es una sesión moderada: no hay persona detrás, y
     * contarlo como tal falsearía justo el conjunto que se va a analizar.
     */
    is_moderated_session: etiqueta !== null && !etiqueta.es_sintetico,
    is_synthetic: etiqueta !== null && etiqueta.es_sintetico,
    participant_id: etiqueta ? etiqueta.participant_id : null,
    session_id: etiqueta ? etiqueta.session_id : null,
  };
}

/**
 * Pageview manual en los dos proveedores. En ambos el automático se dispara
 * demasiado pronto —dentro de `init()` en Mixpanel, dentro de `config` en
 * GA4—, antes de que el contexto esté declarado, y el pageview es el evento
 * más numeroso del proyecto: perderlo como señal filtrable es perder la mayor
 * parte del tráfico.
 */
function emitirPageview(): void {
  const api = mp();
  if (api) {
    try { api.track_pageview(); } catch { /* silencioso */ }
  }
  const g = ga4();
  if (g && ga4Permitido) {
    try {
      g("event", "page_view", {
        ...contextoGa4,
        page_location: location.origin + location.pathname,
        page_title: document.title,
      });
    } catch { /* silencioso */ }
  }
}

function initAnalytics(): void {
  // GA4 y Mixpanel son independientes: un bloqueador puede tumbar uno y dejar
  // el otro en pie, y en ese caso hay que seguir midiendo con el que quede.
  if (!mp() && !ga4()) return;

  initMixpanel();
  prepararContextoGa4();

  /*
   * Consentimiento antes que nada: si ya aceptó en una visita anterior se abre
   * el grifo aquí, ANTES del pageview, para que esa primera página quede
   * registrada. Si no ha decidido todavía, se le pregunta y el pageview se
   * emite al aceptar.
   */
  const decision = leerConsentimiento();
  if (decision) {
    aplicarConsentimiento(decision);
    if (decision === "granted") emitirPageview();
  } else {
    mostrarBannerDeConsentimiento();
  }

  initTrackedElements();
  initProfundidadDeLectura();
}

/**
 * Deja el contexto listo para GA4, sin enviarlo todavía.
 *
 * Se entrega después por `config` (ver `ts/ga4-loader.ts`) para que alcance
 * también a los eventos que GA4 genera por su cuenta, y **además** se adjunta
 * a cada evento nuestro: lo primero depende del comportamiento de gtag.js, lo
 * segundo no depende de nada.
 */
function prepararContextoGa4(): void {
  if (!ga4()) return;
  contextoGa4 = propiedadesParaGa4(contextoDeSesion());
}

function initMixpanel(): void {
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

    api.register(contextoDeSesion());
  } catch {
    /* la analítica no interrumpe la navegación */
  }
}

document.addEventListener("DOMContentLoaded", initAnalytics);
