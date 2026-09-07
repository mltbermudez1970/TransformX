"use strict";
/**
 * APP-02 My Work — obligaciones personales del actor, cross-BizCap.
 *
 * My Work es WorkItem-céntrico: muestra lo que el actor DEBE hacer, con
 * independencia de quién sea el dueño comercial del Lead. Eso lo distingue de
 * LEAD-02 My Leads, que es ownership-céntrico.
 */
const PROTO_MY_WORK_SURFACE = "my-work";
function protoRenderMyWork() {
    const host = document.querySelector("[data-my-work]");
    if (!host)
        return;
    const user = protoGetSessionUser();
    if (!user)
        return;
    const items = protoGetMyWork(user.userId);
    const ajenos = items.filter((i) => i.commercialOwner && i.commercialOwner.userId !== user.userId);
    host.innerHTML = `
    <h1 class="ws-page__title">My Work</h1>
    <p class="ws-page__lead">Tus obligaciones activas en todas las BizCaps. Aquí aparece lo que <strong>tú</strong> debes atender, seas o no el dueño comercial del lead.</p>
    ${protoRenderMockNotice()}

    <div class="ws-summary" role="group" aria-label="Resumen de trabajo">
      <div class="ws-summary__item"><span class="ws-summary__n">${String(items.length)}</span> obligaciones activas</div>
      <div class="ws-summary__item"><span class="ws-summary__n">${String(items.filter((i) => i.isOverdue).length)}</span> vencidas</div>
      <div class="ws-summary__item"><span class="ws-summary__n">${String(items.filter((i) => i.priority === "HIGH").length)}</span> de prioridad alta</div>
    </div>

    ${ajenos.length
        ? `<p class="ws-note" role="note">${String(ajenos.length)} de estas obligaciones corresponden a leads cuyo dueño comercial es otra persona. Ser responsable de un WorkItem no transfiere la propiedad comercial del lead.</p>`
        : ""}

    <h2 id="my-work-list-title">Obligaciones asignadas a ti</h2>
    ${protoRenderWorkList(items, "No tienes obligaciones activas. El trabajo nuevo aparecerá aquí cuando se te asigne.")}

    <p class="ws-page__foot"><a href="${protoRouteHref("lab-001-queue")}">Ver la cola del equipo</a> · <a href="${protoRouteHref("lab-001-leads")}">Ir a Leads</a></p>`;
    protoWireWorkListNavigation(PROTO_MY_WORK_SURFACE);
    protoRestorePosition(PROTO_MY_WORK_SURFACE);
}
document.addEventListener("DOMContentLoaded", () => {
    if (!protoIsAuthenticated())
        return;
    protoRenderMyWork();
});
