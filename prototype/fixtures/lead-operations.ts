/**
 * Capa operacional del Lead — Priority, NBA y propiedad comercial.
 *
 * Vive SEPARADA de `PROTO_CANONICAL_LEADS` a propósito: Priority, Score,
 * Qualification y NBA **no son Canonical Facts** del Lead (Resolution Package
 * §10, Addendum §2). El row model los compone para presentarlos juntos, pero
 * el dato canónico no se contamina con resultados de política.
 *
 * Todo lo de aquí lo provee el fixture/mock API. El frontend no calcula
 * prioridad, NBA, propiedad comercial ni conteo de trabajo abierto.
 */

interface ProtoLeadOperations {
  leadId: string;
  priority: ProtoPriority;
  nextBestAction: ProtoNba;
  commercialOwner: { userId: string; displayName: string } | null;
  /** Resumen provisto por el fixture. El frontend NO calcula readiness. */
  readinessSummary?: string;
  /** Resumen de asignación; el flujo de excepción llega en PM-UX14-05. */
  assignmentSummary?: string;
}

const PROTO_LEAD_OPERATIONS: ProtoLeadOperations[] = [
  {
    leadId: "LEAD-00041",
    priority: {
      code: "MEDIUM", label: PROTO_PRIORITY_LABEL.MEDIUM,
      reasonSummary: "Necesidad comercial completa; sin obligaciones abiertas.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-01T13:06:00-05:00",
    },
    nextBestAction: {
      actionCode: "START_QUALIFICATION", label: "Iniciar calificación",
      rationale: "La captura está completa: se puede evaluar la calificación.",
      source: "SYSTEM_POLICY", confidence: null,
      targetRoute: "workspace/qualification/?leadId=LEAD-00041",
      generatedAt: "2026-09-01T13:06:00-05:00",
    },
    commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
  },
  {
    leadId: "LEAD-00042",
    priority: {
      code: "HIGH", label: PROTO_PRIORITY_LABEL.HIGH,
      reasonSummary: "Cliente con necesidad comercial incompleta y obligación vencida próxima.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-04T15:20:00-05:00",
    },
    nextBestAction: {
      actionCode: "REQUEST_MISSING_INFORMATION", label: "Solicitar información faltante",
      rationale: "Faltan cantidad y unidad para continuar la calificación.",
      source: "SYSTEM_POLICY", confidence: null,
      relatedWorkItemId: "WI-0042",
      targetRoute: "workspace/missing-information/?leadId=LEAD-00042&workItemId=WI-0042",
      generatedAt: "2026-09-04T15:21:00-05:00",
    },
    commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
  },
  {
    leadId: "LEAD-00043",
    priority: {
      code: "HIGH", label: PROTO_PRIORITY_LABEL.HIGH,
      reasonSummary: "Información recibida en conflicto con el dato canónico.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-04T16:13:00-05:00",
    },
    nextBestAction: {
      actionCode: "REVIEW_RECEIVED_INFORMATION", label: "Revisar información recibida",
      rationale: "El cliente informó 25 000 unidades; el valor canónico es 10 000.",
      source: "SYSTEM_POLICY", confidence: null,
      relatedWorkItemId: "WI-0043",
      targetRoute: "workspace/missing-information/?leadId=LEAD-00043&workItemId=WI-0043&view=received",
      generatedAt: "2026-09-04T16:13:00-05:00",
    },
    commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
  },
  {
    leadId: "LEAD-00044",
    priority: {
      code: "MEDIUM", label: PROTO_PRIORITY_LABEL.MEDIUM,
      reasonSummary: "Candidato a duplicado pendiente de revisión gobernada.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-02T09:13:00-05:00",
    },
    nextBestAction: {
      actionCode: "NO_ACTION_REQUIRED", label: "Sin acción inmediata recomendada",
      rationale: "La resolución del duplicado corresponde a la superficie de revisiones.",
      source: "SYSTEM_POLICY", confidence: null,
      generatedAt: "2026-09-02T09:13:00-05:00",
    },
    commercialOwner: { userId: "USR-002", displayName: "Bruno Salas" },
  },
  {
    leadId: "LEAD-00045",
    priority: {
      code: "MEDIUM", label: PROTO_PRIORITY_LABEL.MEDIUM,
      reasonSummary: "Un criterio duro quedó en revisión humana.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-03T10:41:00-05:00",
    },
    nextBestAction: {
      actionCode: "REQUEST_HUMAN_REVIEW", label: "Solicitar revisión humana",
      rationale: "QD-03 requiere criterio humano: el volumen está bajo el umbral configurado.",
      // Sugerencia de IA: se etiqueta como tal y nunca como decisión del sistema.
      source: "AI_RECOMMENDATION", confidence: 0.82,
      relatedWorkItemId: "WI-0045",
      targetRoute: "workspace/qualification/?leadId=LEAD-00045",
      generatedAt: "2026-09-04T09:16:00-05:00",
    },
    commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
  },
  {
    leadId: "LEAD-00046",
    priority: {
      code: "NOT_SET", label: PROTO_PRIORITY_LABEL.NOT_SET,
      reasonSummary: "Sin responsable asignado: la política de prioridad aún no aplica.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-03T17:02:00-05:00",
    },
    nextBestAction: {
      actionCode: "NO_ACTION_REQUIRED", label: "Sin acción inmediata recomendada",
      rationale: "La excepción de asignación se resuelve en su propia superficie.",
      source: "SYSTEM_POLICY", confidence: null,
      relatedWorkItemId: "WI-0046",
      generatedAt: "2026-09-03T17:02:00-05:00",
    },
    commercialOwner: null,
    assignmentSummary: "La asignación automática no encontró responsable elegible (excepción; se resuelve en PM-UX14-05).",
  },
  {
    leadId: "LEAD-00047",
    priority: {
      code: "LOW", label: PROTO_PRIORITY_LABEL.LOW,
      reasonSummary: "Calificado, con una condición de readiness pendiente y sin urgencia declarada.",
      source: "HUMAN_OVERRIDE", policyVersion: "priority-policy-v3", computedAt: "2026-09-04T08:20:00-05:00",
      override: { actor: "Elena Mora — Sales Manager", at: "2026-09-04T08:20:00-05:00", rationale: "El cliente pidió retomar el próximo trimestre." },
    },
    nextBestAction: {
      actionCode: "VIEW_OPPORTUNITY_READINESS", label: "Ver readiness de oportunidad",
      rationale: "Calificado no es lo mismo que listo: hay una condición sin satisfacer.",
      source: "SYSTEM_POLICY", confidence: null,
      relatedWorkItemId: "WI-0047",
      targetRoute: "workspace/opportunity/?leadId=LEAD-00047",
      generatedAt: "2026-09-04T08:11:00-05:00",
    },
    commercialOwner: { userId: "USR-003", displayName: "Elena Mora" },
    readinessSummary: "Calificado, pero una condición de readiness sigue sin satisfacerse: la conversión no está disponible.",
    assignmentSummary: "Asignado por política estándar de territorio.",
  },
  {
    leadId: "LEAD-00048",
    priority: {
      code: "HIGH", label: PROTO_PRIORITY_LABEL.HIGH,
      reasonSummary: "Listo para conversión con fecha requerida declarada.",
      source: "SYSTEM_POLICY", policyVersion: "priority-policy-v3", computedAt: "2026-09-04T09:31:00-05:00",
    },
    nextBestAction: {
      actionCode: "VIEW_OPPORTUNITY_READINESS", label: "Ver readiness de oportunidad",
      rationale: "Todas las condiciones de readiness están satisfechas.",
      source: "SYSTEM_POLICY", confidence: null,
      targetRoute: "workspace/opportunity/?leadId=LEAD-00048",
      generatedAt: "2026-09-04T09:31:00-05:00",
    },
    commercialOwner: { userId: "USR-003", displayName: "Elena Mora" },
    readinessSummary: "Todas las condiciones de readiness están satisfechas.",
    assignmentSummary: "Asignado por política estándar de territorio.",
  },
];

function protoGetLeadOperations(leadId: string): ProtoLeadOperations | null {
  return PROTO_LEAD_OPERATIONS.find((o) => o.leadId === leadId) ?? null;
}

/* ---------------------------------------------------------------------------
 * §6.3 — Row model de Leads List / My Leads
 * Compone dato canónico + operación + calificación + trabajo abierto.
 * ------------------------------------------------------------------------- */

interface ProtoLeadRow {
  leadId: string;
  leadReference: string;
  companyName: string;
  contactName: string;
  productOffering: string | null;
  quantityUnit: string | null;
  lifecycleState: ProtoLeadState;
  qualificationSummary: string;
  priority: ProtoPriority;
  nextBestAction: ProtoNba;
  commercialOwner: { userId: string; displayName: string } | null;
  openWorkCount: number;
  updatedAt: string;
  availableActions: ProtoAction[];
}

function protoLeadRow(leadId: string): ProtoLeadRow | null {
  const lead = protoFindLead(leadId);
  if (!lead) return null;
  const ops = protoGetLeadOperations(leadId);
  const qual = protoGetQualification(leadId);
  const n = lead.commercialNeed;

  const cantidad =
    n.quantity.status === "CANONICAL" && n.unit.status === "CANONICAL"
      ? `${String(n.quantity.value)} ${String(n.unit.value)}`
      : null;

  return {
    leadId: lead.leadId,
    leadReference: lead.leadReference,
    companyName: lead.company.companyName,
    contactName: lead.contact.fullName,
    productOffering: n.productOffering.status === "CANONICAL" ? n.productOffering.value : null,
    quantityUnit: cantidad,
    lifecycleState: lead.lifecycleState,
    qualificationSummary: qual
      ? `${PROTO_CRITERION_STATUS_LABEL[qual.overallStatus]} (${qual.assessmentId})`
      : "Sin evaluación",
    priority: ops ? ops.priority : { code: "NOT_SET", label: PROTO_PRIORITY_LABEL.NOT_SET, source: "SYSTEM_POLICY" },
    nextBestAction: ops
      ? ops.nextBestAction
      : { actionCode: "NO_ACTION_REQUIRED", label: "Sin acción inmediata recomendada", rationale: "", source: "SYSTEM_POLICY", confidence: null, generatedAt: lead.updatedAt },
    commercialOwner: ops?.commercialOwner ?? null,
    openWorkCount: protoCountOpenWork(leadId),
    updatedAt: lead.updatedAt,
    availableActions: lead.availableActions,
  };
}

/* ---------------------------------------------------------------------------
 * §6 — LEAD-02 My Leads: vista guardada de sistema, relativa al actor
 * ------------------------------------------------------------------------- */

interface ProtoSavedView {
  savedViewId: string;
  name: string;
  entityType: "LEAD";
  /** Definida por el sistema: no se borra ni se altera su predicado base. */
  systemOwned: boolean;
  actorRelative: boolean;
  basePredicate: { commercialOwner: "CURRENT_USER" } | Record<string, never>;
  defaultFilters: { lifecycleStates: ProtoLeadState[] };
  defaultSort: { field: string; direction: "ASC" | "DESC" }[];
}

const PROTO_SAVED_VIEWS: ProtoSavedView[] = [
  {
    savedViewId: "LEADS_ALL",
    name: "Todos los leads",
    entityType: "LEAD",
    systemOwned: true,
    actorRelative: false,
    basePredicate: {},
    defaultFilters: {
      lifecycleStates: ["CAPTURED", "NEEDS_INFORMATION", "DUPLICATE_REVIEW", "UNDER_QUALIFICATION", "QUALIFIED"],
    },
    defaultSort: [{ field: "priority", direction: "DESC" }, { field: "updatedAt", direction: "DESC" }],
  },
  {
    savedViewId: "LEADS_MY_OWNED",
    name: "Mis leads",
    entityType: "LEAD",
    systemOwned: true,
    actorRelative: true,
    // My Leads = propiedad comercial del actor. NO es My Work.
    basePredicate: { commercialOwner: "CURRENT_USER" },
    defaultFilters: {
      // Los estados terminales quedan fuera por defecto.
      lifecycleStates: ["CAPTURED", "NEEDS_INFORMATION", "DUPLICATE_REVIEW", "UNDER_QUALIFICATION", "QUALIFIED"],
    },
    defaultSort: [{ field: "priority", direction: "DESC" }, { field: "updatedAt", direction: "DESC" }],
  },
];

function protoGetSavedView(savedViewId: string): ProtoSavedView | null {
  return PROTO_SAVED_VIEWS.find((v) => v.savedViewId === savedViewId) ?? null;
}

/**
 * Resuelve las filas de una vista guardada. La propiedad comercial la aporta
 * el fixture: no se infiere del assignee del WorkItem.
 */
function protoResolveSavedView(
  savedViewId: string,
  currentUserId: string,
  filtros?: { lifecycleStates?: ProtoLeadState[] },
  orden?: { field: string; direction: "ASC" | "DESC" }[]
): ProtoLeadRow[] {
  const view = protoGetSavedView(savedViewId);
  if (!view) return [];

  const estados = filtros?.lifecycleStates ?? view.defaultFilters.lifecycleStates;
  const sort = orden ?? view.defaultSort;

  const filas: ProtoLeadRow[] = [];
  PROTO_CANONICAL_LEADS.forEach((lead) => {
    const row = protoLeadRow(lead.leadId);
    if (!row) return;
    if (view.actorRelative && row.commercialOwner?.userId !== currentUserId) return;
    if (!estados.includes(row.lifecycleState)) return;
    filas.push(row);
  });

  const primero = sort[0];
  if (primero) {
    filas.sort((a, b) => {
      let cmp = 0;
      if (primero.field === "priority") {
        cmp = PROTO_PRIORITY_ORDER[a.priority.code] - PROTO_PRIORITY_ORDER[b.priority.code];
        // DESC en prioridad = las más altas primero.
        if (primero.direction === "ASC") cmp = -cmp;
      } else if (primero.field === "updatedAt") {
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        if (primero.direction === "DESC") cmp = -cmp;
      }
      if (cmp !== 0) return cmp;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }
  return filas;
}
