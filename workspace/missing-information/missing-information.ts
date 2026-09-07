/**
 * MI-01 Missing Information · MI-03 New Customer Information Review.
 *
 * MI-01 distingue lo **requerido** para poder calificar de lo que sólo
 * enriquece. El borrador asistido por IA es editable, regenerable y
 * descartable, y sigue etiquetado como asistencia hasta que una persona lo
 * envía.
 *
 * MI-03 compara tres cosas que NO son lo mismo:
 *   Canonical Fact  — el valor de negocio vigente y aceptado
 *   Received        — lo que el cliente envió, aún sin aceptar
 *   AI Interpretation — la lectura del asistente, nunca canónica
 * y ofrece aceptar / corregir / mantener / escalar.
 *
 * Las comunicaciones no actualizan datos canónicos: la información del cliente
 * pasa por esta revisión antes de aceptarse.
 */

const PROTO_MI_DRAFT_BASE =
  "Hola, gracias por tu interés. Para continuar con la evaluación necesitamos confirmar la cantidad mensual estimada y la unidad de medida. ¿Podrías indicárnoslas?";

let protoMiDraftDescartado = false;
let protoMiDraftVersion = 1;

function protoMiVista(): "missing" | "received" {
  return protoUrlParam("view") === "received" ? "received" : "missing";
}

/* ===========================================================================
 * MI-01 — Información faltante
 * ========================================================================= */

function protoRenderMi01(host: HTMLElement, lead: ProtoCanonicalLead): void {
  const n = lead.commercialNeed;
  const requeridos = protoMissingRequiredFields(lead);

  const opcionales = [
    { label: "Demanda recurrente", campo: n.recurringDemand },
    { label: "Material", campo: n.material },
    { label: "Dimensiones / capacidad", campo: n.dimensionsOrCapacity },
    { label: "Fecha requerida", campo: n.requestedOrRequiredDate },
    { label: "Requisitos especiales", campo: n.specialRequirements },
  ].filter((o) => o.campo.status !== "CANONICAL");

  host.innerHTML = `
    ${protoRenderMiCabecera(lead, "Información faltante", "MI-01")}
    <div class="ws-feedback" data-mi-feedback role="status" aria-live="polite"></div>

    <section class="ws-section" aria-labelledby="mi-required-title">
      <h2 class="ws-section__title" id="mi-required-title">Requerido para continuar</h2>
      ${requeridos.length
        ? `<p>Sin estos datos la calificación no puede iniciarse.</p>
           <ul class="ws-fieldlist">${requeridos.map((f) => `<li class="ws-fieldlist__item ws-fieldlist__item--required">
             <span class="ws-missing">Falta</span> ${protoEsc(protoMiEtiquetaCampo(f))}</li>`).join("")}</ul>`
        : `<p class="ws-empty" role="status">No falta ningún dato requerido.</p>`}
    </section>

    <section class="ws-section" aria-labelledby="mi-optional-title">
      <h2 class="ws-section__title" id="mi-optional-title">Enriquecimiento opcional</h2>
      ${opcionales.length
        ? `<p>Mejora la calidad del lead, pero <strong>no bloquea</strong> la calificación.</p>
           <ul class="ws-fieldlist">${opcionales.map((o) => `<li class="ws-fieldlist__item">
             <span class="ws-muted">Opcional</span> ${protoEsc(o.label)}</li>`).join("")}</ul>`
        : `<p class="ws-empty" role="status">Sin campos de enriquecimiento pendientes.</p>`}
    </section>

    <section class="ws-section" aria-labelledby="mi-draft-title">
      <h2 class="ws-section__title" id="mi-draft-title">Mensaje al cliente</h2>
      <p class="c-alert c-alert--info" role="note"><span class="c-alert-message">Borrador asistido por IA. Editable, regenerable y descartable: no se envía nada hasta que tú lo confirmes.</span></p>
      <div data-mi-draft>${protoRenderMiDraft()}</div>
    </section>`;

  protoWireMi01(lead);
}

function protoMiEtiquetaCampo(campo: string): string {
  const mapa: Record<string, string> = {
    "contact.emailOrPhone": "Correo o teléfono de contacto",
    productOffering: "Producto / oferta",
    quantity: "Cantidad",
    unit: "Unidad",
    geographyDestination: "Destino",
  };
  return mapa[campo] ?? campo;
}

function protoRenderMiDraft(): string {
  if (protoMiDraftDescartado) {
    return `<p class="ws-empty" role="status">Borrador descartado. Puedes generar uno nuevo.</p>
      <div class="ws-actions"><button type="button" class="c-btn c-btn--secondary" data-mi-regenerate>Generar borrador</button></div>`;
  }
  return `
    <div class="auth-field">
      <label class="form-label" for="mi-draft">Texto del mensaje (versión ${String(protoMiDraftVersion)})</label>
      <textarea class="form-input ws-textarea" id="mi-draft" rows="4">${protoEsc(PROTO_MI_DRAFT_BASE)}</textarea>
    </div>
    <div class="ws-actions">
      <button type="button" class="c-btn c-btn--primary" data-mi-send>Enviar solicitud</button>
      <button type="button" class="c-btn c-btn--secondary" data-mi-regenerate>Regenerar</button>
      <button type="button" class="c-btn c-btn--secondary" data-mi-discard>Descartar</button>
    </div>
    <p class="ws-muted ws-small">La espera del cliente comienza sólo cuando la solicitud se envía correctamente, no al crear el borrador.</p>`;
}

function protoWireMi01(lead: ProtoCanonicalLead): void {
  const feedback = document.querySelector<HTMLElement>("[data-mi-feedback]");
  const draftHost = document.querySelector<HTMLElement>("[data-mi-draft]");

  const rewire = (): void => {
    if (draftHost) draftHost.innerHTML = protoRenderMiDraft();
    protoWireMi01(lead);
  };

  document.querySelector<HTMLButtonElement>("[data-mi-regenerate]")?.addEventListener("click", () => {
    protoMiDraftDescartado = false;
    protoMiDraftVersion += 1;
    rewire();
    document.querySelector<HTMLTextAreaElement>("#mi-draft")?.focus();
  });

  document.querySelector<HTMLButtonElement>("[data-mi-discard]")?.addEventListener("click", () => {
    protoMiDraftDescartado = true;
    rewire();
    document.querySelector<HTMLButtonElement>("[data-mi-regenerate]")?.focus();
  });

  document.querySelector<HTMLButtonElement>("[data-mi-send]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (!feedback) return;
    const texto = document.querySelector<HTMLTextAreaElement>("#mi-draft")?.value.trim() ?? "";
    if (texto === "") {
      protoRenderFeedback(feedback, { severidad: "error", mensaje: "El mensaje no puede estar vacío.", detalle: "Escribe o regenera el borrador antes de enviar." });
      document.querySelector<HTMLTextAreaElement>("#mi-draft")?.focus();
      return;
    }
    await protoRunCommand({
      key: `REQUEST_MISSING_INFORMATION:${lead.leadId}`,
      action: "REQUEST_MISSING_INFORMATION",
      boton: btn,
      feedback,
    });
  });
}

/* ===========================================================================
 * MI-03 — Revisión de información recibida
 * ========================================================================= */

function protoRenderMi03(host: HTMLElement, lead: ProtoCanonicalLead): void {
  const comparaciones = protoGetFieldComparisons(lead.leadId);

  host.innerHTML = `
    ${protoRenderMiCabecera(lead, "Revisión de información recibida", "MI-03")}
    <div class="ws-feedback" data-mi-feedback role="status" aria-live="polite"></div>

    <p class="ws-muted ws-small">Las comunicaciones no actualizan datos canónicos. La información del cliente se acepta aquí, explícitamente.</p>

    ${comparaciones.length
      ? comparaciones.map(protoRenderComparacion).join("")
      : `<p class="ws-empty" role="status">No hay información recibida pendiente de revisión para este lead.</p>`}`;

  protoWireMi03(lead, comparaciones);
}

function protoRenderComparacion(c: ProtoFieldComparison): string {
  const val = (v: string | number | null, u?: string): string =>
    v === null ? "<span class='ws-missing'>Sin valor</span>" : `${protoEsc(String(v))}${u ? ` ${protoEsc(u)}` : ""}`;

  return `
    <section class="ws-section ws-compare" aria-labelledby="cmp-${protoEsc(c.field)}-title">
      <h2 class="ws-section__title" id="cmp-${protoEsc(c.field)}-title">${protoEsc(c.fieldLabel)}</h2>

      <div class="ws-compare__grid">
        <article class="ws-compare__col ws-compare__col--canonical">
          <h3>Dato canónico</h3>
          <p class="ws-compare__value">${val(c.canonical.value, c.canonical.unit)}</p>
          <p class="ws-muted ws-small">Valor de negocio vigente y aceptado · versión ${String(c.canonical.version)}</p>
        </article>

        <article class="ws-compare__col ws-compare__col--received">
          <h3>Información recibida</h3>
          <p class="ws-compare__value">${val(c.received.value, c.received.unit)}</p>
          <p class="ws-muted ws-small">${protoEsc(c.received.source)} · ${protoEsc(protoFormatFecha(c.received.receivedAt))}<br>Aún no aceptada: no es dato canónico.</p>
        </article>

        <article class="ws-compare__col ws-compare__col--ai">
          <h3>Interpretación de IA</h3>
          <p class="ws-compare__value">${val(c.aiInterpretation.value, c.aiInterpretation.unit)}</p>
          <p class="ws-muted ws-small">${protoEsc(c.aiInterpretation.type)} · confianza ${String(Math.round(c.aiInterpretation.confidence * 100))}%<br>Lectura del asistente. Nunca es dato canónico.</p>
        </article>
      </div>

      <fieldset class="c-radio-group ws-compare__decision">
        <legend id="legend-${protoEsc(c.field)}">Resolución para ${protoEsc(c.fieldLabel)}</legend>
        ${c.availableActions.map((a, i) => `
          <label class="c-radio" for="res-${protoEsc(c.field)}-${String(i)}">
            <input type="radio" id="res-${protoEsc(c.field)}-${String(i)}" name="res-${protoEsc(c.field)}"
                   value="${protoEsc(a)}" aria-describedby="legend-${protoEsc(c.field)}" ${i === 0 ? "checked" : ""}>
            ${protoEsc(PROTO_MI_ACTION_LABEL[a])}
          </label>`).join("")}
      </fieldset>

      <div class="ws-actions">
        <button type="button" class="c-btn c-btn--primary" data-mi-resolve="${protoEsc(c.field)}">Aplicar resolución</button>
      </div>
      <p class="ws-muted ws-small">Aceptar el valor recibido lo convierte en canónico; mantener conserva el actual. Escalar abre revisión humana y no decide por ti.</p>
    </section>`;
}

function protoWireMi03(lead: ProtoCanonicalLead, comparaciones: ProtoFieldComparison[]): void {
  const feedback = document.querySelector<HTMLElement>("[data-mi-feedback]");
  document.querySelectorAll<HTMLButtonElement>("[data-mi-resolve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const field = btn.getAttribute("data-mi-resolve");
      if (!field || !feedback) return;
      const elegido = document.querySelector<HTMLInputElement>(`input[name="res-${field}"]:checked`);
      if (!elegido) return;
      const cmp = comparaciones.find((c) => c.field === field);
      const aplicado = await protoRunCommand({
        key: `MI03:${lead.leadId}:${field}:${elegido.value}`,
        action: "REVIEW_RECEIVED_INFORMATION",
        boton: btn,
        feedback,
      });
      if (aplicado && cmp) {
        protoRenderFeedback(feedback, {
          severidad: "success",
          mensaje: `Resolución aplicada: ${PROTO_MI_ACTION_LABEL[elegido.value as ProtoMiAction]}.`,
          detalle:
            elegido.value === "ACCEPT_RECEIVED_VALUE"
              ? "El valor recibido pasa a ser el dato canónico vigente (simulado)."
              : elegido.value === "KEEP_CANONICAL_VALUE"
                ? "Se conserva el dato canónico actual; la información recibida queda registrada."
                : elegido.value === "REQUEST_HUMAN_REVIEW"
                  ? "Se abre una revisión humana. La decisión completa corresponde a PM-UX14-05."
                  : "Se registró una corrección manual del valor recibido.",
        });
      }
    });
  });
}

/* ========================================================================= */

function protoRenderMiCabecera(lead: ProtoCanonicalLead, titulo: string, codigo: string): string {
  const otra = protoMiVista() === "missing" ? "received" : "missing";
  const otraLabel = otra === "received" ? "Ir a revisión de información recibida (MI-03)" : "Ir a información faltante (MI-01)";
  return `
    <p class="ws-back"><a href="${protoRouteHref("lab-001-leads", { leadId: lead.leadId })}">← Volver al lead ${protoEsc(lead.leadReference)}</a></p>
    <p class="ws-code">${protoEsc(codigo)}</p>
    <h1 class="ws-page__title">${protoEsc(titulo)}</h1>
    <p class="ws-page__lead">${protoEsc(lead.company.companyName)} · ${protoEsc(lead.leadReference)} · ${protoEsc(PROTO_LEAD_STATE_LABEL[lead.lifecycleState])}</p>
    ${protoRenderMockNotice()}
    <p class="ws-page__foot"><a href="${protoRouteHref("lab-001-missing-info", { leadId: lead.leadId, view: otra })}">${protoEsc(otraLabel)}</a></p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  if (!protoIsAuthenticated()) return;
  const host = document.querySelector<HTMLElement>("[data-mi-surface]");
  if (!host) return;

  // SYS-08: si el WorkItem ya no está activo, se reemplaza en línea.
  if (protoRenderSys08IfResolved(host, protoUrlParam("workItemId"))) return;

  const leadId = protoUrlParam("leadId") ?? "LEAD-00042";
  const lead = protoFindLead(leadId);
  if (!lead) {
    location.replace(protoRouteHref("system", { state: "not-found" }));
    return;
  }

  if (protoMiVista() === "received") protoRenderMi03(host, lead);
  else protoRenderMi01(host, lead);
});
