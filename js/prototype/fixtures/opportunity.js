"use strict";
/**
 * Opportunity Readiness, oportunidad sintética y snapshot inmutable.
 *
 * Fronteras que este fixture materializa:
 *  - QUALIFIED ≠ READY: LEAD-00047 está calificado y NO listo; LEAD-00048 sí.
 *  - El estado global (`READY`/`NOT_READY`/`PENDING`) lo declara el fixture.
 *    El frontend puede contar condiciones satisfechas para presentar, pero NO
 *    deriva el estado autoritativo ni la disponibilidad de convertir.
 *  - `READY` no autoriza por sí solo: `CONVERT_TO_OPPORTUNITY` debe estar
 *    además en `availableActions` del lead.
 *  - `OpportunityReferenceSummary` es UN SOLO modelo, compartido con REV-03.
 *  - El snapshot capturado al convertir es evidencia inmutable.
 *
 * Nota sobre `NOT_SATISFIED`: no se usa en el núcleo RC-01…RC-08. El addendum
 * lo reserva para condiciones informativas o comprobaciones asesoras futuras;
 * una condición obligatoria incumplida se devuelve como `BLOCKING`.
 */
/** Oportunidad abierta preexistente, usada por RC-08 y por REV-03. */
const PROTO_OPEN_OPPORTUNITIES = [
    {
        opportunityId: "OPP-2026-00041",
        opportunityReference: "OPP-2026-00041",
        status: "OPEN",
        sourceLeadId: "LEAD-00041",
        companyId: "COMP-0041",
        companyName: "Andina Textil",
        commercialNeedId: "NEED-0041",
        commercialNeedVersion: 1,
        owner: { userId: "USR-001", displayName: "Ana Ruiz" },
        createdAt: "2026-09-03T14:10:00-05:00",
    },
];
function protoFindOpenOpportunity(ref) {
    return PROTO_OPEN_OPPORTUNITIES.find((o) => o.opportunityReference === ref || o.opportunityId === ref) ?? null;
}
/** Oportunidad abierta para la misma necesidad, o null. La provee el fixture. */
function protoRelatedOpenOpportunity(leadId) {
    const mapa = {
        // LEAD-00044 comparte necesidad con LEAD-00041, que ya tiene oportunidad.
        "LEAD-00044": "OPP-2026-00041",
    };
    const ref = mapa[leadId];
    return ref ? protoFindOpenOpportunity(ref) : null;
}
/* ---------------------------------------------------------------------------
 * Readiness por lead
 * ------------------------------------------------------------------------- */
const PROTO_READINESS_POLICY = "opportunity-readiness-v2";
function protoRc(id, status, summary, evidence = [], route = null, evaluatedAt = "2026-09-05T10:30:00-05:00") {
    const def = protoFindReadinessCondition(id);
    return {
        conditionId: id,
        name: def ? def.name : id,
        status,
        blockingWhenUnsatisfied: true,
        question: def ? def.question : "",
        summary,
        evidence,
        route,
        policy: { policyVersion: PROTO_READINESS_POLICY, evaluatedAt },
    };
}
const PROTO_READINESS = [
    {
        // S-07 — calificado pero NO listo: una revisión abierta bloquea.
        leadId: "LEAD-00047",
        status: "NOT_READY",
        evaluatedAt: "2026-09-05T10:30:00-05:00",
        policyVersion: PROTO_READINESS_POLICY,
        blockingConditionIds: ["RC-07"],
        availableActions: ["VIEW_OPPORTUNITY_READINESS"],
        conditions: [
            protoRc("RC-01", "SATISFIED", "Calificación completada con resultado aceptable.", [{ type: "SYSTEM_ASSESSMENT", ref: "QA-002", label: "Evaluación", value: "PASS v2" }]),
            protoRc("RC-02", "SATISFIED", "Prioridad disponible (Baja, anulación humana registrada).", [{ type: "SYSTEM_ASSESSMENT", ref: "priority-policy-v3", label: "Prioridad", value: "LOW" }]),
            protoRc("RC-03", "SATISFIED", "Responsable comercial asignado.", [{ type: "SYSTEM_ASSESSMENT", ref: "assignment.current", label: "Responsable", value: "Elena Mora" }]),
            protoRc("RC-04", "SATISFIED", "Próximo paso gobernado disponible.", [{ type: "SYSTEM_ASSESSMENT", ref: "nba", label: "NBA", value: "VIEW_OPPORTUNITY_READINESS" }]),
            protoRc("RC-05", "SATISFIED", "Necesidad comercial definida sin ambigüedad material."),
            protoRc("RC-06", "SATISFIED", "Contacto, producto, cantidad, unidad y destino son canónicos.", [{ type: "CANONICAL_FACT", ref: "NEED-0047", label: "Necesidad", value: "versión 2" }]),
            protoRc("RC-07", "BLOCKING", "Hay una revisión de readiness abierta que debe resolverse antes de convertir.", [{ type: "SYSTEM_ASSESSMENT", ref: "WI-0047", label: "WorkItem abierto", value: "OPPORTUNITY_READINESS_REVIEW" }], { routeId: "lab-001-reviews", label: "Resolver la revisión abierta" }),
            protoRc("RC-08", "SATISFIED", "No existe otra oportunidad abierta para esta necesidad."),
        ],
    },
    {
        // S-08 — listo para conversión.
        leadId: "LEAD-00048",
        status: "READY",
        evaluatedAt: "2026-09-05T10:35:00-05:00",
        policyVersion: PROTO_READINESS_POLICY,
        blockingConditionIds: [],
        availableActions: ["VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
        conditions: [
            protoRc("RC-01", "SATISFIED", "Calificación completada; QD-02 cubierto por excepción aprobada.", [{ type: "SYSTEM_ASSESSMENT", ref: "QA-003", label: "Evaluación", value: "PASS v4 (con excepción)" }]),
            protoRc("RC-02", "SATISFIED", "Prioridad alta disponible.", [{ type: "SYSTEM_ASSESSMENT", ref: "priority-policy-v3", label: "Prioridad", value: "HIGH" }]),
            protoRc("RC-03", "SATISFIED", "Responsable comercial asignado.", [{ type: "SYSTEM_ASSESSMENT", ref: "assignment.current", label: "Responsable", value: "Elena Mora" }]),
            protoRc("RC-04", "SATISFIED", "Próximo paso gobernado disponible."),
            protoRc("RC-05", "SATISFIED", "Necesidad comercial definida sin ambigüedad material."),
            protoRc("RC-06", "SATISFIED", "Todos los hechos comerciales requeridos son canónicos.", [{ type: "CANONICAL_FACT", ref: "NEED-0048", label: "Necesidad", value: "versión 3" }]),
            protoRc("RC-07", "SATISFIED", "Sin revisiones ni excepciones bloqueantes pendientes."),
            protoRc("RC-08", "SATISFIED", "No existe otra oportunidad abierta para esta necesidad."),
        ],
    },
    {
        // Evaluación en curso: PENDING en el núcleo bloquea la conversión.
        leadId: "LEAD-00045",
        status: "PENDING",
        evaluatedAt: "2026-09-05T10:20:00-05:00",
        policyVersion: PROTO_READINESS_POLICY,
        blockingConditionIds: ["RC-01"],
        availableActions: ["VIEW_OPPORTUNITY_READINESS"],
        conditions: [
            protoRc("RC-01", "PENDING", "La calificación sigue en evaluación: QD-03 está en revisión humana.", [{ type: "SYSTEM_ASSESSMENT", ref: "QA-001", label: "Evaluación", value: "REVIEW v3" }], { routeId: "lab-001-qualification", label: "Ver calificación" }),
            protoRc("RC-02", "NOT_APPLICABLE", "El score y la prioridad definitivos no aplican mientras la calificación no concluya."),
            protoRc("RC-03", "SATISFIED", "Responsable comercial asignado."),
            protoRc("RC-04", "SATISFIED", "Próximo paso gobernado disponible."),
            protoRc("RC-05", "SATISFIED", "Necesidad comercial definida."),
            protoRc("RC-06", "SATISFIED", "Hechos comerciales requeridos completos."),
            protoRc("RC-07", "PENDING", "Hay una revisión humana abierta cuyo resultado aún no se conoce.", [{ type: "SYSTEM_ASSESSMENT", ref: "HR-0045", label: "Revisión", value: "OPEN" }], { routeId: "lab-001-reviews", label: "Abrir la revisión" }),
            protoRc("RC-08", "SATISFIED", "No existe otra oportunidad abierta para esta necesidad."),
        ],
    },
    {
        // RC-08 bloqueante: ya hay una oportunidad abierta para la misma necesidad.
        leadId: "LEAD-00044",
        status: "NOT_READY",
        evaluatedAt: "2026-09-05T10:25:00-05:00",
        policyVersion: PROTO_READINESS_POLICY,
        blockingConditionIds: ["RC-01", "RC-07", "RC-08"],
        availableActions: ["VIEW_OPPORTUNITY_READINESS"],
        conditions: [
            protoRc("RC-01", "BLOCKING", "La calificación no se ha iniciado para este registro.", [], { routeId: "lab-001-qualification", label: "Ver calificación" }),
            protoRc("RC-02", "NOT_APPLICABLE", "No aplica mientras no exista evaluación de calificación."),
            protoRc("RC-03", "SATISFIED", "Responsable comercial asignado."),
            protoRc("RC-04", "SATISFIED", "Próximo paso gobernado disponible."),
            protoRc("RC-05", "SATISFIED", "Necesidad comercial definida."),
            protoRc("RC-06", "SATISFIED", "Hechos comerciales requeridos completos."),
            protoRc("RC-07", "BLOCKING", "Hay una revisión de duplicado abierta.", [{ type: "SYSTEM_ASSESSMENT", ref: "DR-0044", label: "Revisión", value: "OPEN" }], { routeId: "lab-001-reviews", label: "Abrir la revisión de duplicado" }),
            { ...protoRc("RC-08", "BLOCKING", "Ya existe una oportunidad abierta para la misma necesidad comercial.", [{ type: "SYSTEM_ASSESSMENT", ref: "OPP-2026-00041", label: "Oportunidad", value: "OPEN" }], { routeId: "lab-001-opportunity", params: { opportunityId: "OPP-2026-00041" }, label: "Ver oportunidad existente" }),
                relatedOpportunityRef: "OPP-2026-00041" },
        ],
    },
];
function protoGetReadiness(leadId) {
    return PROTO_READINESS.find((r) => r.leadId === leadId) ?? null;
}
/** Conteo de presentación. No es el estado autoritativo. */
function protoReadinessCounts(r) {
    const total = r.conditions.filter((c) => c.status !== "NOT_APPLICABLE").length;
    const satisfechas = r.conditions.filter((c) => c.status === "SATISFIED").length;
    return { satisfechas, total };
}
/**
 * Oportunidades creadas durante la sesión de prototipo.
 *
 * Se persisten en `sessionStorage`: el prototipo es multipágina, así que el
 * contexto JS se destruye en cada navegación. Sin esto, la oportunidad recién
 * creada desaparecía al pasar de OPP-02 a OPP-03.
 */
const PROTO_CREATED_OPP_KEY = "transformx-prototype-opportunities";
function protoReadCreatedOpportunities() {
    try {
        const raw = sessionStorage.getItem(PROTO_CREATED_OPP_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function protoWriteCreatedOpportunities(list) {
    try {
        sessionStorage.setItem(PROTO_CREATED_OPP_KEY, JSON.stringify(list));
    }
    catch {
        /* sessionStorage no disponible */
    }
}
const PROTO_CREATED_OPPORTUNITIES = protoReadCreatedOpportunities();
function protoBuildSnapshot(r, lead) {
    return {
        snapshotId: `RDS-OPP-2026-${lead.leadId.slice(-5)}`,
        capturedAt: new Date().toISOString(),
        overallStatus: r.status,
        policyVersion: r.policyVersion,
        bizCapDefinitionId: "LAB-001",
        bizCapInstanceId: "BIZCAPINST-DEMO-001",
        configurationVersion: "cfg-17",
        leadId: lead.leadId,
        leadVersion: lead.canonicalVersion,
        commercialNeedId: lead.commercialNeed.commercialNeedId,
        commercialNeedVersion: lead.commercialNeed.version,
        // Se congela el conjunto COMPLETO, no sólo los bloqueadores.
        conditions: r.conditions.map((c) => ({
            conditionId: c.conditionId, name: c.name, status: c.status, summary: c.summary,
            evidenceRefs: c.evidence.map((e) => e.ref),
        })),
        blockingConditionIds: [...r.blockingConditionIds],
    };
}
function protoCreateOpportunity(lead, r) {
    const ops = protoGetLeadOperations(lead.leadId);
    const ref = `OPP-2026-${lead.leadId.slice(-5)}`;
    const opp = {
        opportunityId: ref,
        opportunityReference: ref,
        status: "OPEN",
        sourceLead: { leadId: lead.leadId, leadReference: lead.leadReference },
        company: { companyId: lead.company.companyId, companyName: lead.company.companyName },
        commercialNeed: { commercialNeedId: lead.commercialNeed.commercialNeedId, commercialNeedVersion: lead.commercialNeed.version },
        owner: ops?.commercialOwner ?? { userId: "—", displayName: "Sin asignar" },
        createdAt: new Date().toISOString(),
        readinessSnapshot: protoBuildSnapshot(r, lead),
        nextCommercialStep: {
            code: "QUOTE_PROPOSAL_MANAGEMENT",
            label: "Preparar cotización / propuesta",
            targetCapability: "LAB-002",
            targetCapabilityName: "Quote & Proposal Management",
            route: null,
            status: "HANDOFF_ONLY",
        },
    };
    PROTO_CREATED_OPPORTUNITIES.push(opp);
    protoWriteCreatedOpportunities(PROTO_CREATED_OPPORTUNITIES);
    return opp;
}
function protoFindCreatedOpportunity(leadId) {
    return protoReadCreatedOpportunities().find((o) => o.sourceLead.leadId === leadId) ?? null;
}
/** Permite reiniciar el guion de una sesión de validación. */
function protoResetCreatedOpportunities() {
    try {
        sessionStorage.removeItem(PROTO_CREATED_OPP_KEY);
    }
    catch {
        /* sessionStorage no disponible */
    }
}
/* ---------------------------------------------------------------------------
 * §9 — Actor concurrente de S-09 (dato sintético de escenario)
 * ------------------------------------------------------------------------- */
const PROTO_CONCURRENT_ACTOR = {
    actorType: "HUMAN",
    userId: "USR-SM-002",
    displayName: "Sofía Andrade",
    role: "SALES_MANAGER",
    scenarioPermission: "opportunity.convert",
};
/** availableActions de LEAD-00048 tras la conversión concurrente (§9.3). */
const PROTO_POST_CONFLICT_ACTIONS = [
    "VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT",
    "VIEW_OPPORTUNITY_READINESS", "VIEW_HANDOFF", "VIEW_COMMUNICATIONS",
];
