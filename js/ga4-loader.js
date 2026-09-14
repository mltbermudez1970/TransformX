"use strict";
/**
 * Google Analytics 4 — arranque de `gtag.js` con Consent Mode v2.
 *
 * Este archivo sólo prepara el terreno; los eventos se emiten desde
 * `ts/analytics.ts`, que es el único punto por el que sale analítica del sitio.
 * El reparto es deliberado: aquí va lo que tiene que ocurrir ANTES de que
 * `gtag.js` se descargue, y allí lo que depende del DOM ya cargado.
 *
 * ORDEN, QUE AQUÍ NO ES UN DETALLE
 * `gtag.js` lee `dataLayer` de principio a fin cuando arranca. Por eso el
 * estado de consentimiento por defecto (`denied`) se empuja a la cola ANTES de
 * inyectar el `<script>`: si llegara después, Google ya habría fijado cookies y
 * enviado el primer golpe con el consentimiento implícito. Esto es
 * exactamente lo mismo que hace `opt_out_tracking_by_default` en Mixpanel, y
 * ambas decisiones las gobierna un único banner.
 *
 * `send_page_view: false` por el mismo motivo que en Mixpanel: el pageview
 * automático se dispara dentro de `config`, antes de que `analytics.ts` haya
 * podido declarar `is_prototype` y `surface` con `gtag("set", …)`. Llegaría el
 * evento más numeroso del proyecto sin las dos dimensiones que permiten separar
 * el prototipo del sitio comercial. Se emite a mano, ya con el contexto puesto.
 */
/* ---------------------------------------------------------------------------
 * MEASUREMENT ID — lo único que hay que cambiar aquí
 * ---------------------------------------------------------------------------
 * Formato obligatorio: `G-` + 10 caracteres alfanuméricos (p. ej. `G-4KJ8ZP1Q2R`).
 *
 * Se encuentra en GA4: Administrar → columna *Propiedad* → **Flujos de datos**
 * → clic en el flujo web → *Detalles del flujo*, arriba a la derecha.
 *
 * OJO con los tres identificadores que conviven en esa misma pantalla:
 *   · ID de propiedad  — `552760833`, se usa en la API de datos y en BigQuery
 *   · ID de flujo      — numérico, se usa en la API de administración
 *   · Measurement ID   — empieza por `G-`  ← **el único que sirve aquí**
 *
 * Con un ID numérico, `gtag.js` responde 404 y no se envía nada, sin ningún
 * error visible en la página. De ahí la validación de formato de abajo.
 */
const GA4_MEASUREMENT_ID = "G-G5S34PK365";
/** Sólo la forma; que la propiedad exista lo dirá el tráfico en tiempo real. */
function ga4IdEsValido(id) {
    return /^G-[A-Z0-9]{8,12}$/.test(id);
}
/**
 * Arranca gtag. No hace nada si el Measurement ID todavía es el marcador de
 * posición: mejor no medir que medir contra una propiedad inexistente y creer
 * durante semanas que los datos están llegando.
 */
function initGa4() {
    if (!ga4IdEsValido(GA4_MEASUREMENT_ID)) {
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            console.warn(`[GA4] Measurement ID sin configurar ("${GA4_MEASUREMENT_ID}"). ` +
                "Google Analytics queda desactivado; Mixpanel sigue funcionando. " +
                "Ver ts/ga4-loader.ts.");
        }
        return;
    }
    const w = window;
    const cola = w.dataLayer ?? [];
    w.dataLayer = cola;
    /*
     * El snippet oficial empuja el objeto `arguments`, no un array. No es un
     * capricho de estilo: `gtag.js` distingue los comandos del resto de entradas
     * de `dataLayer` precisamente por ser objetos `Arguments`. Un array normal se
     * ignora en silencio.
     */
    function gtag() {
        // eslint-disable-next-line prefer-rest-params
        cola.push(arguments);
    }
    w.gtag = gtag;
    const g = w.gtag;
    /*
     * Consent Mode v2. Todo denegado de salida. `analytics_storage` es el que
     * gobierna la medición; los de publicidad se declaran denegados de forma
     * permanente porque este sitio no hace remarketing ni conversiones de Ads, y
     * dejarlos sin declarar equivale a no responder a la pregunta.
     */
    g("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 500,
    });
    g("js", new Date());
    /*
     * NI `config` NI la descarga de gtag.js ocurren aquí. Las dos cosas esperan
     * al consentimiento, y cada una por un motivo distinto:
     *
     * 1) LA DESCARGA. Consent Mode en `denied` no significa "no enviar": GA4
     *    sigue mandando pings sin identificadores, verificado en navegador. Pero
     *    la política de privacidad de este sitio promete que no sale ninguna
     *    petición hasta que la persona acepta. Para que eso sea cierto y no una
     *    figura retórica, gtag.js no se descarga siquiera. El Consent Mode se
     *    declara igualmente, como segunda línea: una vez cargado, gobierna el
     *    almacenamiento.
     *
     * 2) `config`. `is_prototype` y `surface` tienen que acompañar a TODOS los
     *    eventos, incluidos los que genera la medición mejorada de GA4
     *    (`scroll`, `click`, `form_start`…), que no pasan por nuestro código. La
     *    única vía que los adjunta a todo son los parámetros de `config`.
     *    `gtag("set", …)` NO sirve: verificado en navegador, los parámetros
     *    personalizados puestos con `set` no llegan en el golpe. Y como el
     *    contexto depende de la ruta y de la etiqueta de sesión, lo calcula
     *    `analytics.ts`; este archivo sólo expone por dónde entregarlo.
     */
    let activado = false;
    w.__ga4Activar = (contexto) => {
        if (activado)
            return; // una sola descarga por página
        activado = true;
        g("config", GA4_MEASUREMENT_ID, {
            send_page_view: false,
            /*
             * GA4 reconstruye la URL de página por su cuenta. En el prototipo eso
             * arrastraría `?participant=P03&session=…` a cada informe, que es
             * exactamente la etiqueta que no queremos ver en los agregados. Se manda
             * la ruta limpia y la etiqueta viaja como parámetro propio.
             */
            page_location: location.origin + location.pathname,
            ...contexto,
        });
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
        document.head.appendChild(s);
    };
}
initGa4();
