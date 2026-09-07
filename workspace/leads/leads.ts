/**
 * LEAD-01 Leads List · LEAD-02 My Leads · LEAD-03 Lead Detail.
 *
 * Un host, dos modos: sin `?leadId` es la lista con vistas guardadas; con
 * `?leadId` es el detalle.
 *
 * My Leads (`LEADS_MY_OWNED`) es ownership-céntrico: filtra por dueño comercial
 * del lead, dato que provee el fixture. No se infiere del responsable del
 * WorkItem, que es un concepto distinto.
 *
 * El detalle respeta el orden obligatorio de 10 secciones del Addendum §9 y no
 * lo reordena.
 */

const PROTO_LEADS_SURFACE = "leads";

function protoLeadsViewId(): string {
  const estado = protoReadViewState(PROTO_LEADS_SURFACE);
  return protoUrlParam("view") ?? estado?.savedViewId ?? "LEADS_MY_OWNED";
}

/* ===========================================================================
 * LEAD-01 / LEAD-02 — Lista con vistas guardadas
 * ========================================================================= */

function protoRenderLeadsList(host: HTMLElement, user: ProtoAuthUser): void {
  const viewId = protoLeadsViewId();
  const view = protoGetSavedView(viewId);
  const estado = protoReadViewState(PROTO_LEADS_SURFACE);

  const orden = estado?.sortField
    ? [{ field: estado.sortField, direction: estado.sortDirection ?? "DESC" }]
    : undefined;

  const filas = protoResolveSavedView(viewId, user.userId, undefined, orden);

  const tabs = PROTO_SAVED_VIEWS.map((v) => {
    const actual = v.savedViewId === viewId;
    return `<a class="ws-viewtab${actual ? " is-current" : ""}" href="${protoRouteHref("lab-001-leads", { view: v.savedViewId })}"
      ${actual ? 'aria-current="page"' : ""}>${protoEsc(v.name)}</a>`;
  }).join("");

  host.innerHTML = `
    <h1 class="ws-page__title">Leads</h1>
    <p class="ws-page__lead">${
      viewId === "LEADS_MY_OWNED"
        ? "Leads cuyo <strong>dueño comercial</strong> eres tú. No es lo mismo que My Work, que lista las obligaciones asignadas a ti."
        : "Todos los leads accesibles en esta BizCap."
    }</p>
    ${protoRenderMockNotice()}

    <nav class="ws-viewtabs" aria-label="Vistas guardadas">${tabs}</nav>

    <div class="ws-toolbar">
      <label class="ws-toolbar__field">
        <span>Ordenar por</span>
        <select class="form-input" data-leads-sort>
          <option value="priority" ${estado?.sortField !== "updatedAt" ? "selected" : ""}>Prioridad</option>
          <option value="updatedAt" ${estado?.sortField === "updatedAt" ? "selected" : ""}>Última actualización</option>
        </select>
      </label>
      <p class="ws-toolbar__count" role="status">${String(filas.length)} leads</p>
    </div>

    ${
      view?.systemOwned
        ? `<p class="ws-note" role="note">«${protoEsc(view.name)}» es una vista definida por el sistema: puedes cambiar filtros y orden en tu sesión, pero su definición base no se altera. Los estados terminales quedan fuera por defecto.</p>`
        : ""
    }

    ${
      filas.length === 0
        ? `<p class="ws-empty" role="status">No hay leads en esta vista. Prueba con «Todos los leads» o cambia los filtros.</p>`
        : `<div class="workspace-table-wrapper">
            <table class="workspace-table ws-leads-table">
              <caption class="sr-only">Leads de la vista ${protoEsc(view?.name ?? viewId)}</caption>
              <thead><tr>
                <th scope="col">Referencia</th><th scope="col">Empresa / contacto</th>
                <th scope="col">Necesidad</th><th scope="col">Estado</th>
                <th scope="col">Calificación</th><th scope="col">Prioridad</th>
                <th scope="col">Próximo paso</th><th scope="col">Dueño comercial</th>
                <th scope="col">Trabajo abierto</th><th scope="col">Abrir</th>
              </tr></thead>
              <tbody>${filas.map(protoRenderLeadRow).join("")}</tbody>
            </table>
          </div>`
    }`;

  protoWireLeadsList();
  protoRestorePosition(PROTO_LEADS_SURFACE);
}

function protoRenderLeadRow(row: ProtoLeadRow): string {
  return `
    <tr data-row-id="${protoEsc(row.leadId)}">
      <th scope="row">${protoEsc(row.leadReference)}</th>
      <td>${protoEsc(row.companyName)}<br><span class="ws-muted">${protoEsc(row.contactName)}</span></td>
      <td>${row.productOffering ? protoEsc(row.productOffering) : "<span class='ws-muted'>—</span>"}${
        row.quantityUnit ? `<br><span class="ws-muted">${protoEsc(row.quantityUnit)}</span>` : ""
      }</td>
      <td>${protoEsc(PROTO_LEAD_STATE_LABEL[row.lifecycleState])}</td>
      <td>${protoEsc(row.qualificationSummary)}</td>
      <td>${protoRenderPriorityBadge(row.priority.code)}</td>
      <td>${protoEsc(row.nextBestAction.label)}</td>
      <td>${row.commercialOwner ? protoEsc(row.commercialOwner.displayName) : "<span class='ws-muted'>Sin asignar</span>"}</td>
      <td>${String(row.openWorkCount)}</td>
      <td><a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-leads", { leadId: row.leadId })}"
             data-open-lead="${protoEsc(row.leadId)}">Abrir</a></td>
    </tr>`;
}

function protoWireLeadsList(): void {
  document.querySelector<HTMLSelectElement>("[data-leads-sort]")?.addEventListener("change", (e) => {
    const campo = (e.currentTarget as HTMLSelectElement).value;
    protoPatchViewState(PROTO_LEADS_SURFACE, {
      savedViewId: protoLeadsViewId(),
      sortField: campo,
      sortDirection: "DESC",
    });
    location.reload();
  });

  // Preserva vista, orden, posición y scroll antes de abrir el detalle.
  document.querySelectorAll<HTMLAnchorElement>("[data-open-lead]").forEach((a) => {
    a.addEventListener("click", () => {
      protoPatchViewState(PROTO_LEADS_SURFACE, { savedViewId: protoLeadsViewId() });
      protoRememberPosition(PROTO_LEADS_SURFACE, a.getAttribute("data-open-lead") ?? undefined);
    });
  });
}

/* ===========================================================================
 * LEAD-03 — Lead Detail (10 secciones, orden fijo)
 * ========================================================================= */

function protoSeccion(n: number, id: string, titulo: string, cuerpo: string): string {
  return `
    <section class="ws-section" id="${id}" aria-labelledby="${id}-title">
      <h2 class="ws-section__title" id="${id}-title">
        <span class="ws-section__n" aria-hidden="true">${String(n)}</span>${protoEsc(titulo)}
      </h2>
      ${cuerpo}
    </section>`;
}

function protoRenderCampoCanonico(label: string, campo: ProtoCanonicalField<unknown>, requerido: boolean): string {
  const valor =
    campo.status === "CANONICAL" ? protoEsc(String(campo.value))
      : campo.status === "MISSING" ? `<span class="ws-missing">Falta${requerido ? " (requerido)" : ""}</span>`
      : `<span class="ws-muted">No proporcionado${requerido ? " (requerido)" : ""}</span>`;
  return `<div><dt>${protoEsc(label)}${requerido ? ' <span class="ws-req" title="Requerido para calificar">*</span>' : ""}</dt><dd>${valor}</dd></div>`;
}

function protoRenderLeadDetail(host: HTMLElement, leadId: string, user: ProtoAuthUser): void {
  const lead = protoFindLead(leadId);
  if (!lead) {
    location.replace(protoRouteHref("system", { state: "not-found" }));
    return;
  }

  const row = protoLeadRow(leadId);
  const ops = protoGetLeadOperations(leadId);
  const qual = protoGetQualification(leadId);
  const abiertos = protoGetOpenWork(leadId);
  const cerrados = protoGetClosedWork(leadId);
  const comms = protoGetCommunications(leadId);
  const faltantes = protoMissingRequiredFields(lead);
  const n = lead.commercialNeed;
  const nba = ops?.nextBestAction;
  const nbaEjecutable = nba ? protoNbaEsEjecutable(nba, lead.availableActions) : false;

  const accionPrincipal = lead.availableActions
    .map((a) => protoFindAction(a))
    .find((a): a is ProtoActionDefinition => a !== null && a.material);

  host.innerHTML = `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-leads")}" data-back-to-list>← Volver a la lista</a></p>
    ${protoRenderMockNotice()}
    <div class="ws-feedback" data-lead-feedback role="status" aria-live="polite"></div>

    <!-- La identidad del lead es el título de la página: dentro de la sección 1
         el esquema de encabezados abría en h2 («Encabezado») y el h1 quedaba
         por debajo. Las 10 secciones obligatorias y su orden no cambian. -->
    <div class="ws-leadhead__id">
      <p class="ws-leadhead__ref">${protoEsc(lead.leadReference)}</p>
      <h1 class="ws-page__title">${protoEsc(lead.company.companyName)}</h1>
    </div>

    ${protoSeccion(1, "lead-header", "Encabezado", `
      <div class="ws-leadhead">
        <p class="ws-leadhead__state">${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])} · ${protoEsc(PROTO_LEAD_STATE_MEANING[lead.lifecycleState])}</p>
        <p class="ws-leadhead__owner">Dueño comercial: <strong>${ops?.commercialOwner ? protoEsc(ops.commercialOwner.displayName) : "sin asignar"}</strong></p>
        <div class="ws-actions">
          ${accionPrincipal
            ? `<button type="button" class="c-btn c-btn--primary" data-lead-command="${protoEsc(accionPrincipal.id)}">${protoEsc(accionPrincipal.label)}</button>`
            : `<span class="ws-muted">Sin acciones materiales disponibles para este lead.</span>`}
        </div>
        <p class="ws-muted ws-small">Las acciones disponibles las provee la BizCap según estado, readiness y permisos. La interfaz no las deduce.</p>
      </div>`)}

    ${protoSeccion(2, "lead-situation", "Situación actual", `
      <dl class="ws-context">
        <div><dt>Estado</dt><dd>${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])}</dd></div>
        <div><dt>Bloqueo</dt><dd>${faltantes.length
          ? `Información requerida ausente: ${protoEsc(faltantes.join(", "))}`
          : abiertos.length ? "Obligaciones abiertas pendientes" : "Sin bloqueos declarados"}</dd></div>
        <div><dt>Próximo paso</dt><dd>${nba ? protoEsc(nba.label) : "—"}</dd></div>
        <div><dt>Trabajo inmediato</dt><dd>${String(abiertos.length)} obligación(es) activa(s)</dd></div>
      </dl>`)}

    ${protoSeccion(3, "lead-need", "Necesidad comercial", `
      <p class="ws-muted ws-small">Valores canónicos vigentes (versión ${String(n.version)}). <span class="ws-req">*</span> marca lo requerido para iniciar la calificación.</p>
      <dl class="ws-context">
        ${protoRenderCampoCanonico("Producto / oferta", n.productOffering, true)}
        ${protoRenderCampoCanonico("Cantidad", n.quantity, true)}
        ${protoRenderCampoCanonico("Unidad", n.unit, true)}
        ${protoRenderCampoCanonico("Destino", n.geographyDestination, true)}
        ${protoRenderCampoCanonico("Demanda recurrente", n.recurringDemand, false)}
        ${protoRenderCampoCanonico("Material", n.material, false)}
        ${protoRenderCampoCanonico("Dimensiones / capacidad", n.dimensionsOrCapacity, false)}
        ${protoRenderCampoCanonico("Fecha requerida", n.requestedOrRequiredDate, false)}
        ${protoRenderCampoCanonico("Requisitos especiales", n.specialRequirements, false)}
      </dl>
      <p class="ws-muted ws-small">Contacto: ${protoEsc(lead.contact.fullName)} · ${lead.contact.email ? protoEsc(lead.contact.email) : "sin correo"} · ${lead.contact.phone ? protoEsc(lead.contact.phone) : "sin teléfono"}</p>`)}

    ${protoSeccion(4, "lead-qualification", "Calificación", qual
      ? `<p>Resultado global: <strong>${protoEsc(PROTO_CRITERION_STATUS_LABEL[qual.overallStatus])}</strong> · evaluación ${protoEsc(qual.assessmentId)} v${String(qual.assessmentVersion)}</p>
         <ul class="ws-criteria">${qual.criteria.map((c) => `
           <li class="ws-criteria__item">
             <span class="ws-crit ws-crit--${c.status.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[c.status])}</span>
             <span class="ws-criteria__name">${protoEsc(c.id)} ${protoEsc(c.name)}</span>
             <a href="${protoRouteHref("lab-001-qualification", { leadId: leadId, criterion: c.id })}">Ver criterio</a>
           </li>`).join("")}</ul>
         <p class="ws-actions"><a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-qualification", { leadId: leadId })}">Ver calificación completa</a></p>`
      : `<p class="ws-empty" role="status">Este lead aún no tiene evaluación de calificación.</p>`)}

    ${protoSeccion(5, "lead-priority", "Prioridad / Próximo paso", ops
      ? `<dl class="ws-context">
           <div><dt>Prioridad</dt><dd>${protoRenderPriorityBadge(ops.priority.code)} ${ops.priority.reasonSummary ? `<br><span class="ws-muted ws-small">${protoEsc(ops.priority.reasonSummary)}</span>` : ""}</dd></div>
           <div><dt>Origen de la prioridad</dt><dd>${protoEsc(ops.priority.source)}${ops.priority.policyVersion ? ` · ${protoEsc(ops.priority.policyVersion)}` : ""}</dd></div>
           ${ops.priority.override ? `<div><dt>Anulación humana</dt><dd>${protoEsc(ops.priority.override.actor)} — ${protoEsc(ops.priority.override.rationale)}</dd></div>` : ""}
           <div><dt>Próximo paso recomendado</dt><dd>${protoEsc(ops.nextBestAction.label)}<br><span class="ws-muted ws-small">${protoEsc(ops.nextBestAction.rationale)}</span></dd></div>
           <div><dt>Origen de la recomendación</dt><dd>${protoEsc(PROTO_NBA_SOURCE_LABEL[ops.nextBestAction.source])}${
             ops.nextBestAction.source === "AI_RECOMMENDATION" && ops.nextBestAction.confidence !== null
               ? ` · confianza ${String(Math.round(ops.nextBestAction.confidence * 100))}%` : ""}</dd></div>
         </dl>
         ${ops.nextBestAction.source === "AI_RECOMMENDATION"
            ? `<p class="c-alert c-alert--info" role="note"><span class="c-alert-message">Sugerencia de IA. No es una decisión del sistema ni una autorización.</span></p>` : ""}
         <div class="ws-actions">
           ${nbaEjecutable && ops.nextBestAction.targetRoute
             ? `<a class="c-btn c-btn--primary" href="${protoResolveRoute(ops.nextBestAction.targetRoute)}">${protoEsc(ops.nextBestAction.label)}</a>`
             : `<p class="ws-muted ws-small">Esta recomendación se muestra como orientación: la acción correspondiente no está entre las disponibles para este lead, así que no se ofrece como comando.</p>`}
         </div>
         <p class="ws-muted ws-small">La prioridad ordena el trabajo; no es un resultado de calificación ni una autorización para ejecutar.</p>`
      : `<p class="ws-empty" role="status">Sin prioridad ni recomendación calculadas para este lead.</p>`)}

    ${protoSeccion(6, "lead-assignment", "Asignación", `
      <dl class="ws-context">
        <div><dt>Dueño comercial</dt><dd>${ops?.commercialOwner ? protoEsc(ops.commercialOwner.displayName) : "Sin asignar"}</dd></div>
        <div><dt>Resumen</dt><dd>${ops?.assignmentSummary ? protoEsc(ops.assignmentSummary) : "Asignación estándar."}</dd></div>
      </dl>
      <p class="ws-muted ws-small">El responsable de un WorkItem no es necesariamente el dueño comercial del lead. El flujo de excepción de asignación se construye en PM-UX14-05.</p>`)}

    ${protoSeccion(7, "lead-readiness", "Opportunity Readiness", `
      <p>${ops?.readinessSummary ? protoEsc(ops.readinessSummary) : "Sin evaluación de readiness disponible en el fixture para este lead."}</p>
      <p class="ws-muted ws-small">Calificado no es lo mismo que listo. El detalle de condiciones y el flujo de conversión se construyen en PM-UX14-06; aquí no se calcula nada localmente.</p>`)}

    ${protoSeccion(8, "lead-openwork", "Trabajo abierto", abiertos.length
      ? `<p>${String(abiertos.length)} obligación(es) activa(s).</p>
         <div class="ws-worklist">${abiertos.map((w) => protoRenderWorkItem(w, "row")).join("")}</div>
         <p class="ws-muted ws-small">Sólo se listan obligaciones abiertas, en curso o en espera. Las resueltas y canceladas viven en Historial / Evidencia.</p>`
      : `<p class="ws-empty" role="status">No hay trabajo pendiente para este lead.</p>`)}

    ${protoSeccion(9, "lead-communications", "Comunicaciones", comms.length
      ? `<p class="ws-muted ws-small">Más recientes primero. Un borrador o un envío fallido no cuentan como primera respuesta válida.</p>
         <ul class="ws-comms">${comms.map(protoRenderCommunication).join("")}</ul>`
      : `<p class="ws-empty" role="status">Sin comunicaciones registradas para este lead.</p>`)}

    ${protoSeccion(10, "lead-history", "Historial / Evidencia", `
      <dl class="ws-context">
        <div><dt>Versión canónica</dt><dd>${String(lead.canonicalVersion)}</dd></div>
        <div><dt>Recibido</dt><dd>${protoEsc(protoFormatFecha(lead.receivedAt))} · ${protoEsc(lead.source)} / ${protoEsc(lead.channel)}</dd></div>
        <div><dt>Última actualización</dt><dd>${protoEsc(protoFormatFecha(lead.updatedAt))}</dd></div>
        <div><dt>Trabajo cerrado</dt><dd>${cerrados.length
          ? cerrados.map((w) => `${protoEsc(w.workItemId)} · ${protoEsc(PROTO_WORK_ITEM_STATUS_LABEL[w.status])}`).join("<br>")
          : "Sin trabajo cerrado registrado"}</dd></div>
      </dl>
      <p class="ws-muted ws-small">Punto de entrada a trazabilidad. Ni Trabajo abierto ni Comunicaciones lo sustituyen.</p>`)}`;

  protoWireLeadDetail(leadId, row);
}

function protoRenderCommunication(c: ProtoCommunication): string {
  const valida = protoEsPrimeraRespuestaValida(c.status, c.direction);
  return `
    <li class="ws-comm ws-comm--${c.direction.toLowerCase()}">
      <p class="ws-comm__head">
        <span class="ws-chip">${protoEsc(PROTO_COMM_DIRECTION_LABEL[c.direction])}</span>
        <span class="ws-chip">${protoEsc(PROTO_COMM_CHANNEL_LABEL[c.channel])}</span>
        <span class="ws-chip ws-chip--${c.status.toLowerCase()}">${protoEsc(PROTO_COMM_STATUS_LABEL[c.status])}</span>
        ${c.isFirstResponse && valida ? '<span class="ws-chip ws-chip--ok">Primera respuesta</span>' : ""}
      </p>
      ${c.subject ? `<p class="ws-comm__subject">${protoEsc(c.subject)}</p>` : ""}
      <p class="ws-comm__summary">${protoEsc(c.summary)}</p>
      <p class="ws-comm__meta">${protoEsc(PROTO_COMM_ACTOR_LABEL[c.from.actorType])}: ${protoEsc(c.from.displayName)} · ${protoEsc(protoFormatFecha(c.receivedAt ?? c.dispatchedAt ?? c.createdAt))}</p>
      ${c.from.actorType === "AI_ASSISTED_HUMAN" && c.status === "DRAFT"
        ? `<p class="ws-comm__ai">Borrador asistido por IA — sigue etiquetado como asistencia hasta que una persona lo envíe.</p>` : ""}
      ${c.status === "FAILED"
        ? `<p class="ws-comm__failed">Envío fallido (${protoEsc(c.failureCode ?? "sin código")}). No cuenta como respuesta válida${
            c.availableActions?.includes("RETRY_COMMUNICATION") ? "; se puede reintentar." : "."}</p>` : ""}
    </li>`;
}

function protoWireLeadDetail(leadId: string, row: ProtoLeadRow | null): void {
  const feedback = document.querySelector<HTMLElement>("[data-lead-feedback]");
  document.querySelectorAll<HTMLButtonElement>("[data-lead-command]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const accion = btn.getAttribute("data-lead-command") as ProtoAction | null;
      if (!accion || !feedback) return;
      await protoRunCommand({
        key: `${accion}:${leadId}`,
        action: accion,
        boton: btn,
        feedback,
      });
    });
  });

  // Volver a la lista conservando vista, orden y posición.
  document.querySelector<HTMLAnchorElement>("[data-back-to-list]")?.addEventListener("click", () => {
    protoPatchViewState(PROTO_LEADS_SURFACE, { lastFocusedId: leadId });
  });

  if (row) document.title = `${row.leadReference} ${row.companyName} — Workspace (prototipo)`;
}

/* ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!protoIsAuthenticated()) return;
  const host = document.querySelector<HTMLElement>("[data-leads-surface]");
  const user = protoGetSessionUser();
  if (!host || !user) return;

  const leadId = protoUrlParam("leadId");
  if (leadId) protoRenderLeadDetail(host, leadId, user);
  else protoRenderLeadsList(host, user);
});
