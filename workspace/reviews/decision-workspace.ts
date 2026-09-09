/**
 * Human Decision Workspace — patrón compartido por REV-02, REV-03, REV-04 y ASN-01.
 *
 * Orden de pantalla innegociable (Addendum §12.E):
 *   Decision Question → por qué existe la revisión → contexto → regla/política
 *   → evidencia a favor / en contra / faltante → asistencia de IA
 *   → resoluciones permitidas → justificación → confirmación material
 *   → resultado autoritativo
 *
 * Reglas que este módulo hace cumplir:
 *  - Las resoluciones permitidas se renderizan tal como llegan del fixture. No
 *    se construyen, ordenan por criterio propio ni se filtran localmente; una
 *    opción con `enabled:false` se muestra con su motivo, no se esconde.
 *  - La justificación es obligatoria cuando `requiresRationale`, y se valida
 *    antes de abrir la confirmación.
 *  - La confirmación material enuncia la CONSECUENCIA antes de enviar.
 *  - La IA aparece en su propio bloque, etiquetada y asesora.
 */

const PROTO_DECISION_SURFACE = "decision";

interface ProtoDecisionModel {
  /** Código de la superficie, para trazabilidad visible. */
  code: string;
  title: string;
  decisionQuestion: string;
  /** Por qué existe la revisión. */
  reason: { code: string; summary: string };
  context: { label: string; value: string }[];
  policy: { ruleId: string; ruleSummary: string; policyVersion: string } | null;
  evidence: { supporting: ProtoEvidenceItem[]; contradictory: ProtoEvidenceItem[]; missing: ProtoEvidenceItem[] } | null;
  ai: ProtoAiAssistance | null;
  /** Bloque libre que la superficie inserta entre contexto y evidencia. */
  extraHtml?: string;
  allowedResolutions: ProtoAllowedResolution[];
  availableActions: ProtoAction[];
  /** Acción material que se ejecuta al confirmar. */
  commandAction: ProtoAction;
  /** Clave de idempotencia base. */
  commandKey: string;
  /** Opciones para `additionalInputSchema`, cuando la resolución lo exige. */
  additionalOptions?: { id: string; label: string; hint?: string }[];
  /** Se ejecuta tras un envío aplicado, con la resolución elegida. */
  onResolved?: (resolution: ProtoAllowedResolution, rationale: string, extra: string | null) => string;
}

function protoRenderEvidenceList(items: ProtoEvidenceItem[], categoria: ProtoEvidenceCategory): string {
  if (items.length === 0) {
    return `<p class="ws-empty" role="status">Sin ${PROTO_EVIDENCE_CATEGORY_LABEL[categoria].toLowerCase()}.</p>`;
  }
  return `<ul class="ws-evidence">${items.map((e) => `
    <li class="ws-evidence__item ws-evidence__item--${e.category.toLowerCase()}">
      <p class="ws-evidence__label">${protoEsc(e.label)}</p>
      <p class="ws-evidence__value">${protoEsc(e.value)}</p>
      <p class="ws-evidence__src">${protoEsc(PROTO_EVIDENCE_SOURCE_LABEL[e.sourceType])}${
        e.sourceRef ? ` · ${protoEsc(e.sourceRef)}` : ""
      }${e.confidence !== null ? ` · confianza ${String(Math.round(e.confidence * 100))}%` : ""}</p>
    </li>`).join("")}</ul>`;
}

function protoRenderAiBlock(ai: ProtoAiAssistance): string {
  return `
    <section class="ws-section ws-ai" aria-labelledby="dw-ai-title">
      <h2 class="ws-section__title" id="dw-ai-title"><span class="ws-section__n" aria-hidden="true">6</span>Asistencia de IA</h2>
      <div class="c-alert c-alert--info" role="note">
        <p class="c-alert-message"><strong>Aportación asesora.</strong> La IA resume evidencia o propone un candidato. No selecciona, no aprueba y no ejecuta ninguna resolución.</p>
      </div>
      <p class="ws-ai__summary">${protoEsc(ai.summary)}</p>
      <p class="ws-muted ws-small">${protoEsc(ai.type)} · ${protoEsc(ai.taskId)} · autoridad ${protoEsc(ai.authority)}${
        typeof ai.confidence === "number" ? ` · confianza ${String(Math.round(ai.confidence * 100))}%` : ""
      }</p>
    </section>`;
}

function protoRenderResolutionOptions(m: ProtoDecisionModel): string {
  return `
    <fieldset class="c-radio-group ws-resolutions">
      <legend id="dw-res-legend">Resoluciones permitidas</legend>
      ${m.allowedResolutions.map((r, i) => `
        <div class="ws-resolution${r.enabled ? "" : " is-disabled"}">
          <label class="c-radio" for="dw-res-${String(i)}">
            <input type="radio" id="dw-res-${String(i)}" name="dw-res" value="${protoEsc(r.code)}"
                   aria-describedby="dw-res-legend dw-res-${String(i)}-desc" ${r.enabled ? "" : "disabled"}>
            ${protoEsc(r.label)}${r.destructive ? ' <span class="ws-destructive-tag">consecuencia material</span>' : ""}
          </label>
          <div class="ws-resolution__meta" id="dw-res-${String(i)}-desc">
            <p>${protoEsc(r.description)}</p>
            <p class="ws-resolution__consequence"><strong>Consecuencia:</strong> ${protoEsc(r.consequence)}</p>
            ${r.enabled ? "" : `<p class="ws-resolution__disabled"><strong>No disponible:</strong> ${protoEsc(r.disabledReason ?? "sin motivo declarado")}</p>`}
            ${r.permissionRequired ? `<p class="ws-muted ws-small">Permiso asociado: <code>${protoEsc(r.permissionRequired)}</code></p>` : ""}
          </div>
        </div>`).join("")}
    </fieldset>
    <p class="ws-muted ws-small">Este conjunto lo determina la BizCap. La interfaz no lo construye ni lo filtra; las opciones no disponibles se muestran con su motivo.</p>`;
}

function protoRenderDecisionWorkspace(host: HTMLElement, m: ProtoDecisionModel): void {
  host.innerHTML = `
    ${protoRenderMockNotice()}
    <p class="ws-code">${protoEsc(m.code)}</p>

    <section class="ws-section ws-decision-question" aria-labelledby="dw-q-title">
      <h1 class="ws-page__title" id="dw-q-title">${protoEsc(m.decisionQuestion)}</h1>
      <p class="ws-muted">${protoEsc(m.title)}</p>
    </section>

    <section class="ws-section" aria-labelledby="dw-why-title">
      <h2 class="ws-section__title" id="dw-why-title"><span class="ws-section__n" aria-hidden="true">2</span>Por qué existe esta revisión</h2>
      <p>${protoEsc(m.reason.summary)}</p>
      <p class="ws-muted ws-small">Motivo: <code>${protoEsc(m.reason.code)}</code></p>
    </section>

    <section class="ws-section" aria-labelledby="dw-ctx-title">
      <h2 class="ws-section__title" id="dw-ctx-title"><span class="ws-section__n" aria-hidden="true">3</span>Contexto relevante</h2>
      <dl class="ws-context">${m.context.map((c) => `<div><dt>${protoEsc(c.label)}</dt><dd>${c.value}</dd></div>`).join("")}</dl>
    </section>

    ${m.policy ? `
    <section class="ws-section" aria-labelledby="dw-policy-title">
      <h2 class="ws-section__title" id="dw-policy-title"><span class="ws-section__n" aria-hidden="true">4</span>Regla / política aplicable</h2>
      <p>${protoEsc(m.policy.ruleSummary)}</p>
      <p class="ws-muted ws-small">Regla <code>${protoEsc(m.policy.ruleId)}</code> · versión <code>${protoEsc(m.policy.policyVersion)}</code></p>
    </section>` : ""}

    ${m.extraHtml ?? ""}

    ${m.evidence ? `
    <section class="ws-section" aria-labelledby="dw-evid-title">
      <h2 class="ws-section__title" id="dw-evid-title"><span class="ws-section__n" aria-hidden="true">5</span>Evidencia</h2>
      <div class="ws-evidence__grid">
        <div><h3 class="ws-evidence__head">${PROTO_EVIDENCE_CATEGORY_LABEL.SUPPORTING}</h3>${protoRenderEvidenceList(m.evidence.supporting, "SUPPORTING")}</div>
        <div><h3 class="ws-evidence__head">${PROTO_EVIDENCE_CATEGORY_LABEL.CONTRADICTORY}</h3>${protoRenderEvidenceList(m.evidence.contradictory, "CONTRADICTORY")}</div>
        <div><h3 class="ws-evidence__head">${PROTO_EVIDENCE_CATEGORY_LABEL.MISSING}</h3>${protoRenderEvidenceList(m.evidence.missing, "MISSING")}</div>
      </div>
    </section>` : ""}

    ${m.ai ? protoRenderAiBlock(m.ai) : ""}

    <section class="ws-section" aria-labelledby="dw-res-title">
      <h2 class="ws-section__title" id="dw-res-title"><span class="ws-section__n" aria-hidden="true">7</span>Resolución</h2>
      <div class="ws-feedback" data-dw-feedback role="status" aria-live="polite"></div>
      ${protoRenderResolutionOptions(m)}

      <div class="auth-field ws-extra-input" data-dw-extra hidden>
        <label class="form-label" for="dw-extra">Selección requerida</label>
        <select class="form-input" id="dw-extra">
          <option value="">— Elegir —</option>
          ${(m.additionalOptions ?? []).map((o) => `<option value="${protoEsc(o.id)}">${protoEsc(o.label)}</option>`).join("")}
        </select>
        <p class="form-hint" data-dw-extra-hint></p>
      </div>

      <div class="auth-field">
        <label class="form-label" for="dw-rationale">Justificación <span class="ws-req" data-dw-req hidden>*</span></label>
        <textarea class="form-input ws-textarea" id="dw-rationale" rows="3"
                  aria-describedby="dw-rationale-help"></textarea>
        <p class="form-hint" id="dw-rationale-help">Queda registrada junto a la resolución, como evidencia separada de la evaluación original del sistema.</p>
      </div>

      <div class="ws-actions">
        <button type="button" class="c-btn c-btn--primary" data-dw-submit disabled>Revisar y confirmar</button>
      </div>
    </section>

    <section class="ws-section" aria-labelledby="dw-result-title" data-dw-result hidden>
      <h2 class="ws-section__title" id="dw-result-title" tabindex="-1"><span class="ws-section__n" aria-hidden="true">9</span>Resultado autoritativo</h2>
      <div data-dw-result-body></div>
    </section>

    <dialog class="c-dialog" id="dw-confirm" aria-labelledby="dw-confirm-title" aria-describedby="dw-confirm-desc dw-confirm-note">
      <div class="c-dialog__icon" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
      </div>
      <h3 class="c-dialog-title" id="dw-confirm-title">Confirmar resolución</h3>
      <p class="c-dialog-body" id="dw-confirm-desc"></p>
      <p class="c-dialog-note" id="dw-confirm-note"></p>
      <div class="c-dialog-actions">
        <button type="button" class="c-btn c-btn--secondary" data-dw-cancel>Cancelar</button>
        <button type="button" class="c-btn c-btn--primary" data-dw-confirm>Confirmar</button>
      </div>
    </dialog>`;

  protoWireDecisionWorkspace(m);
}

function protoWireDecisionWorkspace(m: ProtoDecisionModel): void {
  const submit = document.querySelector<HTMLButtonElement>("[data-dw-submit]");
  const feedback = document.querySelector<HTMLElement>("[data-dw-feedback]");
  const rationale = document.querySelector<HTMLTextAreaElement>("#dw-rationale");
  const reqMark = document.querySelector<HTMLElement>("[data-dw-req]");
  const extraWrap = document.querySelector<HTMLElement>("[data-dw-extra]");
  const extraSel = document.querySelector<HTMLSelectElement>("#dw-extra");
  const extraHint = document.querySelector<HTMLElement>("[data-dw-extra-hint]");
  const dialog = document.querySelector<HTMLDialogElement>("#dw-confirm");
  if (!submit || !feedback || !rationale || !dialog) return;

  const elegida = (): ProtoAllowedResolution | null => {
    const sel = document.querySelector<HTMLInputElement>('input[name="dw-res"]:checked');
    if (!sel) return null;
    return m.allowedResolutions.find((r) => r.code === sel.value) ?? null;
  };

  const refrescar = (): void => {
    const r = elegida();
    submit.disabled = r === null;
    if (!r) return;
    if (reqMark) reqMark.hidden = !r.requiresRationale;
    if (extraWrap) extraWrap.hidden = !r.requiresAdditionalInput;
    if (extraHint) extraHint.textContent = r.additionalInputSchema?.label ?? "";
    dialog.classList.toggle("c-dialog--destructive", r.destructive);
  };

  document.querySelectorAll<HTMLInputElement>('input[name="dw-res"]').forEach((i) => {
    i.addEventListener("change", refrescar);
  });

  submit.addEventListener("click", () => {
    const r = elegida();
    if (!r) return;

    // Justificación obligatoria: se valida ANTES de abrir la confirmación.
    if (r.requiresRationale && rationale.value.trim() === "") {
      rationale.setAttribute("aria-invalid", "true");
      protoRenderFeedback(feedback, {
        severidad: "error",
        mensaje: "La justificación es obligatoria para esta resolución.",
        detalle: "Queda registrada como evidencia de la decisión humana.",
      });
      rationale.focus();
      return;
    }
    if (r.requiresAdditionalInput && (!extraSel || extraSel.value === "")) {
      protoRenderFeedback(feedback, {
        severidad: "error",
        mensaje: `Falta seleccionar: ${r.additionalInputSchema?.label ?? "un elemento requerido"}.`,
      });
      extraSel?.focus();
      return;
    }
    rationale.setAttribute("aria-invalid", "false");
    protoClearFeedback(feedback);

    // La confirmación enuncia la consecuencia material antes de enviar.
    const desc = document.querySelector<HTMLElement>("#dw-confirm-desc");
    const note = document.querySelector<HTMLElement>("#dw-confirm-note");
    if (desc) desc.textContent = `Vas a aplicar: ${r.label}.`;
    if (note) note.textContent = r.consequence;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-dw-confirm]")?.focus();
  });

  dialog.querySelector<HTMLButtonElement>("[data-dw-cancel]")?.addEventListener("click", () => {
    dialog.close();
    submit.focus();
  });
  /*
   * Abandono ante la consecuencia: abrió el diálogo de confirmación y lo cerró
   * sin confirmar. Es duda ante lo que la operación implica, y en una sesión de
   * validación eso vale más que el éxito.
   */
  let confirmado = false;
  dialog.addEventListener("close", () => {
    if (!confirmado) {
      trackEvent("confirmation_abandoned", {
        surface: "REV-02",
        resolution: elegida()?.code ?? null,
      });
    }
    confirmado = false;
    submit.focus();
  });

  dialog.querySelector<HTMLButtonElement>("[data-dw-confirm]")?.addEventListener("click", async (e) => {
    const r = elegida();
    if (!r) return;
    const btn = e.currentTarget as HTMLButtonElement;
    confirmado = true;
    const aplicado = await protoRunCommand({
      key: `${m.commandKey}:${r.code}`,
      action: m.commandAction,
      boton: btn,
      feedback,
    });
    dialog.close();

    if (!aplicado) return;

    const extra = r.requiresAdditionalInput && extraSel ? extraSel.value : null;
    const detalle = m.onResolved ? m.onResolved(r, rationale.value.trim(), extra) : "";

    // Resultado autoritativo devuelto por el mock, no calculado aquí.
    const resultSec = document.querySelector<HTMLElement>("[data-dw-result]");
    const resultBody = document.querySelector<HTMLElement>("[data-dw-result-body]");
    if (resultSec && resultBody) {
      resultBody.innerHTML = `
        <div class="c-alert c-alert--success" role="status">
          <p class="c-alert-message"><strong>Resolución registrada:</strong> ${protoEsc(r.label)}</p>
        </div>
        <dl class="ws-context">
          <div><dt>Consecuencia aplicada</dt><dd>${protoEsc(r.consequence)}</dd></div>
          <div><dt>Justificación</dt><dd>${rationale.value.trim() ? protoEsc(rationale.value.trim()) : "<span class='ws-muted'>No requerida</span>"}</dd></div>
          ${extra ? `<div><dt>Selección</dt><dd>${protoEsc(extra)}</dd></div>` : ""}
        </dl>
        ${detalle}
        <p class="ws-muted ws-small">La evaluación original del sistema y su evidencia se conservan intactas: esta resolución humana se registra aparte.</p>`;
      resultSec.hidden = false;
      resultSec.scrollIntoView({ behavior: "auto", block: "nearest" });
    }

    // Tras resolver, las opciones se bloquean: el envío es único.
    document.querySelectorAll<HTMLInputElement>('input[name="dw-res"]').forEach((i) => { i.disabled = true; });
    submit.disabled = true;

    // El cierre del diálogo devolvió el foco al botón de envío, que acaba de
    // quedar deshabilitado: sin esto el foco cae al `body` y quien navega con
    // teclado o lector de pantalla pierde el hilo justo después de aplicar una
    // operación material. Se lleva al resultado, que es el contexto nuevo.
    document.querySelector<HTMLElement>("#dw-result-title")?.focus();
  });

  refrescar();
}
