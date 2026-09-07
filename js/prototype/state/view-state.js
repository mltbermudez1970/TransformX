"use strict";
/**
 * Estado de vista — preservación de filtros, orden, posición y scroll.
 *
 * Addendum §6.2: al navegar a Lead Detail y volver hay que conservar la vista
 * activa, sus filtros, su orden, la paginación/posición y el scroll.
 *
 * Se guarda por vista en `sessionStorage`. No duplica registros: sólo almacena
 * la consulta y la posición.
 */
const PROTO_VIEW_STATE_PREFIX = "transformx-prototype-view:";
function protoViewStateKey(surface) {
    return `${PROTO_VIEW_STATE_PREFIX}${surface}`;
}
function protoReadViewState(surface) {
    try {
        const raw = sessionStorage.getItem(protoViewStateKey(surface));
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function protoWriteViewState(surface, estado) {
    try {
        sessionStorage.setItem(protoViewStateKey(surface), JSON.stringify(estado));
    }
    catch {
        /* sessionStorage no disponible */
    }
}
function protoPatchViewState(surface, parcial) {
    const actual = protoReadViewState(surface) ?? { savedViewId: "LEADS_MY_OWNED" };
    protoWriteViewState(surface, { ...actual, ...parcial });
}
/** Guarda scroll y foco antes de abrir un detalle. */
function protoRememberPosition(surface, focusedId) {
    protoPatchViewState(surface, {
        scrollY: Math.round(window.scrollY),
        lastFocusedId: focusedId,
    });
}
/**
 * Restaura scroll y foco al volver del detalle. Se llama tras pintar la lista.
 * El foco vuelve a la fila de origen para no perder el contexto de teclado.
 */
function protoRestorePosition(surface) {
    const estado = protoReadViewState(surface);
    if (!estado)
        return;
    if (typeof estado.scrollY === "number") {
        window.scrollTo({ top: estado.scrollY, behavior: "auto" });
    }
    if (estado.lastFocusedId) {
        const objetivo = document.querySelector(`[data-row-id="${CSS.escape(estado.lastFocusedId)}"] a, [data-row-id="${CSS.escape(estado.lastFocusedId)}"] button`);
        objetivo?.focus({ preventScroll: true });
    }
}
