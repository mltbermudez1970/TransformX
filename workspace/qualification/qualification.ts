/**
 * QUAL-01 Qualification Summary · QUAL-02 Qualification Criterion Detail.
 *
 * Distinciones que la interfaz debe hacer visibles, no sólo por color:
 *   FAIL      — la regla no se satisface. Resultado de negocio, no error técnico.
 *   REVIEW    — la regla no puede resolverlo sola; requiere criterio humano.
 *   EXCEPTION — una autoridad aprobó una excepción; conserva la evaluación
 *               original y su evidencia, y añade la autorización por separado.
 *
 * El resultado global lo provee el fixture. El frontend no lo calcula.
 */

function protoRenderQual01(host: HTMLElement, lead: ProtoCanonicalLead): void {
  const qual = protoGetQualification(lead.leadId);

  if (!qual) {
    host.innerHTML = `
      ${protoRenderQualCabecera(lead, "Calificación", "QUAL-01")}
      <p class="ws-empty" role="status">Este lead aún no tiene evaluación de calificación. Inícialas desde el lead cuando la acción esté disponible.</p>`;
    return;
  }

  host.innerHTML = `
    ${protoRenderQualCabecera(lead, "Resumen de calificación", "QUAL-01")}
    <div class="ws-feedback" data-qual-feedback role="status" aria-live="polite"></div>

    <section class="ws-section" aria-labelledby="qual-overall-title">
      <h2 class="ws-section__title" id="qual-overall-title">Resultado global</h2>
      <p class="ws-qual-overall">
        <span class="ws-crit ws-crit--${qual.overallStatus.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[qual.overallStatus])}</span>
        <span class="ws-muted">Evaluación ${protoEsc(qual.assessmentId)} · versión ${String(qual.assessmentVersion)}</span>
      </p>
      <p class="ws-muted ws-small">${protoEsc(PROTO_CRITERION_STATUS_MEANING[qual.overallStatus])}</p>
      <p class="ws-muted ws-small">Este resultado lo determina la BizCap. La interfaz lo muestra; no lo recalcula.</p>
    </section>

    <section class="ws-section" aria-labelledby="qual-criteria-title">
      <h2 class="ws-section__title" id="qual-criteria-title">Criterios QD-01 … QD-05</h2>
      <div class="workspace-table-wrapper">
        <table class="workspace-table">
          <caption class="sr-only">Criterios de calificación del lead ${protoEsc(lead.leadReference)}</caption>
          <thead><tr>
            <th scope="col">ID</th><th scope="col">Criterio</th><th scope="col">Resultado</th>
            <th scope="col">Qué significa</th><th scope="col">Detalle</th>
          </tr></thead>
          <tbody>${qual.criteria.map((c) => `
            <tr>
              <th scope="row">${protoEsc(c.id)}</th>
              <td>${protoEsc(c.name)}</td>
              <td><span class="ws-crit ws-crit--${c.status.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[c.status])}</span></td>
              <td class="ws-small">${protoEsc(PROTO_CRITERION_STATUS_MEANING[c.status])}</td>
              <td><a href="${protoRouteHref("lab-001-qualification", { leadId: lead.leadId, criterion: c.id })}">Ver criterio</a></td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>

    ${protoRenderQualRevisionEntrada(lead, qual)}`;

  protoWireQual(lead);
}

/** Entrada a revisión humana (S-05). La decisión completa es de PM-UX14-05. */
function protoRenderQualRevisionEntrada(lead: ProtoCanonicalLead, qual: ProtoQualification): string {
  const enRevision = qual.criteria.filter((c) => c.status === "REVIEW");
  if (enRevision.length === 0) return "";

  // La acción de entrada la decide el fixture, no este código: se toma la
  // primera de las candidatas que la BizCap autorice para este lead.
  const candidatas: ProtoAction[] = ["OPEN_HUMAN_REVIEW", "REQUEST_HUMAN_REVIEW", "REQUEST_MORE_INFORMATION"];
  const entrada = candidatas.find((a) => lead.availableActions.includes(a)) ?? null;
  const defEntrada = entrada ? protoFindAction(entrada) : null;

  return `
    <section class="ws-section" aria-labelledby="qual-review-title">
      <h2 class="ws-section__title" id="qual-review-title">Revisión humana requerida</h2>
      <p>${String(enRevision.length)} criterio(s) en <strong>revisión</strong>: ${protoEsc(enRevision.map((c) => `${c.id} ${c.name}`).join(", "))}.</p>
      <p class="ws-muted ws-small">Revisión no es lo mismo que no cumple: la regla no puede resolverlo sola y hace falta criterio humano.</p>
      <div class="ws-actions">
        ${entrada && defEntrada
          ? `<button type="button" class="c-btn c-btn--primary" data-qual-command="${protoEsc(entrada)}">${protoEsc(defEntrada.label)}</button>`
          : `<p class="ws-muted ws-small">Ninguna acción de entrada a revisión está disponible para este lead.</p>`}
      </div>
      <p class="ws-muted ws-small">Aquí termina el alcance de PM-UX14-04: la resolución completa de la revisión se construye en PM-UX14-05.</p>
    </section>`;
}

/* ===========================================================================
 * QUAL-02 — Detalle de criterio
 * ========================================================================= */

function protoRenderQual02(host: HTMLElement, lead: ProtoCanonicalLead, criterionId: string): void {
  const qual = protoGetQualification(lead.leadId);
  const criterio = qual?.criteria.find((c) => c.id === criterionId) ?? null;
  const definicion = protoFindCriterion(criterionId);

  if (!qual || !criterio || !definicion) {
    location.replace(protoRouteHref("system", { state: "not-found" }));
    return;
  }

  host.innerHTML = `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-qualification", { leadId: lead.leadId })}">← Volver al resumen de calificación</a></p>
    <p class="ws-code">QUAL-02</p>
    <h1 class="ws-page__title">${protoEsc(criterio.id)} · ${protoEsc(criterio.name)}</h1>
    <p class="ws-page__lead">${protoEsc(lead.company.companyName)} · ${protoEsc(lead.leadReference)}</p>
    ${protoRenderMockNotice()}

    <dl class="ws-context">
      <div><dt>Resultado</dt><dd>
        <span class="ws-crit ws-crit--${criterio.status.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[criterio.status])}</span>
        <br><span class="ws-muted ws-small">${protoEsc(PROTO_CRITERION_STATUS_MEANING[criterio.status])}</span>
      </dd></div>
      <div><dt>Pregunta de negocio</dt><dd>${protoEsc(definicion.businessQuestion)}</dd></div>
      <div><dt>Valor observado</dt><dd>${criterio.observedValue ? protoEsc(criterio.observedValue) : "<span class='ws-muted'>No registrado</span>"}</dd></div>
      <div><dt>Regla configurada</dt><dd>${criterio.configuredRule ? protoEsc(criterio.configuredRule) : "<span class='ws-muted'>Resumen no disponible</span>"}</dd></div>
      <div><dt>Evidencia</dt><dd>${criterio.evidence?.length ? criterio.evidence.map((e) => protoEsc(e)).join("<br>") : "<span class='ws-muted'>Sin evidencia adjunta</span>"}</dd></div>
      <div><dt>Trazabilidad</dt><dd>${criterio.traceability ? protoEsc(criterio.traceability) : "—"} · evaluación ${protoEsc(qual.assessmentId)} v${String(qual.assessmentVersion)}</dd></div>
    </dl>

    ${criterio.exception
      ? `<section class="ws-section" aria-labelledby="qual-exc-title">
           <h2 class="ws-section__title" id="qual-exc-title">Excepción aprobada</h2>
           <p class="c-alert c-alert--warning" role="note"><span class="c-alert-message">Una excepción no equivale a cumplir. Se conserva la evaluación original y su evidencia; la autorización se registra aparte.</span></p>
           <dl class="ws-context">
             <div><dt>Evaluación original</dt><dd><span class="ws-crit ws-crit--${criterio.exception.originalStatus.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[criterio.exception.originalStatus])}</span></dd></div>
             <div><dt>Aprobada por</dt><dd>${protoEsc(criterio.exception.approvedBy)}</dd></div>
             <div><dt>Fecha</dt><dd>${protoEsc(protoFormatFecha(criterio.exception.approvedAt))}</dd></div>
             <div><dt>Justificación</dt><dd>${protoEsc(criterio.exception.rationale)}</dd></div>
           </dl>
         </section>`
      : ""}

    <p class="ws-page__foot"><a href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">Volver al lead</a></p>`;

  document.title = `${criterio.id} ${criterio.name} — Workspace (prototipo)`;
}

/* ========================================================================= */

function protoRenderQualCabecera(lead: ProtoCanonicalLead, titulo: string, codigo: string): string {
  return `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">← Volver al lead ${protoEsc(lead.leadReference)}</a></p>
    <p class="ws-code">${protoEsc(codigo)}</p>
    <h1 class="ws-page__title">${protoEsc(titulo)}</h1>
    <p class="ws-page__lead">${protoEsc(lead.company.companyName)} · ${protoEsc(lead.leadReference)} · ${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])}</p>
    ${protoRenderMockNotice()}`;
}

function protoWireQual(lead: ProtoCanonicalLead): void {
  const feedback = document.querySelector<HTMLElement>("[data-qual-feedback]");
  document.querySelectorAll<HTMLButtonElement>("[data-qual-command]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const accion = btn.getAttribute("data-qual-command") as ProtoAction | null;
      if (!accion || !feedback) return;
      await protoRunCommand({
        key: `${accion}:${lead.leadId}`,
        action: accion,
        boton: btn,
        feedback,
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (!protoIsAuthenticated()) return;
  const host = document.querySelector<HTMLElement>("[data-qual-surface]");
  if (!host) return;

  const leadId = protoUrlParam("leadId") ?? "LEAD-00045";
  const lead = protoFindLead(leadId);
  if (!lead) {
    location.replace(protoRouteHref("system", { state: "not-found" }));
    return;
  }

  const criterion = protoUrlParam("criterion");
  if (criterion) protoRenderQual02(host, lead, criterion);
  else protoRenderQual01(host, lead);
});
