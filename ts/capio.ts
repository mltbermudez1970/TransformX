type CapioMessageType = "bot" | "user";
type BizCapId = "LAB-001" | "LAB-002" | "LAB-003";

interface CapioRecommendation {
  bizcapId: BizCapId;
  name: string;
  gap: string;
  why: string;
  outcomes: string[];
  detailUrl: string;
}

const CAPIO_WELCOME =
  "Hola, soy Capio, tu TransformX Business Advisor. En esta etapa pública puedo ayudarte a entender problemas de negocio, diagnosticar brechas de capacidad y recomendar BizCaps. No tengo acceso a datos privados, KPIs de tu organización ni configuración de tenant.";

const CAPIO_PRIVATE_CONTEXT =
  "Esa información requiere un contexto autenticado dentro del Workspace de TransformX. Aquí solo puedo orientarte en descubrimiento público y pre-adopción. Puedes explorar BizCaps o contactar al equipo para una conversación comercial.";

const CAPIO_FALLBACK =
  "Cuéntame un problema concreto — por ejemplo, respuesta lenta a prospectos, cotizaciones que tardan demasiado o pedidos con datos incompletos — y te recomendaré una BizCap alineada.";

const recommendations: Record<BizCapId, CapioRecommendation> = {
  "LAB-001": {
    bizcapId: "LAB-001",
    name: "Lead Intake & Qualification",
    gap: "Los leads entran por canales dispersos, se responde tarde y no hay criterios consistentes de calificación.",
    why: "Esta BizCap estandariza la captura, enriquecimiento y priorización de prospectos con reglas configurables y trazabilidad.",
    outcomes: [
      "Respuesta más oportuna a oportunidades comerciales",
      "Calificación consistente entre equipos",
      "Mejor visibilidad del pipeline temprano",
    ],
    detailUrl: "bizcap-lead-intake-qualification.html",
  },
  "LAB-002": {
    bizcapId: "LAB-002",
    name: "Quote & Proposal Management",
    gap: "Preparar cotizaciones consume tiempo, depende de personas clave y genera versiones inconsistentes.",
    why: "Esta BizCap estructura plantillas, aprobaciones y versionado de propuestas comerciales sobre flujos configurables.",
    outcomes: [
      "Menor tiempo de preparación de propuestas",
      "Mayor consistencia en pricing y condiciones",
      "Trazabilidad de cambios y aprobaciones",
    ],
    detailUrl: "bizcaps.html#lab-002",
  },
  "LAB-003": {
    bizcapId: "LAB-003",
    name: "Order Intake & Validation",
    gap: "Los pedidos llegan con datos incompletos o errores que detienen fulfillment y generan reprocesos.",
    why: "Esta BizCap valida estructura, reglas de negocio e integridad de datos antes de activar el flujo operativo.",
    outcomes: [
      "Menos reprocesos por datos inválidos",
      "Entrada de pedidos más predecible",
      "Mejor handoff entre ventas y operaciones",
    ],
    detailUrl: "bizcaps.html#lab-003",
  },
};

function matchRecommendation(text: string): CapioRecommendation | "private" | null {
  const lower = text.toLowerCase();

  if (/kpi|configur|billing|factur|tenant|mi cuenta|datos priv|dashboard|workspace autent|uso de cap credit/.test(lower)) {
    return "private";
  }
  if (/prospect|responde tarde|oportunidad|lead|calific/.test(lower)) {
    return recommendations["LAB-001"];
  }
  if (/cotiz|propuesta|presupuesto|quote|pricing comercial/.test(lower)) {
    return recommendations["LAB-002"];
  }
  if (/pedido|orden|incomplet|error|valid|fulfillment|intake/.test(lower)) {
    return recommendations["LAB-003"];
  }

  return null;
}

function formatRecommendation(rec: CapioRecommendation): string {
  const outcomes = rec.outcomes.map((item) => `• ${item}`).join("\n");
  return [
    `Brecha de capacidad: ${rec.gap}`,
    "",
    `BizCap recomendada: ${rec.name} (${rec.bizcapId})`,
    "",
    `Por qué encaja: ${rec.why}`,
    "",
    "Outcomes esperados (cualitativos):",
    outcomes,
  ].join("\n");
}

function appendCapioMessage(
  container: HTMLElement,
  text: string,
  type: CapioMessageType
): HTMLElement {
  const message = document.createElement("div");
  message.className = `capio-chat__message capio-chat__message--${type}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
}

/** Devuelve el enlace creado, igual que `appendCapioMessage` devuelve el nodo. */
function appendCapioAction(
  container: HTMLElement,
  label: string,
  href: string
): HTMLAnchorElement {
  const wrap = document.createElement("div");
  wrap.className = "capio-chat__message capio-chat__message--bot capio-chat__message--action";

  const link = document.createElement("a");
  link.className = "btn btn--outline-light btn--sm";
  link.href = href;
  link.textContent = label;

  wrap.appendChild(link);
  container.appendChild(wrap);
  container.scrollTop = container.scrollHeight;
  return link;
}

function initCapio(): void {
  const chat = document.querySelector<HTMLElement>(".capio-chat");
  if (!chat) return;

  const messages = chat.querySelector<HTMLElement>(".capio-chat__messages");
  const input = chat.querySelector<HTMLInputElement>(".capio-chat__input");
  const sendBtn = chat.querySelector<HTMLButtonElement>(".capio-chat__send");
  if (!messages || !input || !sendBtn) return;

  const messagesEl = messages;
  const inputEl = input;
  const sendButton = sendBtn;

  appendCapioMessage(messagesEl, CAPIO_WELCOME, "bot");

  /* Estado de la conversación: cuántas preguntas lleva y si la última salió de
     un prompt sugerido. Una sola pregunta es curiosidad; tres es interés. */
  let preguntasEnLaSesion = 0;
  let promptSugeridoUsado = false;

  function reply(text: string): void {
    const match = matchRecommendation(text);

    /*
     * Se mide el DESENLACE del discovery, nunca la pregunta. El texto que
     * alguien escribe aquí puede traer su empresa, sus volúmenes o su problema
     * concreto: eso no sale del navegador. Sólo interesa a qué capacidad mapeó
     * la consulta y cuántas se quedaron sin respuesta útil.
     */
    preguntasEnLaSesion += 1;
    trackEvent("capio_question_answered", {
      outcome: match === "private" ? "private_context_declined" : match ? "bizcap_recommended" : "no_match",
      bizcap_id: match && match !== "private" ? match.bizcapId : null,
      question_length: text.trim().length,
      question_number: preguntasEnLaSesion,
      // Escribir en vez de usar un prompt significa que su problema no estaba
      // en nuestra lista: es señal de que el copy no habla del dolor real.
      source: promptSugeridoUsado ? "suggested_prompt" : "typed",
    });
    promptSugeridoUsado = false;

    if (match === "private") {
      appendCapioMessage(messagesEl, CAPIO_PRIVATE_CONTEXT, "bot");
      return;
    }

    if (match) {
      appendCapioMessage(messagesEl, formatRecommendation(match), "bot");
      const accion = appendCapioAction(messagesEl, "Explorar esta BizCap", match.detailUrl);
      accion.addEventListener("click", () => {
        trackEvent("capio_recommendation_followed", {
          bizcap_id: match.bizcapId,
          question_number: preguntasEnLaSesion,
        });
      });
      return;
    }

    appendCapioMessage(messagesEl, CAPIO_FALLBACK, "bot");
  }

  function send(): void {
    const text = inputEl.value.trim();
    if (!text) return;

    appendCapioMessage(messagesEl, text, "user");
    inputEl.value = "";
    sendButton.disabled = true;

    window.setTimeout(() => {
      reply(text);
      sendButton.disabled = false;
      inputEl.focus();
    }, 700);
  }

  sendButton.addEventListener("click", send);

  inputEl.addEventListener("keydown", (event: KeyboardEvent): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });

  document.querySelectorAll<HTMLButtonElement>("[data-capio-prompt]").forEach((button, indice) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.capioPrompt;
      if (!prompt) return;
      /*
       * El texto del prompt sugerido es NUESTRO, no del visitante: se puede
       * enviar literal y es justo lo que interesa saber (¿se reconocen en los
       * problemas que planteamos?). Lo que la persona teclea a mano nunca sale.
       */
      promptSugeridoUsado = true;
      trackEvent("capio_prompt_used", {
        prompt_text: prompt,
        prompt_index: indice + 1,
      });
      inputEl.value = prompt;
      send();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-scroll-capio]").forEach((element) => {
    element.addEventListener("click", (event: Event): void => {
      event.preventDefault();
      document.getElementById("capio")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => inputEl.focus(), 600);
    });
  });
}

document.addEventListener("DOMContentLoaded", initCapio);
