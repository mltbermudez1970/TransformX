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

type ProtoSpecStatus = "DEFINED" | "PENDING_SOURCE";

interface ProtoScenario {
  scenarioId: string;
  title: string;
  /** Referencia a PROTO_ACTORS. */
  actor: string;
  initialRoute: string;
  fixtureSet: string;
  expectedAvailableActions: ProtoAction[];
  expectedOutcome: string;
  /** Desenlace que devuelve el mock-api para la operación principal. */
  mockOutcome: ProtoOutcomeKind;
  specStatus: ProtoSpecStatus;
  specSource: string;
}

const PROTO_SCENARIOS: ProtoScenario[] = [
  {
    scenarioId: "S-01",
    title: "Complete inquiry",
    actor: "act-001",
    initialRoute: "workspace/my-work/",
    fixtureSet: "fx-complete-inquiry",
    expectedAvailableActions: ["VIEW_LEAD", "START_QUALIFICATION", "VIEW_COMMUNICATIONS"],
    expectedOutcome:
      "La captura está completa: el actor puede iniciar la calificación sin pedir información adicional.",
    mockOutcome: "success",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-02",
    title: "Missing information",
    actor: "act-001",
    initialRoute: "workspace/missing-information/",
    fixtureSet: "fx-missing-information",
    expectedAvailableActions: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION", "VIEW_COMMUNICATIONS"],
    expectedOutcome:
      "Se identifican los campos requeridos ausentes (quantity, unit) frente a los de enriquecimiento, y se puede solicitar la información faltante.",
    mockOutcome: "validation_error",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-03",
    title: "Conflicting update",
    actor: "act-001",
    initialRoute: "workspace/missing-information/",
    fixtureSet: "fx-conflicting-update",
    expectedAvailableActions: ["VIEW_LEAD", "REVIEW_RECEIVED_INFORMATION", "REQUEST_HUMAN_REVIEW"],
    expectedOutcome:
      "MI-03 distingue Canonical Fact, Received Information e AI Interpretation, y permite aceptar, corregir, mantener o escalar.",
    mockOutcome: "business_conflict",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-04",
    title: "Probable duplicate",
    actor: "act-004",
    initialRoute: "workspace/reviews/",
    fixtureSet: "fx-duplicate-review",
    expectedAvailableActions: ["VIEW_LEAD", "OPEN_DUPLICATE_REVIEW", "RESOLVE_DUPLICATE_REVIEW", "REQUEST_MORE_INFORMATION"],
    expectedOutcome:
      "La pregunta es si ambos registros responden a la misma necesidad comercial, no si comparten empresa o contacto. La IA sólo propone el candidato.",
    mockOutcome: "stale",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-05",
    title: "Human review required",
    actor: "act-004",
    initialRoute: "workspace/reviews/",
    fixtureSet: "fx-human-review",
    expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "OPEN_HUMAN_REVIEW", "RESOLVE_HUMAN_REVIEW", "REQUEST_MORE_INFORMATION"],
    expectedOutcome:
      "QD-03 en REVIEW —no FAIL— porque la regla no puede resolverlo sola; el revisor registra resolución y justificación.",
    mockOutcome: "success",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-06",
    title: "Assignment exception",
    actor: "act-003",
    initialRoute: "workspace/assignment/",
    fixtureSet: "fx-assignment-exception",
    expectedAvailableActions: ["VIEW_LEAD", "VIEW_ASSIGNMENT", "RESOLVE_ASSIGNMENT_EXCEPTION", "OVERRIDE_ASSIGNMENT_POLICY"],
    expectedOutcome:
      "No haber responsable elegible es un resultado de negocio, no un error técnico. OVERRIDE_ASSIGNMENT_POLICY sólo para actor autorizado (assignment.override) y exige justificación explícita.",
    mockOutcome: "permission_denied",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-07",
    title: "Qualified not ready",
    actor: "act-001",
    initialRoute: "workspace/opportunity/",
    fixtureSet: "fx-qualified-not-ready",
    expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS"],
    expectedOutcome:
      "Calificado ≠ listo. NO aparece CONVERT_TO_OPPORTUNITY: hay condiciones de readiness sin satisfacer, y la UI enruta al workspace que las resuelve.",
    mockOutcome: "business_conflict",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-08",
    title: "Ready for conversion",
    actor: "act-003",
    initialRoute: "workspace/opportunity/",
    fixtureSet: "fx-ready-for-conversion",
    expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
    expectedOutcome:
      "Readiness satisfecho y permiso opportunity.convert: la conversión se ofrece con confirmación material y envío único.",
    mockOutcome: "success",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-09",
    title: "Stale / concurrent change",
    actor: "act-001",
    initialRoute: "workspace/leads/",
    fixtureSet: "fx-ready-for-conversion",
    expectedAvailableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
    expectedOutcome:
      "El fixture expone inicialmente una acción material; el comando mock devuelve CONCURRENCY_CONFLICT y, tras refrescar, el fixture entrega un nuevo conjunto de availableActions.",
    mockOutcome: "stale",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
  {
    scenarioId: "S-10",
    title: "Auth / MFA recovery",
    actor: "act-001",
    initialRoute: "workspace/system/",
    fixtureSet: "fx-empty",
    // Las acciones de negocio quedan suspendidas hasta restaurar la sesión.
    expectedAvailableActions: [],
    expectedOutcome:
      "Sin sesión o sin nivel de aseguramiento, las acciones de negocio no están disponibles. MFA no es una acción de negocio del Lead.",
    mockOutcome: "recoverable_error",
    specStatus: "DEFINED",
    specSource: "UX-14 Resolution Package §6",
  },
];

function protoGetScenario(scenarioId: string): ProtoScenario | null {
  return PROTO_SCENARIOS.find((scenario) => scenario.scenarioId === scenarioId) ?? null;
}

const PROTO_DEFAULT_SCENARIO_ID = "S-01";
