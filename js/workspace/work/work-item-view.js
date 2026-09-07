"use strict";
/**
 * WorkItemRow (escritorio) ↔ WorkItemCard (móvil) — Addendum §5.5.
 *
 * UN SOLO modelo semántico con dos composiciones. La disposición cambia; la
 * información autoritativa NO: obligación, estado, vencimiento/vencido,
 * prioridad, contexto del Lead y acción principal disponible están presentes
 * en ambas. Por eso las dos se generan desde `protoRenderWorkItem()`, y el
 * cambio entre una y otra es puramente CSS.
 *
 * La acción principal sale de `workItem.availableActions`: no se deriva del
 * tipo ni del estado.
 */
function protoEsc(texto) {
    const d = document.createElement("div");
    d.textContent = texto;
    return d.innerHTML;
}
function protoFormatFecha(iso) {
    if (!iso)
        return "Sin plazo";
    const d = new Date(iso);
    return d.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
/** Prioridad como texto + forma, nunca sólo por color (WCAG 1.4.1). */
function protoRenderPriorityBadge(code) {
    return `<span class="ws-priority ws-priority--${code.toLowerCase()}">
    <span class="ws-priority__dot" aria-hidden="true"></span>${protoEsc(PROTO_PRIORITY_LABEL[code])}</span>`;
}
function protoRenderStatusBadge(status) {
    return `<span class="ws-chip ws-chip--${status.toLowerCase()}">${protoEsc(PROTO_WORK_ITEM_STATUS_LABEL[status])}</span>`;
}
/** Acción principal: la primera acción material que el fixture autoriza. */
function protoPrimaryAction(item) {
    const materiales = item.availableActions
        .map((a) => protoFindAction(a))
        .filter((a) => a !== null && a.material);
    if (materiales.length > 0)
        return materiales[0] ?? null;
    const primera = item.availableActions[0];
    return primera ? protoFindAction(primera) : null;
}
/**
 * Composición única. `variante` sólo determina las clases; el contenido
 * semántico es idéntico en fila y tarjeta.
 */
function protoRenderWorkItem(item, variante) {
    const accion = protoPrimaryAction(item);
    const base = variante === "row" ? "ws-workitem--row" : "ws-workitem--card";
    const vencido = item.isOverdue;
    return `
    <article class="ws-workitem ${base}" data-row-id="${protoEsc(item.workItemId)}" data-work-item="${protoEsc(item.workItemId)}">
      <div class="ws-workitem__main">
        <p class="ws-workitem__type">
          <span class="ws-workitem__id">${protoEsc(item.workItemId)}</span>
          ${protoEsc(PROTO_WORK_ITEM_TYPE_LABEL[item.type])}
        </p>
        <h3 class="ws-workitem__title">${protoEsc(item.title)}</h3>
        <p class="ws-workitem__obligation">${protoEsc(item.obligation)}</p>
        <p class="ws-workitem__reason">${protoEsc(item.reasonSummary)}</p>
      </div>

      <dl class="ws-workitem__meta">
        <div><dt>Lead</dt><dd>
          <a href="${protoEsc(protoResolveRoute("workspace/leads/") + "&leadId=" + item.subject.leadId)}">${protoEsc(item.subject.leadReference)}</a>
          · ${protoEsc(item.subject.companyName)}
        </dd></div>
        <div><dt>Estado</dt><dd>${protoRenderStatusBadge(item.status)}</dd></div>
        <div><dt>Prioridad</dt><dd>${protoRenderPriorityBadge(item.priority)}</dd></div>
        <div><dt>Responsable</dt><dd>${item.assignee ? protoEsc(item.assignee.displayName) : "Sin asignar"}</dd></div>
        <div><dt>Vencimiento</dt><dd>
          ${protoEsc(protoFormatFecha(item.dueAt))}
          ${vencido ? '<strong class="ws-overdue">Vencido</strong>' : ""}
        </dd></div>
      </dl>

      <div class="ws-workitem__actions">
        ${accion
        ? `<a class="c-btn c-btn--primary" href="${protoEsc(protoResolveRoute(item.targetRoute))}"
                  data-work-action="${protoEsc(accion.id)}">${protoEsc(accion.label)}</a>`
        : `<span class="ws-workitem__noaction">Sin acciones disponibles</span>`}
      </div>
    </article>`;
}
/** Lista completa, con estado vacío explícito. */
function protoRenderWorkList(items, vacioTexto) {
    if (items.length === 0) {
        return `<p class="ws-empty" role="status">${protoEsc(vacioTexto)}</p>`;
    }
    return `<div class="ws-worklist">${items.map((i) => protoRenderWorkItem(i, "row")).join("")}</div>`;
}
/**
 * Guarda scroll y foco antes de abrir un workspace especializado.
 *
 * Vive aquí —y no en `my-work.ts`— porque la usan My Work y Work Queue, y cada
 * página carga un subconjunto distinto de scripts: un global compartido debe
 * residir en un archivo que todas carguen. (Misma lección que en PM-UX14-03.)
 */
function protoWireWorkListNavigation(surface) {
    document.querySelectorAll("[data-work-item]").forEach((art) => {
        art.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                protoRememberPosition(surface, art.getAttribute("data-work-item") ?? undefined);
            });
        });
    });
}
/**
 * SYS-08 — WorkItem resuelto o ya no activo.
 *
 * Reemplazo EN LÍNEA en la propia ruta del WorkItem (Addendum §7.4). No se
 * devuelve un 404: el elemento existe, cambió de estado. Se muestra el
 * resultado autoritativo, no se rehabilita la acción original y se ofrece una
 * ruta segura de vuelta.
 *
 * Devuelve true si sustituyó el contenido de la superficie.
 */
function protoRenderSys08IfResolved(host, workItemId) {
    if (!workItemId)
        return false;
    const item = protoFindWorkItem(workItemId);
    if (!item)
        return false;
    if (PROTO_WORK_ITEM_ACTIVE.includes(item.status))
        return false;
    const lead = protoFindLead(item.subject.leadId);
    const opp = protoFindCreatedOpportunity(item.subject.leadId);
    host.innerHTML = `
    <p class="ws-code">SYS-08 · WORKITEM_NO_LONGER_ACTIVE</p>
    <h1 class="ws-page__title">Este trabajo ya fue resuelto</h1>

    <div class="c-alert c-alert--info" role="status">
      <p class="c-alert-message">La obligación <strong>${protoEsc(item.workItemId)}</strong> cambió de estado desde que abriste esta vista. No se perdió nada y no hace falta que hagas nada aquí.</p>
    </div>

    <dl class="ws-context">
      <div><dt>Obligación</dt><dd>${protoEsc(item.title)}</dd></div>
      <div><dt>Tipo</dt><dd>${protoEsc(PROTO_WORK_ITEM_TYPE_LABEL[item.type])}</dd></div>
      <div><dt>Estado actual</dt><dd>${protoEsc(PROTO_WORK_ITEM_STATUS_LABEL[item.status])}</dd></div>
      <div><dt>Resuelta</dt><dd>${protoEsc(protoFormatFecha(item.updatedAt))}</dd></div>
      <div><dt>Responsable</dt><dd>${item.assignee ? protoEsc(item.assignee.displayName) : "Sin asignar"}</dd></div>
      <div><dt>Resultado</dt><dd>${opp
        ? `El lead se convirtió en la oportunidad <strong>${protoEsc(opp.opportunityReference)}</strong>.`
        : protoEsc(item.reasonSummary)}</dd></div>
    </dl>

    <p class="ws-muted ws-small">La acción original ya no está disponible: reintentarla duplicaría un trabajo que otra persona o el sistema ya cerró.</p>

    <div class="ws-actions">
      ${lead ? `<a class="c-btn c-btn--primary" href="${protoEsc(protoRouteHref("lab-001-leads", { leadId: lead.leadId }))}">Ver el lead ${protoEsc(lead.leadReference)}</a>` : ""}
      ${opp ? `<a class="c-btn c-btn--secondary" href="${protoEsc(protoRouteHref("lab-001-opportunity", { leadId: item.subject.leadId, view: "handoff" }))}">Ver el handoff</a>` : ""}
      <a class="c-btn c-btn--secondary" href="${protoEsc(protoRouteHref("lab-001-queue"))}">Volver a la cola</a>
    </div>`;
    document.title = `SYS-08 ${item.workItemId} — Workspace (prototipo)`;
    return true;
}
