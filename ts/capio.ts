type CapioResponseKey = "default" | "inventario" | "ventas" | "costos" | "ia" | "demo";
type CapioMessageType = "bot" | "user";
type CapioActionKey = "inventario" | "ventas" | "demo";

const capioResponses: Record<CapioResponseKey, string> = {
  default:
    "Hola, soy Capio, tu Personal Business Advisor. Cuéntame sobre tu negocio y te ayudaré a identificar las BizCaps más relevantes. Recuerda: mis recomendaciones son orientativas, no garantías.",
  inventario:
    "Para optimizar inventario, recomendaría la BizCap de Gestión de Inventario. Impacto estimado: +15% en ventas.",
  ventas: "La BizCap de Ventas Inteligentes podría ayudarte. Impacto estimado: +25% en conversión.",
  costos:
    "Para reducir costos, sugiero Finanzas Predictivas y Operaciones Ágiles. Impacto estimado: -20%.",
  ia: "Adoptar IA no requiere desarrollar desde cero. TransformX te guía con BizCaps preconfiguradas y supervisión humana.",
  demo: "Solicita una demo en el formulario al final. Respuesta en menos de 24 horas, sin compromiso.",
};

const capioActionPrompts: Record<CapioActionKey, string> = {
  inventario: "Quiero optimizar mi inventario",
  ventas: "Necesito mejorar mis ventas",
  demo: "Quiero solicitar una demo",
};

const CAPIO_FALLBACK_REPLY =
  "Explora nuestra biblioteca de BizCaps. Los impactos son estimaciones orientativas.";

function isCapioActionKey(value: string | undefined): value is CapioActionKey {
  return value === "inventario" || value === "ventas" || value === "demo";
}

function replyToCapio(text: string): string {
  const lower = text.toLowerCase();

  if (/inventario|stock/.test(lower)) return capioResponses.inventario;
  if (/venta|comercial/.test(lower)) return capioResponses.ventas;
  if (/costo|gasto/.test(lower)) return capioResponses.costos;
  if (/ia|inteligencia|automat/.test(lower)) return capioResponses.ia;
  if (/demo|contacto/.test(lower)) return capioResponses.demo;

  return CAPIO_FALLBACK_REPLY;
}

function appendCapioMessage(
  container: HTMLElement,
  text: string,
  type: CapioMessageType
): void {
  const message = document.createElement("div");
  message.className = `capio-chat__message capio-chat__message--${type}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
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

  appendCapioMessage(messagesEl, capioResponses.default, "bot");

  function send(): void {
    const text = inputEl.value.trim();
    if (!text) return;

    appendCapioMessage(messagesEl, text, "user");
    inputEl.value = "";
    sendButton.disabled = true;

    setTimeout(() => {
      appendCapioMessage(messagesEl, replyToCapio(text), "bot");
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

  document.querySelectorAll<HTMLButtonElement>("[data-capio-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.capioAction;
      inputEl.value = isCapioActionKey(action) ? capioActionPrompts[action] : "";
      send();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-scroll-capio]").forEach((element) => {
    element.addEventListener("click", (event: Event): void => {
      event.preventDefault();
      document.getElementById("capio")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputEl.focus(), 600);
    });
  });
}

document.addEventListener("DOMContentLoaded", initCapio);
