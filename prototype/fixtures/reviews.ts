/**
 * Revisiones gobernadas — REV-02 Human Review y REV-03 Duplicate Review.
 *
 * El conjunto de resoluciones permitidas lo declara ESTE fixture. Ninguna
 * superficie lo construye ni lo filtra con reglas locales: sólo lo renderiza.
 *
 * La aportación de IA es siempre `authority: "ADVISORY"`. Resume evidencia o
 * propone un candidato; nunca resuelve, aprueba ni ejecuta.
 */

/* ---------------------------------------------------------------------------
 * Catálogo de resoluciones (§3, §4.1, §5.1, §7.1)
 * ------------------------------------------------------------------------- */

const PROTO_RESOLUTIONS: Record<string, ProtoAllowedResolution> = {
  /* --- REV-02 Human Review --- */
  CONFIRM_SYSTEM_ASSESSMENT: {
    resolutionId: "RES-HR-01", code: "CONFIRM_SYSTEM_ASSESSMENT",
    label: "Confirmar la evaluación del sistema",
    description: "Confirmas la evaluación gobernada vigente a partir de la evidencia presentada.",
    consequence: "Se conserva el resultado del sistema y la revisión queda resuelta.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "review.resolve", enabled: true, disabledReason: null,
  },
  APPROVE_EXCEPTION: {
    resolutionId: "RES-HR-02", code: "APPROVE_EXCEPTION",
    label: "Aprobar excepción",
    description: "Autorizas una excepción documentada al resultado normal de la regla.",
    consequence: "El resultado original de la regla y su evidencia se conservan; se registra una excepción con tu autoridad y justificación.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "review.resolve", enabled: true, disabledReason: null,
  },
  REJECT_EXCEPTION: {
    resolutionId: "RES-HR-03", code: "REJECT_EXCEPTION",
    label: "Rechazar excepción",
    description: "Declinas la excepción solicitada.",
    consequence: "El resultado gobernado original queda en vigor y la revisión se cierra con la evidencia del rechazo.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "review.resolve", enabled: true, disabledReason: null,
  },
  REQUEST_ADDITIONAL_INFORMATION: {
    resolutionId: "RES-HR-04", code: "REQUEST_ADDITIONAL_INFORMATION",
    label: "Pedir más información",
    description: "No puedes decidir con seguridad y necesitas evidencia adicional.",
    consequence: "Se genera trabajo de seguimiento. La revisión no queda resuelta.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "review.resolve", enabled: true, disabledReason: null,
  },
  RETURN_FOR_REASSESSMENT: {
    resolutionId: "RES-HR-05", code: "RETURN_FOR_REASSESSMENT",
    label: "Devolver para reevaluación",
    description: "La evidencia disponible debe reprocesarse antes de una decisión humana final.",
    consequence: "Vuelve a la ruta de reevaluación gobernada. El nuevo resultado lo calcula la BizCap, no esta pantalla.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "review.resolve", enabled: true, disabledReason: null,
  },

  /* --- REV-03 Duplicate Review --- */
  CONFIRM_DUPLICATE: {
    resolutionId: "RES-DR-01", code: "CONFIRM_DUPLICATE",
    label: "Confirmar duplicado",
    description: "El candidato representa la misma necesidad comercial subyacente.",
    consequence: "Los registros se resolverán como la misma necesidad comercial. Se conserva la procedencia de ambos; ninguna fusión ocurre en el cliente.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: true, permissionRequired: "duplicate_review.resolve", enabled: true, disabledReason: null,
  },
  NOT_A_DUPLICATE: {
    resolutionId: "RES-DR-02", code: "NOT_A_DUPLICATE",
    label: "No es duplicado",
    description: "Los registros representan necesidades comerciales distintas.",
    consequence: "Se limpia la revisión de duplicado para este candidato y ambas necesidades siguen siendo distintas.",
    requiresRationale: true, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "duplicate_review.resolve", enabled: true, disabledReason: null,
  },
  ASSOCIATE_WITH_EXISTING_OPPORTUNITY: {
    resolutionId: "RES-DR-03", code: "ASSOCIATE_WITH_EXISTING_OPPORTUNITY",
    label: "Asociar a una oportunidad abierta",
    description: "Ya existe una oportunidad abierta que representa la misma necesidad.",
    consequence: "El lead se asociará a la oportunidad identificada. NO se cierra como duplicado.",
    requiresRationale: true, requiresAdditionalInput: true,
    additionalInputSchema: { kind: "CANDIDATE", label: "Oportunidad abierta" },
    destructive: false, permissionRequired: "duplicate_review.resolve", enabled: false,
    disabledReason: "Este candidato es un lead, no una oportunidad abierta.",
  },

  /* --- ASN-01 Assignment Exception --- */
  ASSIGN_SELECTED_ELIGIBLE_OWNER: {
    resolutionId: "RES-ASN-01", code: "ASSIGN_SELECTED_ELIGIBLE_OWNER",
    label: "Asignar a un responsable elegible",
    description: "Asignas un candidato marcado como elegible por la evaluación de política.",
    consequence: "La propiedad comercial pasará al responsable elegible seleccionado.",
    requiresRationale: false, requiresAdditionalInput: true,
    additionalInputSchema: { kind: "OWNER", label: "Responsable elegible" },
    destructive: false, permissionRequired: "assignment.assign", enabled: false,
    disabledReason: "La evaluación de política no devolvió ningún candidato elegible.",
  },
  REASSIGN_TO_ELIGIBLE_OWNER: {
    resolutionId: "RES-ASN-02", code: "REASSIGN_TO_ELIGIBLE_OWNER",
    label: "Reasignar a otro responsable elegible",
    description: "Cambias el dueño comercial actual por otro candidato elegible.",
    consequence: "La propiedad comercial cambiará y quedará registrada en el historial de asignación.",
    requiresRationale: true, requiresAdditionalInput: true,
    additionalInputSchema: { kind: "OWNER", label: "Responsable elegible" },
    destructive: false, permissionRequired: "assignment.reassign", enabled: false,
    disabledReason: "Este lead no tiene dueño comercial actual que reasignar.",
  },
  OVERRIDE_ASSIGNMENT_POLICY: {
    resolutionId: "RES-ASN-03", code: "OVERRIDE_ASSIGNMENT_POLICY",
    label: "Anular la política de asignación",
    description: "Como actor autorizado, seleccionas un candidato que la política excluyó.",
    consequence: "El responsable seleccionado NO cumple la política normal. Se registra una excepción autorizada con tu justificación y los criterios incumplidos.",
    requiresRationale: true, requiresAdditionalInput: true,
    additionalInputSchema: { kind: "OWNER", label: "Responsable (no elegible)" },
    destructive: true, permissionRequired: "assignment.override", enabled: true, disabledReason: null,
  },
  SEND_TO_SALES_OPS_QUEUE: {
    resolutionId: "RES-ASN-04", code: "SEND_TO_SALES_OPS_QUEUE",
    label: "Enviar a la cola de Sales Ops",
    description: "No puede asignarse un responsable ahora; se enruta a la cola gobernada de Sales Operations.",
    consequence: "No se asignará dueño comercial ahora. La responsabilidad pasa a la cola de Sales Operations. Es un resultado de negocio, no un error.",
    requiresRationale: false, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "assignment.assign", enabled: true, disabledReason: null,
  },
  REQUEST_ASSIGNMENT_REEVALUATION: {
    resolutionId: "RES-ASN-05", code: "REQUEST_ASSIGNMENT_REEVALUATION",
    label: "Solicitar reevaluación",
    description: "Cambió la disponibilidad, la carga o la configuración: la política debe recalcularse.",
    consequence: "La BizCap devolverá un conjunto de candidatos actualizado. Esta pantalla no recalcula nada.",
    requiresRationale: false, requiresAdditionalInput: false, additionalInputSchema: null,
    destructive: false, permissionRequired: "assignment.read", enabled: true, disabledReason: null,
  },
};

function protoResolution(code: string): ProtoAllowedResolution | null {
  return PROTO_RESOLUTIONS[code] ?? null;
}

/** Resuelve la lista permitida que declara un fixture, en su orden. */
function protoResolveAllowed(codes: string[]): ProtoAllowedResolution[] {
  const out: ProtoAllowedResolution[] = [];
  codes.forEach((c) => {
    const r = protoResolution(c);
    if (r) out.push(r);
  });
  return out;
}

/* ---------------------------------------------------------------------------
 * REV-02 Human Review
 * ------------------------------------------------------------------------- */

interface ProtoAiAssistance {
  type: "AI_EVIDENCE_SUMMARY" | "AI_SIMILARITY" | "AI_SUGGESTION";
  taskId: string;
  summary: string;
  /** Siempre asesora: la IA no decide. */
  authority: ProtoAiAuthority;
  confidence?: number;
  generatedAt?: string;
}

interface ProtoHumanReview {
  reviewId: string;
  workItemId: string;
  reviewType: "HUMAN_REVIEW" | "EXCEPTION_REVIEW";
  status: ProtoWorkItemStatus;
  /** Encabeza la pantalla: la pregunta, no los controles. */
  decisionQuestion: string;
  reason: { code: string; summary: string };
  context: { leadId: string; leadReference: string; companyName: string; criterionId?: ProtoCriterionId };
  policy: { ruleId: string; ruleSummary: string; policyVersion: string };
  evidence: { supporting: ProtoEvidenceItem[]; contradictory: ProtoEvidenceItem[]; missing: ProtoEvidenceItem[] };
  aiAssistance: ProtoAiAssistance;
  /** Autoritativo. La UI no lo construye ni lo filtra. */
  allowedResolutions: string[];
  availableActions: ProtoAction[];
  version: number;
}

const PROTO_HUMAN_REVIEWS: ProtoHumanReview[] = [
  {
    reviewId: "HR-0045",
    workItemId: "WI-HR-0045",
    reviewType: "HUMAN_REVIEW",
    status: "OPEN",
    decisionQuestion: "¿Debe aprobarse una excepción al criterio de volumen comercial mínimo?",
    reason: {
      code: "STRATEGIC_EXCEPTION_REQUIRES_HUMAN_REVIEW",
      summary: "El volumen está por debajo del mínimo configurado y existe una señal estratégica que requiere criterio humano.",
    },
    context: { leadId: "LEAD-00045", leadReference: "LD-2026-00045", companyName: "Servicios Pacífico", criterionId: "QD-03" },
    policy: {
      ruleId: "BDR-002-QD03",
      ruleSummary: "El volumen debe alcanzar el mínimo comercial configurado (1000 kg/mes) o contar con una excepción aprobada.",
      policyVersion: "qualification-policy-v4",
    },
    evidence: {
      supporting: [
        { evidenceId: "EVD-045-01", category: "SUPPORTING", label: "Demanda declarada como recurrente", value: "Mensual", sourceType: "CANONICAL_FACT", sourceRef: "commercialNeed.recurringDemand", observedAt: "2026-09-03T08:02:00-05:00", confidence: null },
        { evidenceId: "EVD-045-02", category: "SUPPORTING", label: "Solicitud para tres sedes", value: "3 sedes declaradas en la consulta", sourceType: "RECEIVED_INFORMATION", observedAt: "2026-09-03T08:02:00-05:00", confidence: null },
      ],
      contradictory: [
        { evidenceId: "EVD-045-03", category: "CONTRADICTORY", label: "Volumen solicitado", value: "800 kg/mes", sourceType: "CANONICAL_FACT", sourceRef: "commercialNeed.quantity", observedAt: "2026-09-03T08:02:00-05:00", confidence: null },
        { evidenceId: "EVD-045-04", category: "CONTRADICTORY", label: "Umbral configurado", value: "1000 kg/mes", sourceType: "POLICY_CONFIGURATION", sourceRef: "qualification-policy-v4", confidence: null },
      ],
      missing: [
        { evidenceId: "EVD-045-05", category: "MISSING", label: "Proyección de volumen a 12 meses", value: "No proporcionada", sourceType: "CANONICAL_FACT", confidence: null },
        { evidenceId: "EVD-045-06", category: "MISSING", label: "Historial de compra previo", value: "Sin registro", sourceType: "HISTORICAL_FACT", confidence: null },
      ],
    },
    aiAssistance: {
      type: "AI_EVIDENCE_SUMMARY", taskId: "AI-T11",
      summary: "El volumen queda un 20 % por debajo del umbral, pero la demanda es recurrente y abarca tres sedes. Falta proyección a 12 meses para dimensionar el potencial.",
      authority: "ADVISORY", confidence: 0.74, generatedAt: "2026-09-04T09:20:00-05:00",
    },
    allowedResolutions: [
      "CONFIRM_SYSTEM_ASSESSMENT", "APPROVE_EXCEPTION", "REJECT_EXCEPTION",
      "REQUEST_ADDITIONAL_INFORMATION", "RETURN_FOR_REASSESSMENT",
    ],
    availableActions: ["RESOLVE_HUMAN_REVIEW", "REQUEST_MORE_INFORMATION"],
    version: 2,
  },
];

function protoFindHumanReview(reviewId: string): ProtoHumanReview | null {
  return PROTO_HUMAN_REVIEWS.find((r) => r.reviewId === reviewId) ?? null;
}

function protoHumanReviewForLead(leadId: string): ProtoHumanReview | null {
  return PROTO_HUMAN_REVIEWS.find((r) => r.context.leadId === leadId) ?? null;
}

/* ---------------------------------------------------------------------------
 * REV-03 Duplicate Review
 * ------------------------------------------------------------------------- */

interface ProtoFieldSimilarity {
  classification: ProtoSimilarityClassification;
  /** Evidencia asesora opcional. Nunca se agrega para decidir. */
  score: number | null;
  source: "AI_SIMILARITY";
}

interface ProtoDuplicateComparisonField {
  field: string;
  label: string;
  current: { value: string | null; sourceType: ProtoEvidenceSourceType };
  candidate: { value: string | null; sourceType: ProtoEvidenceSourceType };
  similarity: ProtoFieldSimilarity;
  /** Aclara que coincidir aquí NO prueba duplicado. */
  contextOnly?: boolean;
}

interface ProtoDuplicateReview {
  reviewId: string;
  workItemId: string;
  decisionQuestion: string;
  currentLeadId: string;
  candidateLeadId: string;
  candidateType: ProtoDuplicateCandidateType;
  candidateStatus: string;
  existingOpportunityRef?: string;
  candidateProposal: ProtoAiAssistance & { recommendation: string; similarityScore: number };
  comparison: ProtoDuplicateComparisonField[];
  allowedResolutions: string[];
  availableActions: ProtoAction[];
  version: number;
}

function protoCmp(
  field: string, label: string, cur: string | null, cand: string | null,
  cls: ProtoSimilarityClassification, score: number | null, contextOnly = false
): ProtoDuplicateComparisonField {
  return {
    field, label,
    current: { value: cur, sourceType: "CANONICAL_FACT" },
    candidate: { value: cand, sourceType: "CANONICAL_FACT" },
    similarity: { classification: cls, score, source: "AI_SIMILARITY" },
    contextOnly,
  };
}

const PROTO_DUPLICATE_REVIEWS: ProtoDuplicateReview[] = [
  {
    reviewId: "DR-0044",
    workItemId: "WI-DR-0044",
    decisionQuestion: "¿LEAD-00044 y LEAD-00041 representan la misma necesidad comercial subyacente?",
    currentLeadId: "LEAD-00044",
    candidateLeadId: "LEAD-00041",
    candidateType: "LEAD",
    candidateStatus: "OPEN",
    candidateProposal: {
      type: "AI_SIMILARITY", taskId: "AI-T05",
      summary: "Coinciden empresa, producto y destino; el canal de entrada difiere.",
      authority: "ADVISORY", confidence: 0.82, generatedAt: "2026-09-05T10:15:00-05:00",
      recommendation: "POSSIBLE_DUPLICATE", similarityScore: 0.87,
    },
    comparison: [
      protoCmp("company", "Empresa", "Andina Textil", "Andina Textil", "MATCH", 1.0, true),
      protoCmp("contact", "Contacto", "Carla Mendez", "Carla Méndez", "PARTIAL_MATCH", 0.94, true),
      protoCmp("productOffering", "Producto / oferta", "Tela poliéster 180 g/m²", "Tela poliéster 180 g/m²", "MATCH", 1.0),
      protoCmp("quantity", "Cantidad", "12000", "12000", "MATCH", 1.0),
      protoCmp("unit", "Unidad", "metros/mes", "metros/mes", "MATCH", 1.0),
      protoCmp("geographyDestination", "Destino", "Quito, EC", "Quito, EC", "MATCH", 1.0),
      protoCmp("recurringDemand", "Demanda recurrente", "MONTHLY", "MONTHLY", "MATCH", 1.0),
      protoCmp("requestedOrRequiredDate", "Fecha requerida", null, null, "UNKNOWN", null),
      protoCmp("specialRequirements", "Requisitos especiales", null, null, "UNKNOWN", null),
      protoCmp("receivedAt", "Recibido", "02 sep 2026 09:12", "01 sep 2026 13:05", "DIFFERENT", 0.0),
      protoCmp("source", "Origen / canal", "EVENT / EVENT_FORM", "WEB / TRANSFORMX_PUBLIC_FORM", "DIFFERENT", 0.0),
    ],
    allowedResolutions: [
      "CONFIRM_DUPLICATE", "NOT_A_DUPLICATE",
      // Visible pero deshabilitada: el candidato es un lead, no una oportunidad.
      "ASSOCIATE_WITH_EXISTING_OPPORTUNITY",
      "REQUEST_ADDITIONAL_INFORMATION",
    ],
    availableActions: ["RESOLVE_DUPLICATE_REVIEW", "REQUEST_MORE_INFORMATION"],
    version: 1,
  },
];

function protoFindDuplicateReview(reviewId: string): ProtoDuplicateReview | null {
  return PROTO_DUPLICATE_REVIEWS.find((r) => r.reviewId === reviewId) ?? null;
}

function protoDuplicateReviewForLead(leadId: string): ProtoDuplicateReview | null {
  return PROTO_DUPLICATE_REVIEWS.find((r) => r.currentLeadId === leadId) ?? null;
}
