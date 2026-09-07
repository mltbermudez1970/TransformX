/**
 * REV-02 Human Review · REV-03 Duplicate Review · REV-04 Exception Review.
 *
 * REV-04 reutiliza REV-02: una revisión de excepción es una revisión humana
 * gobernada con el mismo contrato de decisión. No se duplica la superficie.
 *
 * Sin `?reviewId` se muestra la bandeja de revisiones abiertas.
 */

function protoReviewsIndex(host: HTMLElement): void {
  const humanas = PROTO_HUMAN_REVIEWS;
  const duplicados = PROTO_DUPLICATE_REVIEWS;

  host.innerHTML = `
    <h1 class="ws-page__title">Reviews</h1>
    <p class="ws-page__lead">Decisiones humanas gobernadas de LAB-001. Cada revisión empieza por su pregunta de decisión.</p>
    ${protoRenderMockNotice()}

    <h2 id="rev-open-title">Revisiones abiertas</h2>
    <div class="workspace-table-wrapper">
      <table class="workspace-table">
        <caption class="sr-only">Revisiones abiertas</caption>
        <thead><tr>
          <th scope="col">ID</th><th scope="col">Tipo</th><th scope="col">Pregunta de decisión</th>
          <th scope="col">Lead</th><th scope="col">Estado</th><th scope="col">Abrir</th>
        </tr></thead>
        <tbody>
          ${humanas.map((r) => `
            <tr>
              <th scope="row">${protoEsc(r.reviewId)}</th>
              <td>REV-02 ${protoEsc(PROTO_WORK_ITEM_TYPE_LABEL.HUMAN_REVIEW)}</td>
              <td>${protoEsc(r.decisionQuestion)}</td>
              <td>${protoEsc(r.context.leadReference)}</td>
              <td>${protoEsc(PROTO_WORK_ITEM_STATUS_LABEL[r.status])}</td>
              <td><a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-reviews", { reviewId: r.reviewId })}">Abrir</a></td>
            </tr>`).join("")}
          ${duplicados.map((r) => `
            <tr>
              <th scope="row">${protoEsc(r.reviewId)}</th>
              <td>REV-03 ${protoEsc(PROTO_WORK_ITEM_TYPE_LABEL.DUPLICATE_REVIEW)}</td>
              <td>${protoEsc(r.decisionQuestion)}</td>
              <td>${protoEsc(r.currentLeadId)}</td>
              <td>Abierta</td>
              <td><a class="c-btn c-btn--secondary" href="${protoRouteHref("lab-001-reviews", { reviewId: r.reviewId })}">Abrir</a></td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <p class="ws-page__foot"><a href="${protoRouteHref("lab-001-assignment")}">Ir a excepciones de asignación</a></p>`;
}

/* ===========================================================================
 * REV-02 / REV-04 — Human Review y Exception Review
 * ========================================================================= */

function protoRenderHumanReview(host: HTMLElement, review: ProtoHumanReview): void {
  const esExcepcion = review.reviewType === "EXCEPTION_REVIEW";
  const codigo = esExcepcion ? "REV-04" : "REV-02";
  const qual = protoGetQualification(review.context.leadId);
  const criterio = review.context.criterionId
    ? qual?.criteria.find((c) => c.id === review.context.criterionId)
    : undefined;

  protoRenderDecisionWorkspace(host, {
    code: codigo,
    title: esExcepcion ? "Revisión de excepción" : "Revisión humana",
    decisionQuestion: review.decisionQuestion,
    reason: review.reason,
    context: [
      { label: "Lead", value: `<a href="${protoRouteHref("lab-001-leads", { leadId: review.context.leadId })}">${protoEsc(review.context.leadReference)}</a>` },
      { label: "Empresa", value: protoEsc(review.context.companyName) },
      ...(criterio
        ? [{ label: "Criterio en revisión", value: `${protoEsc(criterio.id)} ${protoEsc(criterio.name)} — <span class="ws-crit ws-crit--${criterio.status.toLowerCase()}">${protoEsc(PROTO_CRITERION_STATUS_LABEL[criterio.status])}</span>` }]
        : []),
      { label: "WorkItem", value: protoEsc(review.workItemId) },
      { label: "Versión de la revisión", value: String(review.version) },
    ],
    policy: review.policy,
    evidence: review.evidence,
    ai: review.aiAssistance,
    allowedResolutions: protoResolveAllowed(review.allowedResolutions),
    availableActions: review.availableActions,
    commandAction: "RESOLVE_HUMAN_REVIEW",
    commandKey: `REV02:${review.reviewId}`,
    onResolved: (r) => `
      <p class="ws-muted ws-small">Se conserva la evaluación original del criterio ${
        criterio ? `${protoEsc(criterio.id)} (<strong>${protoEsc(PROTO_CRITERION_STATUS_LABEL[criterio.status])}</strong>)` : ""
      } y su evidencia. La resolución <strong>${protoEsc(r.label)}</strong> se registra como decisión humana separada.</p>`,
  });

  document.title = `${codigo} ${review.reviewId} — Workspace (prototipo)`;
}

/* ===========================================================================
 * REV-03 — Duplicate Review
 * ========================================================================= */

function protoRenderDuplicateComparison(review: ProtoDuplicateReview): string {
  const cur = protoFindLead(review.currentLeadId);
  const cand = protoFindLead(review.candidateLeadId);

  const filas = review.comparison.map((c) => `
    <tr class="ws-dup__row ws-dup__row--${c.similarity.classification.toLowerCase()}">
      <th scope="row">${protoEsc(c.label)}${c.contextOnly ? ' <span class="ws-dup__ctx">sólo contexto</span>' : ""}</th>
      <td>${c.current.value === null ? "<span class='ws-muted'>—</span>" : protoEsc(c.current.value)}</td>
      <td>${c.candidate.value === null ? "<span class='ws-muted'>—</span>" : protoEsc(c.candidate.value)}</td>
      <td><span class="ws-sim ws-sim--${c.similarity.classification.toLowerCase()}">${protoEsc(PROTO_SIMILARITY_LABEL[c.similarity.classification])}</span>${
        c.similarity.score !== null ? `<br><span class="ws-muted ws-small">IA ${String(Math.round(c.similarity.score * 100))}%</span>` : ""
      }</td>
    </tr>`).join("");

  const tarjetas = review.comparison.map((c) => `
    <article class="ws-dup__card">
      <h4>${protoEsc(c.label)}${c.contextOnly ? ' <span class="ws-dup__ctx">sólo contexto</span>' : ""}</h4>
      <dl>
        <div><dt>Actual</dt><dd>${c.current.value === null ? "—" : protoEsc(c.current.value)}</dd></div>
        <div><dt>Candidato</dt><dd>${c.candidate.value === null ? "—" : protoEsc(c.candidate.value)}</dd></div>
        <div><dt>Similitud (IA)</dt><dd><span class="ws-sim ws-sim--${c.similarity.classification.toLowerCase()}">${protoEsc(PROTO_SIMILARITY_LABEL[c.similarity.classification])}</span></dd></div>
      </dl>
    </article>`).join("");

  return `
    <section class="ws-section" aria-labelledby="dup-cmp-title">
      <h2 class="ws-section__title" id="dup-cmp-title"><span class="ws-section__n" aria-hidden="true">4b</span>Comparación de registros</h2>
      <p class="ws-muted ws-small">Coincidir en empresa o contacto <strong>no prueba</strong> un duplicado. La pregunta es si ambos responden a la misma necesidad comercial.</p>

      <div class="workspace-table-wrapper ws-dup__table-wrap">
        <table class="workspace-table ws-dup__table">
          <caption class="sr-only">Comparación campo a campo entre el lead actual y el candidato</caption>
          <thead><tr>
            <th scope="col">Campo</th>
            <th scope="col">Actual · ${protoEsc(cur?.leadReference ?? review.currentLeadId)}</th>
            <th scope="col">Candidato · ${protoEsc(cand?.leadReference ?? review.candidateLeadId)}</th>
            <th scope="col">Similitud (asesora)</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>

      <div class="ws-dup__cards" aria-hidden="true">${tarjetas}</div>
    </section>`;
}

function protoRenderDuplicateReview(host: HTMLElement, review: ProtoDuplicateReview): void {
  const p = review.candidateProposal;

  protoRenderDecisionWorkspace(host, {
    code: "REV-03",
    title: "Revisión de duplicado",
    decisionQuestion: review.decisionQuestion,
    reason: {
      code: "POSSIBLE_DUPLICATE_REQUIRES_HUMAN_REVIEW",
      summary: "Un proceso de similitud propuso un candidato. La propuesta es evidencia asesora: la decisión sobre si es la misma necesidad comercial es humana.",
    },
    context: [
      { label: "Lead actual", value: `<a href="${protoRouteHref("lab-001-leads", { leadId: review.currentLeadId })}">${protoEsc(review.currentLeadId)}</a>` },
      { label: "Candidato", value: `<a href="${protoRouteHref("lab-001-leads", { leadId: review.candidateLeadId })}">${protoEsc(review.candidateLeadId)}</a>` },
      { label: "Tipo de candidato", value: protoEsc(review.candidateType === "LEAD" ? "Lead" : "Oportunidad abierta") },
      { label: "WorkItem", value: protoEsc(review.workItemId) },
    ],
    policy: {
      ruleId: "BDR-004-DUP",
      ruleSummary: "Dos registros son duplicados sólo si representan la misma necesidad comercial subyacente. Coincidir en empresa, contacto o correo no basta. Si existe una oportunidad abierta para la misma necesidad, corresponde asociar, no cerrar como duplicado.",
      policyVersion: "duplicate-policy-v2",
    },
    extraHtml: protoRenderDuplicateComparison(review),
    evidence: null,
    ai: { type: p.type, taskId: p.taskId, summary: `${p.summary} Recomendación: ${p.recommendation} · similitud global ${String(Math.round(p.similarityScore * 100))}%.`, authority: p.authority, confidence: p.confidence, generatedAt: p.generatedAt },
    allowedResolutions: protoResolveAllowed(review.allowedResolutions),
    availableActions: review.availableActions,
    commandAction: "RESOLVE_DUPLICATE_REVIEW",
    commandKey: `REV03:${review.reviewId}`,
    onResolved: (r) => {
      if (r.code === "CONFIRM_DUPLICATE") {
        return `<p class="ws-muted ws-small">La resolución del duplicado la ejecuta la BizCap. No hubo fusión en el cliente y la procedencia de ambos registros se conserva.</p>`;
      }
      if (r.code === "NOT_A_DUPLICATE") {
        return `<p class="ws-muted ws-small">Ambos registros siguen representando necesidades comerciales distintas.</p>`;
      }
      return "";
    },
  });

  document.title = `REV-03 ${review.reviewId} — Workspace (prototipo)`;
}

/* ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  if (!protoIsAuthenticated()) return;
  const host = document.querySelector<HTMLElement>("[data-reviews-surface]");
  if (!host) return;

  const reviewId = protoUrlParam("reviewId");
  const leadId = protoUrlParam("leadId");

  const humana = reviewId ? protoFindHumanReview(reviewId) : leadId ? protoHumanReviewForLead(leadId) : null;
  if (humana) { protoRenderHumanReview(host, humana); return; }

  const dup = reviewId ? protoFindDuplicateReview(reviewId) : leadId ? protoDuplicateReviewForLead(leadId) : null;
  if (dup) { protoRenderDuplicateReview(host, dup); return; }

  if (reviewId || leadId) {
    location.replace(protoRouteHref("system", { state: "not-found" }));
    return;
  }
  protoReviewsIndex(host);
});
