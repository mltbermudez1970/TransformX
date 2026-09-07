"use strict";
/**
 * Comandos materiales — envío único, idempotencia simulada y estados de mock.
 *
 * Addendum §D del prompt maestro PM-UX14-04:
 *  - Envío único: el control se bloquea mientras la operación está en curso.
 *  - Idempotencia simulada: repetir un comando ya aplicado NO lo vuelve a
 *    ejecutar; devuelve el resultado existente y lo dice.
 *  - Conflicto de negocio y dato desactualizado NO son errores técnicos y se
 *    comunican distinto de `recoverable_error`.
 *
 * El desenlace lo fija el escenario o `?mock=` en la URL: es determinístico.
 */
const PROTO_COMMAND_LOG_KEY = "transformx-prototype-commands";
function protoUrlParam(nombre) {
    return new URLSearchParams(location.search).get(nombre);
}
/** Desenlace forzado por URL, para recorrer los nueve estados en validación. */
function protoForcedOutcome() {
    const m = protoUrlParam("mock");
    const validos = [
        "success", "validation_error", "business_conflict",
        "stale", "permission_denied", "recoverable_error",
    ];
    return validos.find((v) => v === m) ?? null;
}
function protoReadCommandLog() {
    try {
        const raw = sessionStorage.getItem(PROTO_COMMAND_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function protoFindApplied(key) {
    return protoReadCommandLog().find((c) => c.key === key) ?? null;
}
function protoRecordApplied(key, requestId) {
    try {
        const log = protoReadCommandLog();
        log.push({ key, requestId, at: new Date().toISOString() });
        sessionStorage.setItem(PROTO_COMMAND_LOG_KEY, JSON.stringify(log));
    }
    catch {
        /* sessionStorage no disponible */
    }
}
/** Permite reiniciar el guion de una sesión de validación. */
function protoResetCommandLog() {
    try {
        sessionStorage.removeItem(PROTO_COMMAND_LOG_KEY);
    }
    catch {
        /* sessionStorage no disponible */
    }
}
function protoRenderFeedback(host, o) {
    const esAlerta = o.severidad === "error" || o.severidad === "warning";
    host.className = `ws-feedback c-alert c-alert--${o.severidad}`;
    host.setAttribute("role", esAlerta ? "alert" : "status");
    host.setAttribute("aria-live", esAlerta ? "assertive" : "polite");
    host.innerHTML = "";
    const p = document.createElement("p");
    p.className = "c-alert-message";
    p.textContent = o.mensaje;
    host.appendChild(p);
    if (o.detalle) {
        const d = document.createElement("p");
        d.className = "c-alert-message ws-feedback__detail";
        d.textContent = o.detalle;
        host.appendChild(d);
    }
    host.hidden = false;
}
/** Vacía el mensaje conservando la región live declarada. */
function protoClearFeedback(host) {
    host.className = "ws-feedback";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    host.textContent = "";
    host.hidden = false;
}
/**
 * Ejecuta un comando material con envío único e idempotencia simulada.
 * Devuelve true si el comando quedó aplicado en esta invocación.
 */
async function protoRunCommand(o) {
    const def = protoFindAction(o.action);
    const etiqueta = o.boton.textContent ?? def?.label ?? "Confirmar";
    // Idempotencia: no se vuelve a ejecutar, se informa el resultado existente.
    const previo = protoFindApplied(o.key);
    if (previo) {
        protoRenderFeedback(o.feedback, {
            severidad: "info",
            mensaje: "Esta operación ya se había aplicado; no se repitió.",
            detalle: `Se conserva el resultado de la solicitud ${previo.requestId}.`,
        });
        return false;
    }
    // Envío único.
    o.boton.disabled = true;
    o.boton.classList.add("c-btn--loading");
    o.boton.setAttribute("aria-busy", "true");
    const desenlace = protoForcedOutcome() ?? o.outcome ?? "success";
    const res = await protoMockRequest({ operationId: o.action, outcome: desenlace, latencyMs: 700 });
    o.boton.disabled = false;
    o.boton.classList.remove("c-btn--loading");
    o.boton.setAttribute("aria-busy", "false");
    o.boton.textContent = etiqueta;
    switch (res.kind) {
        case "success":
            protoRecordApplied(o.key, res.requestId);
            protoRenderFeedback(o.feedback, {
                severidad: "success",
                mensaje: "Operación aplicada (simulada).",
                detalle: `Solicitud ${res.requestId}. Reintentarla no la duplicará.`,
            });
            o.alAplicar?.();
            return true;
        case "validation_error":
            protoRenderFeedback(o.feedback, {
                severidad: "error",
                mensaje: res.message,
                detalle: "Corrige los campos marcados y vuelve a enviar.",
            });
            return false;
        case "business_conflict":
            // Resultado de negocio, NO error técnico.
            protoRenderFeedback(o.feedback, {
                severidad: "warning",
                mensaje: "La acción no es válida para el estado actual del registro.",
                detalle: "No es una falla del sistema: el estado cambió o la política no la permite. Recarga para ver la versión vigente.",
            });
            return false;
        case "stale":
            protoRenderFeedback(o.feedback, {
                severidad: "warning",
                mensaje: "Otra persona actualizó este registro mientras trabajabas.",
                detalle: "Nada se perdió. Recarga para ver la versión vigente y sus acciones disponibles.",
            });
            return false;
        case "permission_denied":
            protoRenderFeedback(o.feedback, {
                severidad: "error",
                mensaje: "No tienes autoridad para ejecutar esta acción.",
                detalle: "Es un resultado de gobernanza, no un error. Los permisos los define tu organización.",
            });
            return false;
        case "recoverable_error":
            protoRenderFeedback(o.feedback, {
                severidad: "error",
                mensaje: "No pudimos completar la operación.",
                detalle: `Problema temporal; no se perdió lo introducido. Puedes reintentar. Referencia ${res.requestId}.`,
            });
            return false;
        default:
            return false;
    }
}
/** Cabecera reutilizable con el estado forzado, visible para el facilitador. */
function protoRenderMockNotice() {
    const forzado = protoForcedOutcome();
    if (!forzado)
        return "";
    return `<p class="ws-mock-notice" role="status">Estado simulado forzado por URL: <code>${forzado}</code></p>`;
}
