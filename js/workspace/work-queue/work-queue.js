"use strict";
/**
 * WORK-01 Work Queue — triage operacional del equipo / BizCap.
 *
 * Diferencia con My Work: la cola muestra el trabajo del equipo, incluidas las
 * obligaciones sin responsable asignado.
 *
 * Orden: lo provee el fixture (Addendum §5.6). El frontend NO lo calcula.
 * Trabajo nuevo: se anuncia con un banner y sólo entra tras un refresco
 * explícito. Nunca se reordena la lista bajo el cursor del usuario.
 */
const PROTO_QUEUE_SURFACE = "work-queue";
/** Trabajo entrante ya incorporado tras un refresco explícito. */
let protoQueueRefrescada = false;
function protoQueueItems() {
    const base = protoGetWorkQueue();
    return protoQueueRefrescada ? [...base, ...PROTO_INCOMING_WORK_ITEMS] : base;
}
function protoRenderWorkQueue() {
    const host = document.querySelector("[data-work-queue]");
    if (!host)
        return;
    const items = protoQueueItems();
    const sinAsignar = items.filter((i) => !i.assignee).length;
    host.innerHTML = `
    <h1 class="ws-page__title">Work Queue</h1>
    <p class="ws-page__lead">Triage operacional de LAB-001. Incluye obligaciones sin responsable asignado.</p>
    ${protoRenderMockNotice()}

    <div class="ws-banner-refresh" data-queue-banner hidden role="status">
      <p>Hay trabajo nuevo disponible.</p>
      <button type="button" class="c-btn c-btn--secondary" data-queue-refresh>Actualizar la cola</button>
    </div>

    <div class="ws-summary" role="group" aria-label="Resumen de la cola">
      <div class="ws-summary__item"><span class="ws-summary__n">${String(items.length)}</span> elementos activos</div>
      <div class="ws-summary__item"><span class="ws-summary__n">${String(sinAsignar)}</span> sin responsable</div>
      <div class="ws-summary__item"><span class="ws-summary__n">${String(items.filter((i) => i.isOverdue).length)}</span> vencidos</div>
    </div>

    <p class="ws-note" role="note">El orden de esta cola lo determina la política de la BizCap y llega ya resuelto: la interfaz no lo recalcula. Marcar algo como vencido no cambia su prioridad ni las acciones permitidas.</p>

    <h2 id="queue-list-title">Cola del equipo</h2>
    ${protoRenderWorkList(items, "La cola está vacía. No hay obligaciones activas en esta BizCap.")}`;
    protoWireWorkListNavigation(PROTO_QUEUE_SURFACE);
    protoRestorePosition(PROTO_QUEUE_SURFACE);
    protoWireQueueRefresh();
    protoScheduleIncomingWork();
}
function protoWireQueueRefresh() {
    document.querySelector("[data-queue-refresh]")?.addEventListener("click", () => {
        protoQueueRefrescada = true;
        protoRenderWorkQueue();
        // El foco va al encabezado de la lista para anunciar el cambio de contenido.
        document.querySelector("#queue-list-title")?.setAttribute("tabindex", "-1");
        document.querySelector("#queue-list-title")?.focus();
    });
}
/**
 * Simula la llegada de trabajo nuevo. NO lo inserta: sólo revela el banner,
 * para no reordenar la lista mientras la persona está trabajando.
 *
 * `?incoming=1` lo revela de inmediato: en una sesión de validación no se
 * puede depender de un temporizador, que además los navegadores estrangulan
 * cuando la pestaña no está en primer plano.
 */
function protoScheduleIncomingWork() {
    if (protoQueueRefrescada)
        return;
    const banner = document.querySelector("[data-queue-banner]");
    if (!banner)
        return;
    if (protoUrlParam("incoming") === "1") {
        banner.hidden = false;
        return;
    }
    window.setTimeout(() => {
        if (!protoQueueRefrescada)
            banner.hidden = false;
    }, 2500);
}
document.addEventListener("DOMContentLoaded", () => {
    if (!protoIsAuthenticated())
        return;
    protoRenderWorkQueue();
});
