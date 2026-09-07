"use strict";
/**
 * OPP-01 Opportunity Readiness · OPP-02 Convert Confirmation · OPP-03 Handoff.
 *
 * Fronteras que estas superficies hacen visibles:
 *  - Calificado ≠ listo. El estado global lo declara el fixture; la interfaz
 *    puede contar condiciones para presentar, pero no deriva el veredicto.
 *  - `CONVERT_TO_OPPORTUNITY` sólo aparece si `availableActions` lo expone.
 *    Un readiness READY por sí solo no basta.
 *  - La conversión revalida antes de crear. Un conflicto de negocio se
 *    presenta en línea (SYS-06), conservando el contexto, y NO como error.
 *  - El handoff muestra el snapshot congelado, no la evaluación viva.
 */
function protoOppLeadId() {
    return protoUrlParam("leadId") ?? "LEAD-00048";
}
/* ===========================================================================
 * OPP-01 — Opportunity Readiness
 * ========================================================================= */
function protoRenderReadinessCondition(c) {
    const relacionada = c.relatedOpportunityRef ? protoFindOpenOpportunity(c.relatedOpportunityRef) : null;
    return `
    <li class="ws-rc ws-rc--${c.status.toLowerCase()}" data-condition="${protoEsc(c.conditionId)}">
      <div class="ws-rc__head">
        <span class="ws-rc__id">${protoEsc(c.conditionId)}</span>
        <span class="ws-rc__status">${protoEsc(PROTO_READINESS_STATUS_LABEL[c.status])}</span>
        <h3 class="ws-rc__name">${protoEsc(c.name)}</h3>
      </div>
      <p class="ws-rc__question">${protoEsc(c.question)}</p>
      <p class="ws-rc__summary">${protoEsc(c.summary)}</p>
      <p class="ws-muted ws-small">${protoEsc(PROTO_READINESS_STATUS_MEANING[c.status])}</p>
      ${c.evidence.length ? `<p class="ws-muted ws-small">Evidencia: ${c.evidence.map((e) => `${protoEsc(e.label)} = ${protoEsc(e.value)} (${protoEsc(e.ref)})`).join(" · ")}</p>` : ""}
      ${relacionada ? `<p class="ws-rc__related">Oportunidad existente: <strong>${protoEsc(relacionada.opportunityReference)}</strong> · ${protoEsc(relacionada.status)} · responsable ${protoEsc(relacionada.owner.displayName)}</p>` : ""}
      ${c.route ? `<p class="ws-actions"><a class="c-btn c-btn--secondary" href="${protoEsc(protoRouteHref(c.route.routeId, { leadId: c.conditionId === "RC-08" ? "" : protoOppLeadId(), ...(c.route.params ?? {}) }))}">${protoEsc(c.route.label)}</a></p>` : ""}
    </li>`;
}
function protoRenderOpp01(host, lead) {
    const r = protoGetReadiness(lead.leadId);
    if (!r) {
        host.innerHTML = `
      <p class="ws-back"><a href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">← Volver al lead</a></p>
      <p class="ws-code">OPP-01</p>
      <h1 class="ws-page__title">Opportunity Readiness</h1>
      <p class="ws-empty" role="status">No hay evaluación de readiness para este lead.</p>`;
        return;
    }
    const counts = protoReadinessCounts(r);
    const bloqueadores = r.conditions.filter((c) => r.blockingConditionIds.includes(c.conditionId));
    // La acción se toma del lead: READY por sí solo no autoriza.
    const puedeConvertir = lead.availableActions.includes("CONVERT_TO_OPPORTUNITY");
    const yaConvertido = lead.lifecycleState === "CONVERTED" || protoFindCreatedOpportunity(lead.leadId) !== null;
    host.innerHTML = `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">← Volver al lead ${protoEsc(lead.leadReference)}</a></p>
    <p class="ws-code">OPP-01</p>
    <h1 class="ws-page__title">Opportunity Readiness</h1>
    <p class="ws-page__lead">${protoEsc(lead.company.companyName)} · ${protoEsc(lead.leadReference)} · ${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])}</p>
    ${protoRenderMockNotice()}

    <section class="ws-section" aria-labelledby="opp-overall-title">
      <h2 class="ws-section__title" id="opp-overall-title">Estado de preparación</h2>
      <p class="ws-readiness-overall">
        <span class="ws-ready ws-ready--${r.status.toLowerCase()}">${protoEsc(PROTO_OVERALL_READINESS_LABEL[r.status])}</span>
        <span class="ws-muted">${String(counts.satisfechas)}/${String(counts.total)} condiciones satisfechas · política <code>${protoEsc(r.policyVersion)}</code></span>
      </p>

      <div class="c-alert c-alert--info" role="note">
        <p class="c-alert-message"><strong>Calificado no es lo mismo que listo.</strong> Este lead está ${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState].toLowerCase())}; la preparación para convertir se evalúa aparte y la determina la BizCap. La interfaz no la recalcula.</p>
      </div>

      ${bloqueadores.length
        ? `<div class="c-alert c-alert--warning" role="status">
             <p class="c-alert-message"><strong>${String(bloqueadores.length)} condición(es) impiden convertir:</strong> ${bloqueadores.map((b) => protoEsc(`${b.conditionId} ${b.name}`)).join(" · ")}. Cada una enlaza abajo con la superficie que la resuelve.</p>
           </div>`
        : ""}
    </section>

    <section class="ws-section" aria-labelledby="opp-cond-title">
      <h2 class="ws-section__title" id="opp-cond-title">Condiciones RC-01 … RC-08</h2>
      <ul class="ws-rclist">${r.conditions.map(protoRenderReadinessCondition).join("")}</ul>
    </section>

    <section class="ws-section" aria-labelledby="opp-act-title">
      <h2 class="ws-section__title" id="opp-act-title">Conversión</h2>
      ${yaConvertido
        ? `<p class="c-alert c-alert--success" role="status"><span class="c-alert-message">Este lead ya se convirtió. No puede volver a convertirse.</span></p>
           <p class="ws-actions"><a class="c-btn c-btn--primary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId, view: "handoff" })}">Ver el handoff</a></p>`
        : puedeConvertir
            ? `<p class="ws-actions"><a class="c-btn c-btn--primary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId, view: "convert" })}">Convertir a oportunidad</a></p>
             <p class="ws-muted ws-small">La acción está disponible porque la BizCap la expone en <code>availableActions</code>, no porque la pantalla lo deduzca del estado.</p>`
            : `<p class="ws-muted">La conversión no está disponible: la BizCap no expone <code>CONVERT_TO_OPPORTUNITY</code> para este lead.</p>`}
    </section>`;
    document.title = `OPP-01 Readiness ${lead.leadReference} — Workspace (prototipo)`;
}
/* ===========================================================================
 * OPP-02 — Convert Confirmation
 * ========================================================================= */
function protoRenderOpp02(host, lead) {
    const r = protoGetReadiness(lead.leadId);
    const ops = protoGetLeadOperations(lead.leadId);
    const qual = protoGetQualification(lead.leadId);
    const n = lead.commercialNeed;
    if (!r || !lead.availableActions.includes("CONVERT_TO_OPPORTUNITY")) {
        location.replace(protoRouteHref("lab-001-opportunity", { leadId: lead.leadId }));
        return;
    }
    host.innerHTML = `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId })}">← Volver a readiness</a></p>
    <p class="ws-code">OPP-02</p>
    <h1 class="ws-page__title">Confirmar conversión a oportunidad</h1>
    <p class="ws-page__lead">Revisa el contexto. No hace falta volver a introducir nada de lo que ya se conoce.</p>
    ${protoRenderMockNotice()}

    <div class="ws-feedback" data-conv-feedback role="status" aria-live="polite"></div>
    <div data-conv-conflict></div>

    <section class="ws-section" aria-labelledby="conv-ctx-title">
      <h2 class="ws-section__title" id="conv-ctx-title">Contexto de la conversión</h2>
      <dl class="ws-context">
        <div><dt>Lead</dt><dd>${protoEsc(lead.leadReference)} · ${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])}</dd></div>
        <div><dt>Empresa</dt><dd>${protoEsc(lead.company.companyName)}</dd></div>
        <div><dt>Necesidad comercial</dt><dd>${protoEsc(String(n.productOffering.value ?? "—"))} · ${protoEsc(String(n.quantity.value ?? "—"))} ${protoEsc(String(n.unit.value ?? ""))} · ${protoEsc(String(n.geographyDestination.value ?? "—"))} <span class="ws-muted">(versión ${String(n.version)})</span></dd></div>
        <div><dt>Responsable comercial</dt><dd>${ops?.commercialOwner ? protoEsc(ops.commercialOwner.displayName) : "Sin asignar"}</dd></div>
        <div><dt>Calificación</dt><dd>${qual ? `${protoEsc(PROTO_CRITERION_STATUS_LABEL[qual.overallStatus])} · ${protoEsc(qual.assessmentId)} v${String(qual.assessmentVersion)}` : "—"}</dd></div>
        <div><dt>Prioridad</dt><dd>${ops ? protoRenderPriorityBadge(ops.priority.code) : "—"}</dd></div>
        <div><dt>Próximo paso</dt><dd>${ops ? protoEsc(ops.nextBestAction.label) : "—"}</dd></div>
        <div><dt>Readiness</dt><dd><span class="ws-ready ws-ready--${r.status.toLowerCase()}">${protoEsc(PROTO_OVERALL_READINESS_LABEL[r.status])}</span> · ${String(protoReadinessCounts(r).satisfechas)}/${String(protoReadinessCounts(r).total)} condiciones</dd></div>
      </dl>
    </section>

    <section class="ws-section" aria-labelledby="conv-conf-title">
      <h2 class="ws-section__title" id="conv-conf-title">Consecuencia</h2>
      <p>Al confirmar se creará una <strong>oportunidad calificada</strong> a partir de este lead y el lead pasará a presentarse como <strong>convertido</strong>. Un lead convertido sigue consultable y <strong>no puede volver a convertirse</strong>.</p>
      <p class="ws-muted ws-small">Antes de crear nada, la BizCap revalida versión, readiness, oportunidad abierta para la misma necesidad, responsable y trabajo bloqueante. El envío es único: repetirlo no crea una segunda oportunidad.</p>

      <div class="ws-actions">
        <button type="button" class="c-btn c-btn--primary" data-conv-submit>Convertir a oportunidad</button>
        <a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId })}">Cancelar</a>
      </div>
    </section>`;
    protoWireConversion(lead);
    document.title = `OPP-02 Convertir ${lead.leadReference} — Workspace (prototipo)`;
}
function protoWireConversion(lead) {
    const btn = document.querySelector("[data-conv-submit]");
    const feedback = document.querySelector("[data-conv-feedback]");
    const conflictHost = document.querySelector("[data-conv-conflict]");
    if (!btn || !feedback || !conflictHost)
        return;
    btn.addEventListener("click", async () => {
        // Envío único.
        btn.disabled = true;
        btn.classList.add("c-btn--loading");
        btn.setAttribute("aria-busy", "true");
        protoClearFeedback(feedback);
        conflictHost.innerHTML = "";
        const out = await protoRevalidateAndConvert(lead);
        btn.classList.remove("c-btn--loading");
        btn.setAttribute("aria-busy", "false");
        switch (out.result) {
            case "SUCCESS":
            case "IDEMPOTENT_SUCCESS":
                // `converted` marca que se llega desde la operación, no desde un
                // enlace: sólo en ese caso OPP-03 mueve el foco al resultado.
                location.assign(protoRouteHref("lab-001-opportunity", { leadId: lead.leadId, view: "handoff", converted: "1" }));
                return;
            case "BUSINESS_CONFLICT":
            case "CONCURRENCY_CONFLICT":
                // SYS-06 en línea: conserva el contexto y no se presenta como error.
                conflictHost.innerHTML = protoRenderSys06(out, lead);
                btn.disabled = true;
                conflictHost.querySelector("h2")?.setAttribute("tabindex", "-1");
                conflictHost.querySelector("h2")?.focus();
                return;
            case "RECOVERABLE_ERROR":
                btn.disabled = false;
                protoRenderFeedback(feedback, {
                    severidad: "error",
                    mensaje: out.message,
                    detalle: `Problema temporal; nada se creó y no se perdió tu contexto. Puedes reintentar. Referencia ${out.referenceId ?? "—"}.`,
                });
                return;
            case "CRITICAL_ERROR":
                location.assign(protoRouteHref("system", { state: "critical-error", ref: out.referenceId ?? "ERR-UX14-0006", leadId: lead.leadId }));
                return;
            default:
                btn.disabled = false;
        }
    });
}
/** SYS-06 Business Conflict — estado en línea, contextual, no una página. */
function protoRenderSys06(out, lead) {
    const esConcurrencia = out.result === "CONCURRENCY_CONFLICT";
    const nuevoReadiness = out.readiness;
    return `
    <section class="ws-section ws-sys06" aria-labelledby="sys06-title" data-sys06>
      <p class="ws-code">SYS-06 · ${protoEsc(out.conflictCode ?? "BUSINESS_CONFLICT")}</p>
      <h2 class="ws-section__title" id="sys06-title">${esConcurrencia ? "Otro usuario cambió este lead" : "La situación del lead cambió"}</h2>

      <div class="c-alert c-alert--warning" role="alert">
        <p class="c-alert-message">${protoEsc(out.message)}</p>
      </div>

      <p><strong>No es una falla del sistema.</strong> Es una condición de negocio que cambió: no se creó ninguna oportunidad y no se perdió nada de tu contexto.</p>

      ${out.changedBy ? `<p class="ws-muted ws-small">Cambiado por ${protoEsc(out.changedBy.displayName)} — ${protoEsc(PROTO_ROLE_LABEL[out.changedBy.role])}${out.changedAt ? ` · ${protoEsc(protoFormatFecha(out.changedAt))}` : ""}.</p>` : ""}
      ${out.latestLeadVersion ? `<p class="ws-muted ws-small">Versión vigente del lead: ${String(out.latestLeadVersion)}.</p>` : ""}

      ${out.existingOpportunity
        ? `<p class="ws-rc__related">Oportunidad existente: <strong>${protoEsc(out.existingOpportunity.opportunityReference)}</strong> · ${protoEsc(out.existingOpportunity.status)}</p>`
        : ""}

      ${nuevoReadiness
        ? `<h3>Preparación refrescada</h3>
           <p class="ws-readiness-overall">
             <span class="ws-ready ws-ready--${nuevoReadiness.status.toLowerCase()}">${protoEsc(PROTO_OVERALL_READINESS_LABEL[nuevoReadiness.status])}</span>
             <span class="ws-muted">Bloquean: ${nuevoReadiness.blockingConditionIds.map((b) => protoEsc(b)).join(", ")}</span>
           </p>
           <ul class="ws-rclist">${nuevoReadiness.conditions.filter((c) => nuevoReadiness.blockingConditionIds.includes(c.conditionId)).map(protoRenderReadinessCondition).join("")}</ul>`
        : ""}

      ${out.availableActions
        ? `<p class="ws-muted ws-small">Acciones disponibles tras el refresco: ${out.availableActions.map((a) => protoEsc(protoActionLabel(a))).join(" · ")}.${out.availableActions.includes("CONVERT_TO_OPPORTUNITY") ? "" : " <strong>Convertir ya no está entre ellas.</strong>"}</p>`
        : ""}

      <div class="ws-actions">
        <a class="c-btn c-btn--primary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId })}">Ver la preparación vigente</a>
        ${esConcurrencia && out.existingOpportunity
        ? `<a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId, view: "handoff", opportunityId: out.existingOpportunity.opportunityReference })}">Ver la oportunidad existente</a>`
        : ""}
        <a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">Volver al lead</a>
      </div>
    </section>`;
}
/* ===========================================================================
 * OPP-03 — Conversion / Handoff Result
 * ========================================================================= */
function protoRenderOpp03(host, lead) {
    let opp = protoFindCreatedOpportunity(lead.leadId);
    // Handoff de una conversión concurrente: se reconstruye desde el fixture.
    const refExterna = protoUrlParam("opportunityId");
    if (!opp && refExterna) {
        const r = protoGetReadiness(lead.leadId);
        if (r)
            opp = protoCreateOpportunity(lead, r);
    }
    if (!opp) {
        host.innerHTML = `
      <p class="ws-back"><a href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId })}">← Volver a readiness</a></p>
      <p class="ws-code">OPP-03</p>
      <h1 class="ws-page__title">Handoff</h1>
      <p class="ws-empty" role="status">Este lead todavía no se ha convertido.</p>`;
        return;
    }
    const s = opp.readinessSnapshot;
    host.innerHTML = `
    <p class="ws-code">OPP-03</p>
    <h1 class="ws-page__title" tabindex="-1">Tu solicitud avanzó al siguiente paso comercial.</h1>
    ${protoRenderMockNotice()}

    <div class="c-alert c-alert--success" role="status">
      <p class="c-alert-message">Se creó la oportunidad <strong>${protoEsc(opp.opportunityReference)}</strong> a partir del lead ${protoEsc(opp.sourceLead.leadReference)}.</p>
    </div>

    <section class="ws-section" aria-labelledby="hand-opp-title">
      <h2 class="ws-section__title" id="hand-opp-title">Oportunidad creada</h2>
      <dl class="ws-context">
        <div><dt>Referencia</dt><dd><strong>${protoEsc(opp.opportunityReference)}</strong></dd></div>
        <div><dt>Estado</dt><dd>${protoEsc(opp.status)}</dd></div>
        <div><dt>Responsable comercial</dt><dd>${protoEsc(opp.owner.displayName)}</dd></div>
        <div><dt>Creada</dt><dd>${protoEsc(protoFormatFecha(opp.createdAt))}</dd></div>
        <div><dt>Lead de origen</dt><dd><a href="${protoRouteHref("lab-001-leads", { leadId: opp.sourceLead.leadId })}">${protoEsc(opp.sourceLead.leadReference)}</a></dd></div>
        <div><dt>Empresa</dt><dd>${protoEsc(opp.company.companyName)}</dd></div>
        <div><dt>Necesidad comercial</dt><dd>${protoEsc(opp.commercialNeed.commercialNeedId)} · versión ${String(opp.commercialNeed.commercialNeedVersion)}</dd></div>
      </dl>
      <p class="ws-muted ws-small">LAB-001 no modela etapas posteriores, valor ni probabilidad: la oportunidad se crea abierta y el ciclo comercial continúa fuera de esta BizCap.</p>
    </section>

    <section class="ws-section" aria-labelledby="hand-snap-title">
      <h2 class="ws-section__title" id="hand-snap-title">Preparación en el momento de convertir</h2>
      <p class="ws-muted ws-small">Snapshot <code>${protoEsc(s.snapshotId)}</code> congelado el ${protoEsc(protoFormatFecha(s.capturedAt))}. Es <strong>evidencia inmutable</strong>: aunque la configuración o el lead cambien después, esto seguirá mostrando lo que se evaluó entonces.</p>
      <dl class="ws-context">
        <div><dt>Resultado</dt><dd><span class="ws-ready ws-ready--${s.overallStatus.toLowerCase()}">${protoEsc(PROTO_OVERALL_READINESS_LABEL[s.overallStatus])}</span></dd></div>
        <div><dt>Política / configuración</dt><dd><code>${protoEsc(s.policyVersion)}</code> · <code>${protoEsc(s.configurationVersion)}</code></dd></div>
        <div><dt>Instancia</dt><dd>${protoEsc(s.bizCapDefinitionId)} · ${protoEsc(s.bizCapInstanceId)}</dd></div>
        <div><dt>Versiones</dt><dd>Lead v${String(s.leadVersion)} · Necesidad v${String(s.commercialNeedVersion)}</dd></div>
      </dl>
      <div class="workspace-table-wrapper">
        <table class="workspace-table">
          <caption class="sr-only">Condiciones de readiness congeladas al convertir</caption>
          <thead><tr><th scope="col">ID</th><th scope="col">Condición</th><th scope="col">Estado</th><th scope="col">Resumen</th></tr></thead>
          <tbody>${s.conditions.map((c) => `
            <tr>
              <th scope="row">${protoEsc(c.conditionId)}</th>
              <td>${protoEsc(c.name)}</td>
              <td><span class="ws-rc__status ws-rc__status--${c.status.toLowerCase()}">${protoEsc(PROTO_READINESS_STATUS_LABEL[c.status])}</span></td>
              <td class="ws-small">${protoEsc(c.summary)}</td>
            </tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="ws-muted ws-small">Se conserva el conjunto completo evaluado, incluidas las satisfechas y las no aplicables.</p>
    </section>

    <section class="ws-section" aria-labelledby="hand-next-title">
      <h2 class="ws-section__title" id="hand-next-title">Siguiente paso comercial</h2>
      <p><strong>${protoEsc(opp.nextCommercialStep.label)}</strong> — ${protoEsc(opp.nextCommercialStep.targetCapability)} ${protoEsc(opp.nextCommercialStep.targetCapabilityName)}</p>
      <p class="ws-muted ws-small">Marcador de handoff (<code>${protoEsc(opp.nextCommercialStep.status)}</code>). LAB-002 Quote &amp; Proposal Management queda <strong>fuera del alcance operativo de LAB-001</strong>: aquí no se ejecuta ni se enlaza su flujo.</p>
    </section>

    <div class="ws-actions">
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">Ver el lead convertido</a>
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-opportunity", { leadId: lead.leadId })}">Ver la preparación</a>
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("my-work")}">Volver a My Work</a>
    </div>
    <p class="ws-muted ws-small">No hay acción para reconvertir: un lead convertido no puede volver a convertirse.</p>`;
    document.title = `OPP-03 Handoff ${opp.opportunityReference} — Workspace (prototipo)`;
    // Al llegar por la conversión, el navegador deja el foco en el `body` y el
    // desenlace de una operación material se queda sin anunciar. Se lleva el
    // foco al encabezado del resultado, que enuncia lo que pasó.
    if (protoUrlParam("converted") === "1") {
        host.querySelector("h1")?.focus();
    }
}
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
    if (!protoIsAuthenticated())
        return;
    const host = document.querySelector("[data-opportunity-surface]");
    if (!host)
        return;
    const lead = protoFindLead(protoOppLeadId());
    if (!lead) {
        location.replace(protoRouteHref("system", { state: "not-found" }));
        return;
    }
    const view = protoUrlParam("view");
    if (view === "convert")
        protoRenderOpp02(host, lead);
    else if (view === "handoff")
        protoRenderOpp03(host, lead);
    else
        protoRenderOpp01(host, lead);
});
