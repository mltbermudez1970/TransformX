"use strict";
/**
 * Contentsquare — carga diferida hasta el consentimiento.
 *
 * TAG ID: `1f0c09d88166a` (hashed project ID). Es público por diseño: viaja en
 * la URL del script. No se transforma ni se deriva de ningún otro identificador.
 *
 * POR QUÉ NO ES EL `<script src>` DIRECTO QUE DOCUMENTA CONTENTSQUARE
 * La instalación estándar para un sitio sin framework es poner
 * `<script src="https://t.contentsquare.net/uxa/<id>.js" defer>` en el `<head>`,
 * y entonces el tag carga y empieza a medir en cuanto se abre la página. Aquí no
 * puede ser así por dos motivos, y ninguno es una preferencia:
 *
 *  1. `privacidad.html` promete por escrito que **ninguna petición de analítica
 *     sale del navegador hasta que la persona acepta**. Cargar el tag antes lo
 *     convertiría en una promesa falsa.
 *  2. La regla del proyecto es que **una sola decisión gobierna a todos los
 *     proveedores** (CLAUDE.md). Un tercer proveedor que se salte el grifo
 *     rompería esa garantía sin que se note.
 *
 * Así que se replica el patrón que ya usa GA4: este archivo sólo deja preparada
 * la vía de entrada (`window.__csActivar`) y **no descarga nada**. Quien decide
 * es `aplicarConsentimiento()` en `ts/analytics.ts`, el único punto del proyecto
 * donde se encienden o apagan los proveedores.
 */
const CS_TAG_ID = "1f0c09d88166a";
function initContentsquare() {
    const w = window;
    /*
     * El ID es una cadena hexadecimal en minúsculas de ~13 caracteres. Si alguien
     * pega aquí el ID numérico de proyecto o el de un flujo, la URL del tag
     * responde 404 y **no se envía nada, sin ningún error visible** — el mismo
     * modo de fallo silencioso que ya costó una medición con el Measurement ID de
     * GA4. Por eso se valida el formato y se avisa en desarrollo.
     */
    if (!/^[0-9a-f]{10,16}$/.test(CS_TAG_ID)) {
        if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
            // eslint-disable-next-line no-console
            console.warn("[analytics] El tag ID de Contentsquare no tiene forma de hash hexadecimal: " +
                CS_TAG_ID + ". El script responderá 404 y no se medirá nada.");
        }
        return;
    }
    let activado = false;
    w.__csActivar = () => {
        if (activado)
            return; // una sola descarga por página
        activado = true;
        const s = document.createElement("script");
        s.async = true;
        s.src = `https://t.contentsquare.net/uxa/${CS_TAG_ID}.js`;
        document.head.appendChild(s);
    };
}
initContentsquare();
