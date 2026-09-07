"use strict";
/**
 * Revalidación autoritativa de la conversión (Addendum §8).
 *
 * NO es sólo latencia. Antes de crear la oportunidad, el mock revalida:
 * versión del lead, readiness vigente, oportunidad abierta para la misma
 * necesidad, responsable actual, trabajo bloqueante y disponibilidad de la
 * acción. Devuelve uno de siete desenlaces autoritativos.
 *
 * Distinción central: un conflicto de negocio (la situación cambió) NO es un
 * error técnico (algo falló). Se comunican distinto y ofrecen salidas distintas.
 *
 * `?revalidate=<código>` fuerza una rama concreta para la sesión de validación.
 */
/** Rama de revalidación forzada por URL, para recorrer los desenlaces. */
function protoForcedRevalidation() {
    return protoUrlParam("revalidate");
}
/** Readiness alternativo devuelto cuando la revalidación detecta cambio. */
function protoReadinessChangedFor(leadId) {
    const base = protoGetReadiness(leadId);
    if (!base)
        return null;
    const rc07 = base.conditions.find((c) => c.conditionId === "RC-07");
    return {
        ...base,
        status: "NOT_READY",
        blockingConditionIds: ["RC-07"],
        availableActions: ["VIEW_OPPORTUNITY_READINESS"],
        conditions: base.conditions.map((c) => c.conditionId === "RC-07"
            ? {
                ...(rc07 ?? c),
                status: "BLOCKING",
                summary: "Se abrió una revisión humana que debe resolverse antes de convertir.",
                route: { routeId: "lab-001-reviews", label: "Abrir la revisión" },
            }
            : c),
    };
}
/**
 * Ejecuta la revalidación y, si procede, crea la oportunidad sintética.
 * La clave de idempotencia es el par comando + lead.
 */
async function protoRevalidateAndConvert(lead) {
    const key = `CONVERT_TO_OPPORTUNITY:${lead.leadId}`;
    const previo = protoFindApplied(key);
    const readiness = protoGetReadiness(lead.leadId);
    const forzado = protoForcedRevalidation();
    // Latencia de la revalidación.
    await protoMockRequest({ operationId: "opportunity.revalidate", outcome: "success", latencyMs: 850 });
    // --- Reintento idempotente con la misma clave: devuelve lo existente ---
    const yaCreada = protoFindCreatedOpportunity(lead.leadId);
    if (previo && yaCreada) {
        return {
            result: "IDEMPOTENT_SUCCESS",
            message: "Esta conversión ya se había aplicado. Se devuelve la oportunidad existente; no se creó otra.",
            refreshRequired: false, retryAllowed: false,
            opportunity: yaCreada,
        };
    }
    // --- Ramas forzadas para la sesión de validación ---
    if (forzado === "ALREADY_CONVERTED_BY_OTHER") {
        // S-09: otro actor autorizado convirtió primero.
        return {
            result: "CONCURRENCY_CONFLICT",
            conflictCode: "ALREADY_CONVERTED_BY_OTHER",
            message: "Otro usuario convirtió este lead mientras trabajabas.",
            refreshRequired: true, retryAllowed: false,
            latestLeadVersion: lead.canonicalVersion + 2,
            availableActions: PROTO_POST_CONFLICT_ACTIONS,
            changedBy: { displayName: PROTO_CONCURRENT_ACTOR.displayName, role: PROTO_CONCURRENT_ACTOR.role },
            changedAt: "2026-09-05T11:04:00-05:00",
            existingOpportunity: { opportunityReference: `OPP-2026-${lead.leadId.slice(-5)}`, status: "OPEN" },
        };
    }
    if (forzado === "READINESS_CHANGED") {
        const nuevo = protoReadinessChangedFor(lead.leadId);
        return {
            result: "BUSINESS_CONFLICT",
            conflictCode: "READINESS_CHANGED",
            message: "La preparación de oportunidad cambió y la conversión no puede continuar.",
            refreshRequired: true, retryAllowed: false,
            latestLeadVersion: lead.canonicalVersion + 1,
            availableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "OPEN_HUMAN_REVIEW"],
            readiness: nuevo ?? undefined,
        };
    }
    if (forzado === "OPEN_OPPORTUNITY_ALREADY_EXISTS") {
        const existente = protoRelatedOpenOpportunity(lead.leadId) ?? PROTO_OPEN_OPPORTUNITIES[0];
        return {
            result: "BUSINESS_CONFLICT",
            conflictCode: "OPEN_OPPORTUNITY_ALREADY_EXISTS",
            message: "Ya existe una oportunidad abierta para la misma necesidad comercial.",
            refreshRequired: true, retryAllowed: false,
            availableActions: ["VIEW_LEAD", "VIEW_OPPORTUNITY_READINESS"],
            existingOpportunity: existente
                ? { opportunityReference: existente.opportunityReference, status: existente.status }
                : undefined,
        };
    }
    if (forzado === "RECOVERABLE_ERROR") {
        return {
            result: "RECOVERABLE_ERROR",
            message: "No pudimos completar la conversión por un problema temporal.",
            refreshRequired: false, retryAllowed: true,
            referenceId: "req-conv-0001",
        };
    }
    if (forzado === "CRITICAL_ERROR") {
        return {
            result: "CRITICAL_ERROR",
            message: "Ocurrió un error que requiere intervención antes de continuar.",
            refreshRequired: false, retryAllowed: false,
            referenceId: "ERR-UX14-0006",
        };
    }
    // --- Revalidación real contra el estado vigente ---
    if (!readiness || readiness.status !== "READY") {
        return {
            result: "BUSINESS_CONFLICT",
            conflictCode: "READINESS_CHANGED",
            message: "La preparación de oportunidad no permite convertir en este momento.",
            refreshRequired: true, retryAllowed: false,
            readiness: readiness ?? undefined,
            availableActions: readiness?.availableActions,
        };
    }
    if (!lead.availableActions.includes("CONVERT_TO_OPPORTUNITY")) {
        return {
            result: "BUSINESS_CONFLICT",
            conflictCode: "READINESS_CHANGED",
            message: "La acción de conversión ya no está disponible para este lead.",
            refreshRequired: true, retryAllowed: false,
            availableActions: lead.availableActions,
        };
    }
    if (protoRelatedOpenOpportunity(lead.leadId)) {
        const ex = protoRelatedOpenOpportunity(lead.leadId);
        return {
            result: "BUSINESS_CONFLICT",
            conflictCode: "OPEN_OPPORTUNITY_ALREADY_EXISTS",
            message: "Ya existe una oportunidad abierta para la misma necesidad comercial.",
            refreshRequired: true, retryAllowed: false,
            existingOpportunity: ex ? { opportunityReference: ex.opportunityReference, status: ex.status } : undefined,
        };
    }
    // --- Éxito: se crea la oportunidad y se congela el snapshot ---
    const opp = protoCreateOpportunity(lead, readiness);
    protoRecordApplied(key, opp.opportunityReference);
    return {
        result: "SUCCESS",
        message: "Conversión aplicada.",
        refreshRequired: false, retryAllowed: false,
        opportunity: opp,
    };
}
