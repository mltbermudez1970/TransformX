"use strict";
/**
 * ASN-01 Assignment Exception · ASN-02 Assignment History.
 *
 * Separación innegociable: la **elegibilidad** es el resultado determinístico
 * de la política; la **sugerencia de IA** es un bloque aparte y asesor. Elena
 * Mora está recomendada por IA y es NO ELEGIBLE por política: la pantalla
 * enuncia ese conflicto en vez de esconderlo tras un veredicto único.
 *
 * Tener el permiso `assignment.override` autoriza la ACCIÓN de anular; no
 * convierte al candidato en elegible.
 *
 * Que no haya responsable elegible es un resultado de negocio, no un error.
 */
function protoRenderPolicyCriteria(c) {
    return `<ul class="ws-policy">${c.eligibility.criteria.map((k) => `
    <li class="ws-policy__item ws-policy__item--${k.result.toLowerCase()}">
      <span class="ws-policy__result">${protoEsc(PROTO_POLICY_RESULT_LABEL[k.result])}</span>
      <span class="ws-policy__name">${protoEsc(PROTO_POLICY_CHECK_LABEL[k.code])}</span>
      ${k.reason ? `<span class="ws-policy__reason">${protoEsc(k.reason)}</span>` : ""}
    </li>`).join("")}</ul>`;
}
function protoRenderCandidates(exc) {
    const recomendado = exc.aiSuggestion.recommendedCandidateId;
    return `
    <section class="ws-section" aria-labelledby="asn-cand-title">
      <h2 class="ws-section__title" id="asn-cand-title"><span class="ws-section__n" aria-hidden="true">4b</span>Candidatos y resultado de política</h2>
      <p class="ws-muted ws-small">Resultado determinístico de la política <code>${protoEsc(exc.autoAssignmentResult.policyVersion)}</code>. La sugerencia de IA se muestra por separado, más abajo: nunca se combina con este resultado.</p>

      <div class="ws-candidates">
        ${exc.candidates.map((c) => `
          <article class="ws-candidate ws-candidate--${c.eligibility.status.toLowerCase()}" data-candidate="${protoEsc(c.candidateId)}">
            <header class="ws-candidate__head">
              <div>
                <h3 class="ws-candidate__name">${protoEsc(c.displayName)}</h3>
                <p class="ws-muted ws-small">${protoEsc(PROTO_ROLE_LABEL[c.role])}</p>
              </div>
              <span class="ws-elig ws-elig--${c.eligibility.status.toLowerCase()}">${protoEsc(PROTO_ELIGIBILITY_LABEL[c.eligibility.status])}</span>
            </header>

            <p class="ws-candidate__summary">${protoEsc(c.eligibility.summary)}</p>

            ${c.candidateId === recomendado
        ? `<p class="ws-candidate__ai">Sugerido por IA${c.eligibility.status !== "ELIGIBLE"
            ? ` — <strong>pero la política lo marca como ${protoEsc(PROTO_ELIGIBILITY_LABEL[c.eligibility.status].toLowerCase())}</strong>. La sugerencia no cambia la elegibilidad.`
            : "."}</p>`
        : ""}

            ${protoRenderPolicyCriteria(c)}

            <dl class="ws-candidate__meta">
              <div><dt>Carga activa</dt><dd>${String(c.load.activeLeadCount)} leads · ${String(c.load.activeWorkItemCount)} work items</dd></div>
              <div><dt>Relación</dt><dd>${c.relationship.namedAccountOwner ? "Cuenta nominada" : c.relationship.existingRelationship ? "Relación existente" : "Sin relación previa"}</dd></div>
              <div><dt>Evaluado</dt><dd>${protoEsc(protoFormatFecha(c.eligibility.evaluatedAt))}</dd></div>
            </dl>
          </article>`).join("")}
      </div>
    </section>`;
}
function protoRenderAssignmentException(host, exc) {
    const ai = exc.aiSuggestion;
    const recomendado = protoFindCandidate(exc, ai.recommendedCandidateId);
    const user = protoGetSessionUser();
    const puedeAnular = user ? protoActorTienePermiso(user, "assignment.override") : false;
    protoRenderDecisionWorkspace(host, {
        code: "ASN-01",
        title: "Excepción de asignación",
        decisionQuestion: exc.decisionQuestion,
        reason: {
            code: exc.autoAssignmentResult.reasonCode,
            summary: `${exc.autoAssignmentResult.summary} No encontrar responsable elegible es un resultado de negocio, no una falla del sistema.`,
        },
        context: [
            { label: "Lead", value: `<a href="${protoRouteHref("lab-001-leads", { leadId: exc.leadId })}">${protoEsc(exc.leadReference)}</a>` },
            { label: "Empresa", value: protoEsc(exc.companyName) },
            { label: "Resultado de la asignación automática", value: protoEsc(exc.autoAssignmentResult.status) },
            { label: "WorkItem", value: protoEsc(exc.workItemId) },
            { label: "Tu autoridad", value: puedeAnular
                    ? "Incluye <code>assignment.override</code>. Autoriza la acción de anular; no vuelve elegible a ningún candidato."
                    : "No incluye <code>assignment.override</code>." },
        ],
        policy: {
            ruleId: "BDR-006-ASN",
            ruleSummary: "La asignación evalúa, en orden: cuenta nominada o relación existente, elegibilidad territorial, segmento de producto, disponibilidad, carga y compatibilidad de prioridad. La interfaz sólo muestra el resultado devuelto; no ejecuta esta precedencia.",
            policyVersion: exc.autoAssignmentResult.policyVersion,
        },
        extraHtml: protoRenderCandidates(exc),
        evidence: null,
        ai: {
            type: "AI_SUGGESTION",
            taskId: ai.taskRef,
            summary: `${ai.summary} Recomienda a ${recomendado ? recomendado.displayName : ai.recommendedCandidateId}${recomendado && recomendado.eligibility.status !== "ELIGIBLE"
                ? `, a quien la política marca como ${PROTO_ELIGIBILITY_LABEL[recomendado.eligibility.status].toLowerCase()}. Recomendación y elegibilidad son cosas distintas.`
                : "."}`,
            authority: ai.authority,
            confidence: ai.confidence,
            generatedAt: ai.generatedAt,
        },
        allowedResolutions: protoResolveAllowed(exc.allowedResolutions),
        availableActions: exc.availableActions,
        commandAction: "RESOLVE_ASSIGNMENT_EXCEPTION",
        commandKey: `ASN01:${exc.assignmentExceptionId}`,
        additionalOptions: exc.candidates.map((c) => ({
            id: c.candidateId,
            label: `${c.displayName} — ${PROTO_ELIGIBILITY_LABEL[c.eligibility.status]}`,
        })),
        onResolved: (r, rationale, extra) => {
            // El historial es inmutable: se AÑADE un registro, nunca se edita.
            const cand = extra ? protoFindCandidate(exc, extra) : null;
            const violados = cand
                ? cand.eligibility.criteria.filter((k) => k.result === "FAIL").map((k) => k.code)
                : [];
            const evento = r.code === "OVERRIDE_ASSIGNMENT_POLICY" ? "ASSIGNMENT_OVERRIDE_APPROVED"
                : r.code === "SEND_TO_SALES_OPS_QUEUE" ? "ROUTED_TO_SALES_OPS_QUEUE"
                    : r.code === "REQUEST_ASSIGNMENT_REEVALUATION" ? "ASSIGNMENT_REEVALUATION_REQUESTED"
                        : "OWNER_ASSIGNED";
            protoAppendAssignmentHistory({
                assignmentHistoryId: `AH-${String(Date.now()).slice(-4)}`,
                leadId: exc.leadId,
                eventType: evento,
                occurredAt: new Date().toISOString(),
                actor: { actorType: "HUMAN", userId: user?.userId, displayName: user?.displayName ?? "Actor", role: user ? protoPrimaryRoleOf(user) : undefined },
                fromOwner: null,
                toOwner: cand ? { userId: cand.candidateId, displayName: cand.displayName } : null,
                queue: r.code === "SEND_TO_SALES_OPS_QUEUE" ? "SALES_OPS" : null,
                reasonCode: r.code === "OVERRIDE_ASSIGNMENT_POLICY" ? "AUTHORIZED_POLICY_OVERRIDE" : r.code,
                rationale: rationale || null,
                policy: { policyVersion: exc.autoAssignmentResult.policyVersion, violatedCriteria: violados.length ? violados : undefined },
                source: "HUMAN_DECISION",
                workItemId: exc.workItemId,
                version: 1,
            });
            const nota = r.code === "OVERRIDE_ASSIGNMENT_POLICY" && cand
                ? `<p class="ws-muted ws-small">Se registró una excepción autorizada sobre ${protoEsc(cand.displayName)}. Los criterios incumplidos (${violados.map((v) => protoEsc(PROTO_POLICY_CHECK_LABEL[v])).join(", ")}) se conservan en el historial junto a tu justificación.</p>`
                : r.code === "SEND_TO_SALES_OPS_QUEUE"
                    ? `<p class="ws-muted ws-small">No se asignó dueño comercial. La responsabilidad pasa a la cola de Sales Operations.</p>`
                    : "";
            return `${nota}<p class="ws-actions"><a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-assignment", { leadId: exc.leadId, view: "history" })}">Ver historial de asignación (ASN-02)</a></p>`;
        },
    });
    document.title = `ASN-01 ${exc.assignmentExceptionId} — Workspace (prototipo)`;
}
/* ===========================================================================
 * ASN-02 — Assignment History (superficie de apoyo, inmutable)
 * ========================================================================= */
function protoRenderAssignmentHistory(host, leadId) {
    const registros = protoGetAssignmentHistory(leadId);
    const lead = protoFindLead(leadId);
    host.innerHTML = `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-assignment", { leadId })}">← Volver a la excepción de asignación</a></p>
    <p class="ws-code">ASN-02</p>
    <h1 class="ws-page__title">Historial de asignación</h1>
    <p class="ws-page__lead">${protoEsc(lead?.company.companyName ?? leadId)} · ${protoEsc(lead?.leadReference ?? leadId)}</p>
    ${protoRenderMockNotice()}

    <p class="ws-muted ws-small">Más recientes primero. El historial es <strong>inmutable</strong>: una corrección se registra como un evento posterior, nunca editando los anteriores. Las sugerencias de IA no son eventos de historial: aquí sólo se registran hechos y decisiones autoritativas.</p>

    ${registros.length === 0
        ? `<p class="ws-empty" role="status">Sin eventos de asignación para este lead.</p>`
        : `<ol class="ws-history">${registros.map(protoRenderHistoryRecord).join("")}</ol>`}`;
    document.title = `ASN-02 Historial ${leadId} — Workspace (prototipo)`;
}
function protoRenderHistoryRecord(h) {
    const fallo = h.eventType === "ASSIGNMENT_FAILED_NO_ELIGIBLE_OWNER";
    const override = h.eventType === "ASSIGNMENT_OVERRIDE_APPROVED";
    return `
    <li class="ws-history__item ws-history__item--${h.eventType.toLowerCase()}">
      <p class="ws-history__head">
        <span class="ws-chip">${protoEsc(PROTO_ASSIGNMENT_EVENT_LABEL[h.eventType])}</span>
        <span class="ws-muted ws-small">${protoEsc(protoFormatFecha(h.occurredAt))}</span>
      </p>
      <dl class="ws-history__meta">
        <div><dt>Origen</dt><dd>${protoEsc(h.actor.displayName)}${h.actor.role ? ` — ${protoEsc(PROTO_ROLE_LABEL[h.actor.role])}` : ""} · ${protoEsc(h.source)}</dd></div>
        ${h.fromOwner || h.toOwner ? `<div><dt>Responsable</dt><dd>${h.fromOwner ? `${protoEsc(h.fromOwner.displayName)} → ` : ""}${h.toOwner ? protoEsc(h.toOwner.displayName) : "<span class='ws-muted'>sin asignar</span>"}</dd></div>` : ""}
        ${h.queue ? `<div><dt>Cola</dt><dd>${protoEsc(h.queue)}</dd></div>` : ""}
        <div><dt>Motivo</dt><dd><code>${protoEsc(h.reasonCode)}</code>${fallo ? " — resultado de negocio, no error técnico" : ""}</dd></div>
        ${h.rationale ? `<div><dt>Justificación</dt><dd>${protoEsc(h.rationale)}</dd></div>` : ""}
        ${h.policy ? `<div><dt>Política</dt><dd><code>${protoEsc(h.policy.policyVersion)}</code>${h.policy.violatedCriteria?.length
        ? `<br>Criterios incumplidos: ${h.policy.violatedCriteria.map((v) => protoEsc(PROTO_POLICY_CHECK_LABEL[v])).join(", ")}`
        : ""}</dd></div>` : ""}
        ${override && h.evidenceRefs?.length ? `<div><dt>Evidencia</dt><dd>${h.evidenceRefs.map((e) => protoEsc(e)).join(", ")}</dd></div>` : ""}
      </dl>
    </li>`;
}
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
    if (!protoIsAuthenticated())
        return;
    const host = document.querySelector("[data-assignment-surface]");
    if (!host)
        return;
    const leadId = protoUrlParam("leadId") ?? "LEAD-00046";
    if (protoUrlParam("view") === "history") {
        protoRenderAssignmentHistory(host, leadId);
        return;
    }
    const exc = protoFindAssignmentException(leadId);
    if (!exc) {
        location.replace(protoRouteHref("system", { state: "not-found" }));
        return;
    }
    protoRenderAssignmentException(host, exc);
});
