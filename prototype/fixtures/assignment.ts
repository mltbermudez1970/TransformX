/**
 * ASN-01 Assignment Exception y ASN-02 Assignment History.
 *
 * Separación innegociable (§8.4): `eligibility` es el resultado determinístico
 * de la política; `aiSuggestion` es un objeto APARTE y siempre asesor. Un
 * candidato puede estar recomendado por IA y ser NO ELEGIBLE por política, y la
 * interfaz debe hacer ese conflicto explícito. Nunca se fusionan en un score,
 * insignia o veredicto único.
 *
 * Que no haya responsable elegible es un RESULTADO DE NEGOCIO, no un error
 * técnico: se resuelve enrutando a la cola de Sales Ops.
 *
 * El historial de asignación es inmutable: las correcciones son registros
 * posteriores, nunca ediciones de los anteriores.
 */

interface ProtoPolicyCriterionEvaluation {
  code: ProtoAssignmentPolicyCheck;
  result: ProtoPolicyCriterionResult;
  reason: string | null;
}

interface ProtoAssignmentCandidate {
  candidateId: string;
  displayName: string;
  role: ProtoRole;
  /** Resultado determinístico de la política. Independiente de la IA. */
  eligibility: {
    status: ProtoEligibilityStatus;
    summary: string;
    policyVersion: string;
    evaluatedAt: string;
    criteria: ProtoPolicyCriterionEvaluation[];
  };
  load: { activeLeadCount: number; activeWorkItemCount: number };
  relationship: { namedAccountOwner: boolean; existingRelationship: boolean };
}

interface ProtoAiSuggestion {
  type: "AI_SUGGESTION";
  recommendedCandidateId: string;
  summary: string;
  confidence: number;
  taskRef: string;
  authority: ProtoAiAuthority;
  generatedAt: string;
}

interface ProtoAssignmentException {
  assignmentExceptionId: string;
  workItemId: string;
  leadId: string;
  leadReference: string;
  companyName: string;
  decisionQuestion: string;
  autoAssignmentResult: {
    status: "NO_ELIGIBLE_OWNER" | "COMPLETED" | "REQUIRES_REVIEW";
    reasonCode: string;
    summary: string;
    policyVersion: string;
  };
  candidates: ProtoAssignmentCandidate[];
  /** Objeto separado a propósito: no se mezcla con `eligibility`. */
  aiSuggestion: ProtoAiSuggestion;
  allowedResolutions: string[];
  availableActions: ProtoAction[];
  version: number;
}

const PROTO_ASSIGNMENT_EXCEPTIONS: ProtoAssignmentException[] = [
  {
    assignmentExceptionId: "ASN-0046",
    workItemId: "WI-ASN-0046",
    leadId: "LEAD-00046",
    leadReference: "LD-2026-00046",
    companyName: "Agro Llanos",
    decisionQuestion: "¿Cómo debe resolverse la excepción de asignación de este lead?",
    autoAssignmentResult: {
      status: "NO_ELIGIBLE_OWNER",
      reasonCode: "NO_CANDIDATE_SATISFIED_POLICY",
      summary: "Ningún candidato cumplió todos los criterios de asignación configurados.",
      policyVersion: "assignment-policy-v5",
    },
    candidates: [
      {
        candidateId: "USR-003",
        displayName: "Elena Mora",
        role: "SALES_MANAGER",
        eligibility: {
          status: "INELIGIBLE",
          summary: "No cumple la política territorial configurada.",
          policyVersion: "assignment-policy-v5",
          evaluatedAt: "2026-09-05T10:40:00-05:00",
          criteria: [
            { code: "NAMED_ACCOUNT_OR_EXISTING_RELATIONSHIP", result: "FAIL", reason: "No es dueña nominada de la cuenta ni tiene relación previa." },
            { code: "TERRITORY_ELIGIBILITY", result: "FAIL", reason: "La cuenta está fuera del territorio asignado (AR)." },
            { code: "PRODUCT_SEGMENT_ELIGIBILITY", result: "PASS", reason: null },
            { code: "AVAILABILITY", result: "PASS", reason: null },
            { code: "WORKLOAD", result: "PASS", reason: "Carga activa dentro del rango permitido." },
            { code: "PRIORITY_COMPATIBILITY", result: "NOT_APPLICABLE", reason: "El lead no tiene prioridad asignada." },
          ],
        },
        load: { activeLeadCount: 12, activeWorkItemCount: 5 },
        relationship: { namedAccountOwner: false, existingRelationship: false },
      },
      {
        candidateId: "USR-001",
        displayName: "Ana Ruiz",
        role: "SALES_REPRESENTATIVE",
        eligibility: {
          status: "INELIGIBLE",
          summary: "Disponibilidad insuficiente y fuera del segmento de producto.",
          policyVersion: "assignment-policy-v5",
          evaluatedAt: "2026-09-05T10:40:00-05:00",
          criteria: [
            { code: "NAMED_ACCOUNT_OR_EXISTING_RELATIONSHIP", result: "FAIL", reason: "Sin relación previa con la cuenta." },
            { code: "TERRITORY_ELIGIBILITY", result: "PASS", reason: null },
            { code: "PRODUCT_SEGMENT_ELIGIBILITY", result: "FAIL", reason: "El segmento de envase agrícola no está en su cartera." },
            { code: "AVAILABILITY", result: "FAIL", reason: "Ausencia registrada hasta el 12 de septiembre." },
            { code: "WORKLOAD", result: "PASS", reason: null },
            { code: "PRIORITY_COMPATIBILITY", result: "NOT_APPLICABLE", reason: "El lead no tiene prioridad asignada." },
          ],
        },
        load: { activeLeadCount: 7, activeWorkItemCount: 3 },
        relationship: { namedAccountOwner: false, existingRelationship: false },
      },
      {
        candidateId: "USR-002",
        displayName: "Bruno Salas",
        role: "SALES_OPERATIONS_ANALYST",
        eligibility: {
          status: "UNKNOWN",
          summary: "La configuración territorial de este actor no está resuelta.",
          policyVersion: "assignment-policy-v5",
          evaluatedAt: "2026-09-05T10:40:00-05:00",
          criteria: [
            { code: "NAMED_ACCOUNT_OR_EXISTING_RELATIONSHIP", result: "UNKNOWN", reason: "Sin datos de relación." },
            { code: "TERRITORY_ELIGIBILITY", result: "UNKNOWN", reason: "Territorio no configurado para este rol." },
            { code: "PRODUCT_SEGMENT_ELIGIBILITY", result: "PASS", reason: null },
            { code: "AVAILABILITY", result: "PASS", reason: null },
            { code: "WORKLOAD", result: "PASS", reason: null },
            { code: "PRIORITY_COMPATIBILITY", result: "NOT_APPLICABLE", reason: null },
          ],
        },
        load: { activeLeadCount: 4, activeWorkItemCount: 9 },
        relationship: { namedAccountOwner: false, existingRelationship: false },
      },
    ],
    // Recomienda a Elena Mora, que la POLÍTICA marca como NO ELEGIBLE.
    // El conflicto debe ser explícito en pantalla.
    aiSuggestion: {
      type: "AI_SUGGESTION",
      recommendedCandidateId: "USR-003",
      summary: "Elena Mora presenta experiencia relevante con este segmento en cuentas comparables.",
      confidence: 0.76,
      taskRef: "AI_ASSIGNMENT_ADVISORY",
      authority: "ADVISORY",
      generatedAt: "2026-09-05T10:41:00-05:00",
    },
    allowedResolutions: [
      // ASSIGN y REASSIGN llegan deshabilitadas con motivo visible.
      "ASSIGN_SELECTED_ELIGIBLE_OWNER",
      "REASSIGN_TO_ELIGIBLE_OWNER",
      "OVERRIDE_ASSIGNMENT_POLICY",
      "SEND_TO_SALES_OPS_QUEUE",
      "REQUEST_ASSIGNMENT_REEVALUATION",
    ],
    availableActions: ["VIEW_ASSIGNMENT", "RESOLVE_ASSIGNMENT_EXCEPTION", "OVERRIDE_ASSIGNMENT_POLICY"],
    version: 4,
  },
];

function protoFindAssignmentException(leadId: string): ProtoAssignmentException | null {
  return PROTO_ASSIGNMENT_EXCEPTIONS.find((a) => a.leadId === leadId) ?? null;
}

function protoFindCandidate(exc: ProtoAssignmentException, candidateId: string): ProtoAssignmentCandidate | null {
  return exc.candidates.find((c) => c.candidateId === candidateId) ?? null;
}

/* ---------------------------------------------------------------------------
 * ASN-02 Assignment History — inmutable
 * ------------------------------------------------------------------------- */

interface ProtoAssignmentHistoryRecord {
  assignmentHistoryId: string;
  leadId: string;
  eventType: ProtoAssignmentHistoryEventType;
  occurredAt: string;
  actor: { actorType: "HUMAN" | "SYSTEM_GENERATED"; userId?: string; displayName: string; role?: ProtoRole };
  fromOwner: { userId: string; displayName: string } | null;
  toOwner: { userId: string; displayName: string } | null;
  queue: string | null;
  reasonCode: string;
  rationale: string | null;
  policy?: { policyVersion: string; violatedCriteria?: ProtoAssignmentPolicyCheck[] };
  source: "SYSTEM_POLICY" | "HUMAN_DECISION";
  workItemId?: string;
  evidenceRefs?: string[];
  version: number;
}

const PROTO_ASSIGNMENT_HISTORY: ProtoAssignmentHistoryRecord[] = [
  {
    assignmentHistoryId: "AH-0101",
    leadId: "LEAD-00046",
    eventType: "AUTO_ASSIGNMENT_ATTEMPTED",
    occurredAt: "2026-09-03T17:00:00-05:00",
    actor: { actorType: "SYSTEM_GENERATED", displayName: "Motor de asignación" },
    fromOwner: null, toOwner: null, queue: null,
    reasonCode: "SCHEDULED_AUTO_ASSIGNMENT",
    rationale: null,
    policy: { policyVersion: "assignment-policy-v5" },
    source: "SYSTEM_POLICY",
    version: 1,
  },
  {
    assignmentHistoryId: "AH-0102",
    leadId: "LEAD-00046",
    eventType: "ASSIGNMENT_FAILED_NO_ELIGIBLE_OWNER",
    occurredAt: "2026-09-03T17:02:00-05:00",
    actor: { actorType: "SYSTEM_GENERATED", displayName: "Motor de asignación" },
    fromOwner: null, toOwner: null, queue: null,
    reasonCode: "NO_CANDIDATE_SATISFIED_POLICY",
    rationale: null,
    policy: { policyVersion: "assignment-policy-v5", violatedCriteria: ["TERRITORY_ELIGIBILITY", "AVAILABILITY"] },
    source: "SYSTEM_POLICY",
    workItemId: "WI-ASN-0046",
    version: 1,
  },
  {
    assignmentHistoryId: "AH-0103",
    leadId: "LEAD-00046",
    eventType: "ASSIGNMENT_REEVALUATION_REQUESTED",
    occurredAt: "2026-09-04T09:30:00-05:00",
    actor: { actorType: "HUMAN", userId: "USR-002", displayName: "Bruno Salas", role: "SALES_OPERATIONS_ANALYST" },
    fromOwner: null, toOwner: null, queue: null,
    reasonCode: "AVAILABILITY_CHANGED",
    rationale: "Se actualizó la disponibilidad del equipo tras el regreso de dos representantes.",
    policy: { policyVersion: "assignment-policy-v5" },
    source: "HUMAN_DECISION",
    workItemId: "WI-ASN-0046",
    version: 1,
  },
  // Historial de otro lead, para demostrar reasignación con fromOwner/toOwner.
  {
    assignmentHistoryId: "AH-0090",
    leadId: "LEAD-00047",
    eventType: "OWNER_ASSIGNED",
    occurredAt: "2026-09-02T11:30:00-05:00",
    actor: { actorType: "SYSTEM_GENERATED", displayName: "Motor de asignación" },
    fromOwner: null,
    toOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
    queue: null,
    reasonCode: "TERRITORY_MATCH",
    rationale: null,
    policy: { policyVersion: "assignment-policy-v5" },
    source: "SYSTEM_POLICY",
    version: 1,
  },
  {
    assignmentHistoryId: "AH-0091",
    leadId: "LEAD-00047",
    eventType: "OWNER_REASSIGNED",
    occurredAt: "2026-09-04T08:15:00-05:00",
    actor: { actorType: "HUMAN", userId: "USR-003", displayName: "Elena Mora", role: "SALES_MANAGER" },
    fromOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
    toOwner: { userId: "USR-003", displayName: "Elena Mora" },
    queue: null,
    reasonCode: "ACCOUNT_CONTINUITY",
    rationale: "La cuenta pasa a gestión directa por continuidad comercial del trimestre anterior.",
    policy: { policyVersion: "assignment-policy-v5" },
    source: "HUMAN_DECISION",
    evidenceRefs: ["EVD-ASN-0047-01"],
    version: 1,
  },
];

/** Historial del lead, más recientes primero (convención declarada en la UI). */
function protoGetAssignmentHistory(leadId: string): ProtoAssignmentHistoryRecord[] {
  return PROTO_ASSIGNMENT_HISTORY.filter((h) => h.leadId === leadId).sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );
}

/**
 * Registra un evento nuevo. El historial es inmutable: esto AÑADE, nunca edita.
 * Sólo vive en memoria durante la sesión de prototipo.
 */
function protoAppendAssignmentHistory(record: ProtoAssignmentHistoryRecord): void {
  PROTO_ASSIGNMENT_HISTORY.push(record);
}
