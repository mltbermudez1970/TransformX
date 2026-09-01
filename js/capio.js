"use strict";
const CAPIO_WELCOME = "Hola, soy Capio, tu TransformX Business Advisor. En esta etapa pública puedo ayudarte a entender problemas de negocio, diagnosticar brechas de capacidad y recomendar BizCaps. No tengo acceso a datos privados, KPIs de tu organización ni configuración de tenant.";
const CAPIO_PRIVATE_CONTEXT = "Esa información requiere un contexto autenticado dentro del Workspace de TransformX. Aquí solo puedo orientarte en descubrimiento público y pre-adopción. Puedes explorar BizCaps o contactar al equipo para una conversación comercial.";
const CAPIO_FALLBACK = "Cuéntame un problema concreto — por ejemplo, respuesta lenta a prospectos, cotizaciones que tardan demasiado o pedidos con datos incompletos — y te recomendaré una BizCap alineada.";
const recommendations = {
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
function matchRecommendation(text) {
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
function formatRecommendation(rec) {
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
function appendCapioMessage(container, text, type) {
    const message = document.createElement("div");
    message.className = `capio-chat__message capio-chat__message--${type}`;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return message;
}
function appendCapioAction(container, label, href) {
    const wrap = document.createElement("div");
    wrap.className = "capio-chat__message capio-chat__message--bot capio-chat__message--action";
    const link = document.createElement("a");
    link.className = "btn btn--outline-light btn--sm";
    link.href = href;
    link.textContent = label;
    wrap.appendChild(link);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}
function initCapio() {
    const chat = document.querySelector(".capio-chat");
    if (!chat)
        return;
    const messages = chat.querySelector(".capio-chat__messages");
    const input = chat.querySelector(".capio-chat__input");
    const sendBtn = chat.querySelector(".capio-chat__send");
    if (!messages || !input || !sendBtn)
        return;
    const messagesEl = messages;
    const inputEl = input;
    const sendButton = sendBtn;
    appendCapioMessage(messagesEl, CAPIO_WELCOME, "bot");
    function reply(text) {
        const match = matchRecommendation(text);
        if (match === "private") {
            appendCapioMessage(messagesEl, CAPIO_PRIVATE_CONTEXT, "bot");
            return;
        }
        if (match) {
            appendCapioMessage(messagesEl, formatRecommendation(match), "bot");
            appendCapioAction(messagesEl, "Explorar esta BizCap", match.detailUrl);
            return;
        }
        appendCapioMessage(messagesEl, CAPIO_FALLBACK, "bot");
    }
    function send() {
        const text = inputEl.value.trim();
        if (!text)
            return;
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
    inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    });
    document.querySelectorAll("[data-capio-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
            const prompt = button.dataset.capioPrompt;
            if (!prompt)
                return;
            inputEl.value = prompt;
            send();
        });
    });
    document.querySelectorAll("[data-scroll-capio]").forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            document.getElementById("capio")?.scrollIntoView({ behavior: "smooth" });
            window.setTimeout(() => inputEl.focus(), 600);
        });
    });
}
document.addEventListener("DOMContentLoaded", initCapio);
