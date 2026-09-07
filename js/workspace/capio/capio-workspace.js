"use strict";
/**
 * Capio contextual dentro del Workspace — SÓLO PROTOTIPO.
 *
 * Fronteras que este archivo hace cumplir de forma explícita:
 *  1. Capio **explica, no ejecuta**. Ante cualquier intención operativa
 *     (aprobar, asignar, calificar, convertir, eliminar…) responde declinando y
 *     remite a la superficie que sí tiene autoridad. No es workflow authority.
 *  2. Capio **nunca recibe secretos**. Si la entrada parece contraseña, OTP,
 *     código de recuperación o secreto de autenticador, se rechaza sin
 *     procesarla y sin registrarla.
 *  3. Determinístico: no hay LLM ni llamada de red.
 */
const PROTO_CAPIO_WS_BIENVENIDA = "Soy Capio en contexto autenticado. Puedo explicarte qué significa un estado, dónde continuar un trabajo o qué implica una decisión. No ejecuto operaciones: aprobar, asignar, calificar o convertir ocurre en la superficie correspondiente, con tus permisos.";
/** Verbos de intención operativa: Capio declina, no actúa. */
const PROTO_CAPIO_WS_OPERATIVO = /\b(aprueba|aprobar|asigna|asignar|reasigna|califica|calificar|convierte|convertir|elimina|eliminar|borra|borrar|cierra|cerrar|rechaza|rechazar|ejecuta|ejecutar|env[ií]a|enviar|marca|marcar)\b/i;
const PROTO_CAPIO_WS_RESPUESTAS = [
    {
        patron: /revisi[oó]n humana|human review/i,
        respuesta: "Un caso llega a revisión humana cuando las reglas de la BizCap no pueden resolverlo por sí solas y se requiere criterio de una persona con autoridad. La decisión, sus resoluciones permitidas y su justificación se registran en la superficie Reviews.",
    },
    {
        patron: /duplicad/i,
        respuesta: "Un candidato a duplicado significa que dos registros podrían responder a la misma necesidad comercial. Coincidir en empresa o contacto no basta: la pregunta es si se trata de la misma necesidad. La comparación y la resolución están en Reviews.",
    },
    {
        patron: /informaci[oó]n faltante|missing information/i,
        respuesta: "Información faltante significa que la captura no trae todos los datos requeridos para avanzar. La superficie distingue lo obligatorio de lo que sólo enriquece, y cualquier borrador asistido es editable y descartable antes de confirmar.",
    },
    {
        patron: /calificaci[oó]n|qualification|qd-0/i,
        respuesta: "La calificación evalúa criterios definidos en la configuración de la BizCap. Un criterio en FAIL no es lo mismo que uno en REVIEW: FAIL es un resultado determinado por la regla; REVIEW indica que hace falta criterio humano. Yo no calculo ni cambio esos resultados.",
    },
    {
        patron: /readiness|convertir|oportunidad|opportunity/i,
        respuesta: "Calificado y listo no son lo mismo. Un lead puede estar calificado y aún tener condiciones de readiness sin satisfacer que bloqueen la conversión. Las condiciones y sus bloqueos se muestran en Opportunity Readiness.",
    },
    {
        patron: /asignaci[oó]n|assignment|due[ñn]o|owner/i,
        respuesta: "Una excepción de asignación indica que la asignación automática no encontró un responsable elegible según la política. Que no haya responsable elegible es un resultado de negocio, no una falla técnica. El responsable de un WorkItem no es necesariamente el dueño comercial del lead.",
    },
    {
        patron: /cap credit|consumo|billing|factura|precio/i,
        respuesta: "En esta etapa del prototipo no expongo consumo, facturación ni Cap Credits de tu organización. El modelo comercial está descrito en el sitio público y sus cantidades siguen siendo decisiones pendientes.",
    },
    {
        patron: /qu[eé] puedes hacer|ayuda|c[oó]mo funciona/i,
        respuesta: "Puedo explicar estados, decisiones y dónde continuar un trabajo dentro de LAB-001. No ejecuto acciones ni cambio datos. Pregúntame por revisión humana, duplicados, información faltante, calificación, asignación o readiness.",
    },
];
const PROTO_CAPIO_WS_FALLBACK = "No tengo una explicación específica para eso en este prototipo. Puedo ayudarte con revisión humana, duplicados, información faltante, calificación, asignación o readiness de oportunidad.";
function protoCapioWsAgregar(texto, autor) {
    const log = document.querySelector("[data-capio-ws-log]");
    if (!log)
        return;
    const p = document.createElement("p");
    p.className = `capio-ws__msg capio-ws__msg--${autor === "capio" ? "bot" : "user"}`;
    const etiqueta = document.createElement("strong");
    etiqueta.textContent = `${autor === "capio" ? "Capio" : "Tú"}: `;
    p.appendChild(etiqueta);
    p.appendChild(document.createTextNode(texto));
    log.appendChild(p);
}
function protoCapioWsResponder(pregunta) {
    // Frontera 2: los secretos no se procesan ni se registran.
    if (protoContieneSecreto(pregunta)) {
        return "No puedo recibir contraseñas, códigos de verificación ni códigos de recuperación. No he registrado lo que escribiste. Si tienes problemas de acceso, usa las superficies de identidad.";
    }
    // Frontera 1: intención operativa → declina y remite a la autoridad real.
    if (PROTO_CAPIO_WS_OPERATIVO.test(pregunta)) {
        return "No puedo ejecutar esa operación. Puedo explicarte qué implica y dónde hacerla: las acciones disponibles las determina la BizCap según el estado del registro y tus permisos, no esta conversación.";
    }
    const match = PROTO_CAPIO_WS_RESPUESTAS.find((r) => r.patron.test(pregunta));
    return match ? match.respuesta : PROTO_CAPIO_WS_FALLBACK;
}
function protoInitCapioWorkspace() {
    const form = document.querySelector("[data-capio-ws-form]");
    const input = document.querySelector("#capio-ws-input");
    if (!form || !input)
        return;
    protoCapioWsAgregar(PROTO_CAPIO_WS_BIENVENIDA, "capio");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const pregunta = input.value.trim();
        if (pregunta === "")
            return;
        const esSecreto = protoContieneSecreto(pregunta);
        // Si parece un secreto no se refleja en el hilo: no se registra en ningún lado.
        protoCapioWsAgregar(esSecreto ? "[entrada descartada por seguridad]" : pregunta, "tú");
        protoCapioWsAgregar(protoCapioWsResponder(pregunta), "capio");
        input.value = "";
        input.focus();
    });
}
document.addEventListener("DOMContentLoaded", protoInitCapioWorkspace);
