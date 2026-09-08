"use strict";
/**
 * Scenarios — catálogo determinístico S-01…S-10 del prototipo autenticado.
 *
 * Fuente de `expectedAvailableActions`: UX-14 Resolution Package v1.0 §6
 * (Scenario Action Baseline). Ya no hay campos `PENDING_SOURCE`: OD-01 está
 * resuelta y estos valores son autoritativos.
 *
 * Recordatorio de frontera: la UI lee las acciones del fixture del lead, no de
 * este catálogo ni del estado del ciclo de vida. `expectedAvailableActions` es
 * la expectativa de validación, no la fuente que consume la interfaz.
 */
const PROTO_SCENARIOS = [
    {
        scenarioId: "S-01",
        title: "Complete inquiry",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/my-work/",
        fixtureSet: "fx-complete-inquiry",
        expectedAvailableActions: ["VIEW_LEAD", "START_QUALIFICATION", "VIEW_COMMUNICATIONS"],
        expectedOutcome: "La captura está completa: el actor puede iniciar la calificación sin pedir información adicional.",
        mockOutcome: "success",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-02",
        title: "Missing information",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/missing-information/",
        fixtureSet: "fx-missing-information",
        expectedAvailableActions: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION", "VIEW_COMMUNICATIONS"],
        expectedOutcome: "Se identifican los campos requeridos ausentes (quantity, unit) frente a los de enriquecimiento, y se puede solicitar la información faltante.",
        mockOutcome: "validation_error",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-03",
        title: "Conflicting update",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/missing-information/",
        fixtureSet: "fx-conflicting-update",
        expectedAvailableActions: ["VIEW_LEAD", "REVIEW_RECEIVED_INFORMATION", "REQUEST_HUMAN_REVIEW"],
        expectedOutcome: "MI-03 distingue Canonical Fact, Received Information e AI Interpretation, y permite aceptar, corregir, mantener o escalar.",
        mockOutcome: "business_conflict",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-04",
        title: "Probable duplicate",
        actor: "act-004",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/reviews/",
        fixtureSet: "fx-duplicate-review",
        expectedAvailableActions: ["VIEW_LEAD", "OPEN_DUPLICATE_REVIEW", "RESOLVE_DUPLICATE_REVIEW", "REQUEST_MORE_INFORMATION"],
        expectedOutcome: "La pregunta es si ambos registros responden a la misma necesidad comercial, no si comparten empresa o contacto. La IA sólo propone el candidato.",
        mockOutcome: "stale",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-05",
        title: "Human review required",
        actor: "act-004",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/reviews/",
        fixtureSet: "fx-human-review",
        expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "OPEN_HUMAN_REVIEW", "RESOLVE_HUMAN_REVIEW", "REQUEST_MORE_INFORMATION"],
        expectedOutcome: "QD-03 en REVIEW —no FAIL— porque la regla no puede resolverlo sola; el revisor registra resolución y justificación.",
        mockOutcome: "success",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-06",
        title: "Assignment exception",
        actor: "act-003",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/assignment/",
        fixtureSet: "fx-assignment-exception",
        expectedAvailableActions: ["VIEW_LEAD", "VIEW_ASSIGNMENT", "RESOLVE_ASSIGNMENT_EXCEPTION", "OVERRIDE_ASSIGNMENT_POLICY"],
        expectedOutcome: "No haber responsable elegible es un resultado de negocio, no un error técnico. OVERRIDE_ASSIGNMENT_POLICY sólo para actor autorizado (assignment.override) y exige justificación explícita.",
        mockOutcome: "permission_denied",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-07",
        title: "Qualified not ready",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/opportunity/",
        fixtureSet: "fx-qualified-not-ready",
        expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS"],
        expectedOutcome: "Calificado ≠ listo. NO aparece CONVERT_TO_OPPORTUNITY: hay condiciones de readiness sin satisfacer, y la UI enruta al workspace que las resuelve.",
        mockOutcome: "business_conflict",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-08",
        title: "Ready for conversion",
        actor: "act-003",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/opportunity/",
        fixtureSet: "fx-ready-for-conversion",
        expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
        expectedOutcome: "Readiness satisfecho y permiso opportunity.convert: la conversión se ofrece con confirmación material y envío único.",
        mockOutcome: "success",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-09",
        title: "Stale / concurrent change",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/leads/",
        fixtureSet: "fx-ready-for-conversion",
        expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
        expectedOutcome: "El fixture expone inicialmente una acción material; el comando mock devuelve CONCURRENCY_CONFLICT y, tras refrescar, el fixture entrega un nuevo conjunto de availableActions.",
        mockOutcome: "stale",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
    {
        scenarioId: "S-10",
        title: "Auth / MFA recovery",
        actor: "act-001",
        tenantId: "tn-novaplast",
        initialRoute: "workspace/system/",
        fixtureSet: "fx-empty",
        // Las acciones de negocio quedan suspendidas hasta restaurar la sesión.
        expectedAvailableActions: [],
        expectedOutcome: "Sin sesión o sin nivel de aseguramiento, las acciones de negocio no están disponibles. MFA no es una acción de negocio del Lead.",
        mockOutcome: "recoverable_error",
        specStatus: "DEFINED",
        specSource: "UX-14 Resolution Package §6",
    },
];
/* ---------------------------------------------------------------------------
 * Journeys de validación de la enmienda TX-UX-MTAC-AMD-001 §11
 * ------------------------------------------------------------------------- */
PROTO_SCENARIOS.push({
    scenarioId: "S-11",
    title: "Multi-Tenant authentication & context switching",
    actor: "act-001",
    // Ana Ruiz pertenece a NovaPlast y a Empresa ABC: al autenticarse pasa por
    // AUTH-13 y, ya dentro, puede conmutar. Se arranca en NovaPlast.
    tenantId: "tn-novaplast",
    initialRoute: "workspace/my-work/",
    fixtureSet: "fx-complete-inquiry",
    expectedAvailableActions: ["VIEW_LEAD", "START_QUALIFICATION", "VIEW_COMMUNICATIONS"],
    expectedOutcome: "VJ-11: la misma identidad tiene tres roles en LAB-001 de NovaPlast y sólo Sales Representative en LAB-001 de Empresa ABC, además de LAB-003. Al conmutar cambian navegación, pendientes, permisos y el contexto de Capio, sin arrastrar nada de la organización anterior.",
    mockOutcome: "success",
    specStatus: "DEFINED",
    specSource: "TX-UX-MTAC-AMD-001 §11 (VJ-11)",
}, {
    scenarioId: "S-12",
    title: "Tenant user access administration",
    actor: "act-003",
    tenantId: "tn-novaplast",
    initialRoute: "workspace/administration/access/",
    fixtureSet: "fx-complete-inquiry",
    // La administración de acceso no es una acción del ciclo de vida del Lead:
    // por eso este escenario no declara availableActions de LAB-001.
    expectedAvailableActions: [],
    expectedOutcome: "VJ-12: Elena Mora administra sólo NovaPlast. Asigna varias BizCaps y varios roles dentro de una misma BizCap, revisa las consecuencias antes de confirmar, atraviesa la verificación adicional y ve el acceso efectivo resultante. Retirar la última administración queda bloqueado.",
    mockOutcome: "success",
    specStatus: "DEFINED",
    specSource: "TX-UX-MTAC-AMD-001 §11 (VJ-12)",
});
function protoGetScenario(scenarioId) {
    return PROTO_SCENARIOS.find((scenario) => scenario.scenarioId === scenarioId) ?? null;
}
const PROTO_DEFAULT_SCENARIO_ID = "S-01";
