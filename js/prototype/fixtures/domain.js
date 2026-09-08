"use strict";
/**
 * Vocabulario de dominio autoritativo — UX-14 Resolution Package v1.0.
 *
 * Fuente: "TransformX UX-14 Resolution Package", secciones 2, 3, 4, 5, 7 y 8.
 * Este archivo NO inventa reglas: transcribe el vocabulario aprobado para que
 * los fixtures y las superficies lo consuman como dato.
 *
 * FRONTERA INNEGOCIABLE
 * El frontend NO calcula el resultado global de calificación, NO infiere
 * transiciones del ciclo de vida y NO reconstruye `availableActions` a partir
 * del estado. Esos valores llegan desde fixture/mock API.
 */
const PROTO_QD_CRITERIA = [
    {
        id: "QD-01",
        key: "PRODUCT_FIT",
        name: "Product Fit",
        businessQuestion: "¿El producto u oferta solicitada está dentro de lo soportado por la BizCap Instance configurada?",
        nature: "HARD",
    },
    {
        id: "QD-02",
        key: "GEOGRAPHY_FIT",
        name: "Geography Fit",
        businessQuestion: "¿La geografía o destino solicitado está dentro de la cobertura configurada?",
        nature: "HARD",
    },
    {
        id: "QD-03",
        key: "MINIMUM_COMMERCIAL_VOLUME",
        name: "Minimum Commercial Volume",
        businessQuestion: "¿La cantidad o volumen alcanza el umbral comercial mínimo configurado?",
        nature: "HARD",
    },
    {
        id: "QD-04",
        key: "CONTACTABILITY",
        name: "Contactability",
        businessQuestion: "¿Hay información suficiente para contactar al prospecto o cliente?",
        nature: "HARD",
    },
    {
        id: "QD-05",
        key: "COMMERCIAL_INTENT",
        name: "Commercial Intent",
        businessQuestion: "¿La solicitud representa una intención comercial real y accionable?",
        nature: "HARD",
    },
];
function protoFindCriterion(id) {
    return PROTO_QD_CRITERIA.find((c) => c.id === id) ?? null;
}
/** Etiquetas de UI. El estado NO se comunica sólo por color (WCAG 1.4.1). */
const PROTO_CRITERION_STATUS_LABEL = {
    PASS: "Cumple",
    FAIL: "No cumple",
    PENDING: "Pendiente",
    REVIEW: "Requiere revisión",
    EXCEPTION: "Excepción aprobada",
};
/**
 * Distinción semántica crítica que la UI debe hacer explícita.
 * FAIL no es un error técnico. EXCEPTION no equivale a PASS: conserva la
 * evaluación y la evidencia originales y añade evidencia de autoridad aparte.
 */
const PROTO_CRITERION_STATUS_MEANING = {
    PASS: "La regla configurada se satisface.",
    FAIL: "La regla configurada no se satisface. Es un resultado de negocio, no una falla técnica.",
    PENDING: "Aún no hay información suficiente para evaluar el criterio.",
    REVIEW: "La regla no puede resolverlo por sí sola: requiere criterio humano.",
    EXCEPTION: "Una autoridad aprobó una excepción. Se conserva la evaluación original y su evidencia; la autorización se registra por separado.",
};
const PROTO_LEAD_STATE_MEANING = {
    RECEIVED: "Consulta comercial recibida; aún no capturada por completo como Lead operativo.",
    CAPTURED: "Lead creado y disponible para evaluación inicial.",
    NEEDS_INFORMATION: "Falta información requerida para continuar la calificación.",
    DUPLICATE_REVIEW: "Un candidato probable a duplicado requiere revisión gobernada.",
    UNDER_QUALIFICATION: "La calificación se está evaluando activamente.",
    QUALIFIED: "Los criterios duros se cumplen o están cubiertos por excepciones aprobadas. El Lead todavía puede NO estar listo para Oportunidad.",
    DISQUALIFIED: "Ocurrió una descalificación comercial formal.",
    CONVERTED: "Se creó una Oportunidad calificada y LAB-001 completó su handoff.",
    CLOSED: "Cerrado por motivos distintos de la descalificación: sin respuesta, cliente desistió o duplicado resuelto.",
};
const PROTO_LEAD_STATE_LABEL = {
    RECEIVED: "Recibido",
    CAPTURED: "Capturado",
    NEEDS_INFORMATION: "Falta información",
    DUPLICATE_REVIEW: "Revisión de duplicado",
    UNDER_QUALIFICATION: "En calificación",
    QUALIFIED: "Calificado",
    DISQUALIFIED: "Descalificado",
    CONVERTED: "Convertido",
    CLOSED: "Cerrado",
};
const PROTO_ACTIONS = [
    { id: "VIEW_LEAD", label: "Ver lead", group: "lead", material: false, destructive: false },
    { id: "EDIT_LEAD_INFORMATION", label: "Editar información", group: "lead", material: true, destructive: false },
    { id: "REQUEST_MISSING_INFORMATION", label: "Solicitar información faltante", group: "lead", material: true, destructive: false },
    { id: "REVIEW_RECEIVED_INFORMATION", label: "Revisar información recibida", group: "lead", material: false, destructive: false },
    { id: "START_QUALIFICATION", label: "Iniciar calificación", group: "qualification", material: true, destructive: false },
    { id: "VIEW_QUALIFICATION", label: "Ver calificación", group: "qualification", material: false, destructive: false },
    { id: "VIEW_QUALIFICATION_CRITERION", label: "Ver criterio", group: "qualification", material: false, destructive: false },
    { id: "REASSESS_QUALIFICATION", label: "Reevaluar calificación", group: "qualification", material: true, destructive: false },
    { id: "REQUEST_HUMAN_REVIEW", label: "Solicitar revisión humana", group: "qualification", material: true, destructive: false },
    { id: "OPEN_HUMAN_REVIEW", label: "Abrir revisión humana", group: "review", material: false, destructive: false },
    { id: "RESOLVE_HUMAN_REVIEW", label: "Resolver revisión", group: "review", material: true, destructive: false },
    { id: "OPEN_DUPLICATE_REVIEW", label: "Abrir revisión de duplicado", group: "review", material: false, destructive: false },
    { id: "RESOLVE_DUPLICATE_REVIEW", label: "Resolver duplicado", group: "review", material: true, destructive: false },
    { id: "REQUEST_MORE_INFORMATION", label: "Pedir más información", group: "review", material: true, destructive: false },
    { id: "VIEW_ASSIGNMENT", label: "Ver asignación", group: "assignment", material: false, destructive: false },
    { id: "ASSIGN_OWNER", label: "Asignar responsable", group: "assignment", material: true, destructive: false },
    { id: "REASSIGN_OWNER", label: "Reasignar responsable", group: "assignment", material: true, destructive: false },
    { id: "RESOLVE_ASSIGNMENT_EXCEPTION", label: "Resolver excepción de asignación", group: "assignment", material: true, destructive: false },
    { id: "OVERRIDE_ASSIGNMENT_POLICY", label: "Anular política de asignación", group: "assignment", material: true, destructive: true },
    { id: "VIEW_OPPORTUNITY_READINESS", label: "Ver readiness", group: "opportunity", material: false, destructive: false },
    { id: "CONVERT_TO_OPPORTUNITY", label: "Convertir a oportunidad", group: "opportunity", material: true, destructive: false },
    { id: "VIEW_HANDOFF", label: "Ver handoff", group: "opportunity", material: false, destructive: false },
    { id: "DISQUALIFY_LEAD", label: "Descalificar lead", group: "terminal", material: true, destructive: true },
    { id: "CLOSE_LEAD", label: "Cerrar lead", group: "terminal", material: true, destructive: true },
    { id: "REOPEN_LEAD", label: "Reabrir lead", group: "terminal", material: true, destructive: false },
    { id: "REQUALIFY_LEAD", label: "Recalificar lead", group: "terminal", material: true, destructive: false },
    { id: "VIEW_COMMUNICATIONS", label: "Ver comunicaciones", group: "communication", material: false, destructive: false },
    { id: "CREATE_COMMUNICATION_DRAFT", label: "Crear borrador", group: "communication", material: false, destructive: false },
    { id: "SEND_INFORMATION_REQUEST", label: "Enviar solicitud de información", group: "communication", material: true, destructive: false },
    { id: "RETRY_COMMUNICATION", label: "Reintentar envío", group: "communication", material: true, destructive: false },
    // Asesoría: nunca representa un comando de negocio.
    { id: "ASK_CAPIO", label: "Preguntar a Capio", group: "advisory", material: false, destructive: false },
];
function protoFindAction(id) {
    return PROTO_ACTIONS.find((a) => a.id === id) ?? null;
}
function protoActionLabel(id) {
    return protoFindAction(id)?.label ?? id;
}
/**
 * 5 — Línea base de acciones por estado.
 *
 * ⚠️ ESTO ES DOCUMENTACIÓN PARA *AUTORAR FIXTURES*, NO LÓGICA DE UI.
 * Ninguna superficie puede llamar a esta constante para derivar acciones: dos
 * leads QUALIFIED pueden exponer acciones distintas porque difieren readiness,
 * permisos, revisiones o condiciones de política. La UI lee exclusivamente el
 * array `availableActions` que trae el fixture o el mock API.
 */
const PROTO_FIXTURE_ACTION_BASELINE_BY_STATE = {
    RECEIVED: ["VIEW_LEAD"],
    CAPTURED: ["VIEW_LEAD", "EDIT_LEAD_INFORMATION", "START_QUALIFICATION", "REQUEST_MISSING_INFORMATION", "VIEW_COMMUNICATIONS"],
    NEEDS_INFORMATION: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION", "REVIEW_RECEIVED_INFORMATION", "VIEW_COMMUNICATIONS"],
    DUPLICATE_REVIEW: ["VIEW_LEAD", "OPEN_DUPLICATE_REVIEW", "RESOLVE_DUPLICATE_REVIEW", "REQUEST_MORE_INFORMATION"],
    UNDER_QUALIFICATION: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_QUALIFICATION_CRITERION", "REASSESS_QUALIFICATION", "REQUEST_HUMAN_REVIEW", "REQUEST_MISSING_INFORMATION"],
    QUALIFIED: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS"],
    DISQUALIFIED: ["VIEW_LEAD", "VIEW_QUALIFICATION"],
    CONVERTED: ["VIEW_LEAD", "VIEW_OPPORTUNITY_READINESS", "VIEW_HANDOFF", "VIEW_COMMUNICATIONS"],
    CLOSED: ["VIEW_LEAD"],
};
const PROTO_ROLE_LABEL = {
    SALES_REPRESENTATIVE: "Sales Representative",
    SALES_OPERATIONS_ANALYST: "Sales Operations Analyst",
    SALES_MANAGER: "Sales Manager",
    HUMAN_REVIEWER: "Human Reviewer",
    BIZCAP_ADMINISTRATOR: "BizCap Administrator",
    TENANT_ADMINISTRATOR: "Tenant Administrator",
    CUSTOMER_PROSPECT: "Customer / Prospect",
    ORDER_REVIEWER: "Order Reviewer",
};
/**
 * Rol ≠ Permiso ≠ Ámbito. Los tres se declaran por separado en cada actor
 * (sección 8 del paquete). El modelo de autorización productivo se define en
 * Stage 13; esto es sólo el modelo de fixtures de UX-14.
 */
const PROTO_ROLE_NOTE = {
    SALES_REPRESENTATIVE: "Trabaja sobre sus leads asignados.",
    SALES_OPERATIONS_ANALYST: "Triage operacional del equipo o la BizCap.",
    SALES_MANAGER: "Autoridad comercial de equipo; puede anular política donde se le permita.",
    HUMAN_REVIEWER: "Resuelve revisiones dentro de su ámbito; accede a evidencia.",
    BIZCAP_ADMINISTRATOR: "Configura la BizCap. Sin autoridad comercial implícita.",
    TENANT_ADMINISTRATOR: "Administra usuarios, roles e integraciones. Sin autoridad sobre decisiones de lead.",
    CUSTOMER_PROSPECT: "Sólo envía consultas o aporta la aclaración solicitada.",
    ORDER_REVIEWER: "Revisa y valida pedidos entrantes en LAB-003. Sin superficie operativa en este prototipo.",
};
/** NOT_SET nunca debe tratarse como LOW. */
const PROTO_PRIORITY_LABEL = {
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baja",
    NOT_SET: "Sin prioridad",
};
const PROTO_PRIORITY_ORDER = {
    HIGH: 0, MEDIUM: 1, LOW: 2, NOT_SET: 3,
};
const PROTO_NBA_SOURCE_LABEL = {
    SYSTEM_POLICY: "Política del sistema",
    HUMAN_SET: "Definido por una persona",
    AI_RECOMMENDATION: "Sugerencia de IA",
};
/**
 * NBA recomienda; `availableActions` autoriza. Si el actionCode no está entre
 * las acciones disponibles se muestra como orientación, nunca como comando.
 */
function protoNbaEsEjecutable(nba, availableActions) {
    if (nba.actionCode === "NO_ACTION_REQUIRED")
        return false;
    return availableActions.includes(nba.actionCode);
}
const PROTO_WORK_ITEM_TYPE_LABEL = {
    MISSING_INFORMATION_REQUEST: "Solicitud de información faltante",
    RECEIVED_INFORMATION_REVIEW: "Revisión de información recibida",
    QUALIFICATION_REVIEW: "Revisión de calificación",
    HUMAN_REVIEW: "Revisión humana",
    DUPLICATE_REVIEW: "Revisión de duplicado",
    ASSIGNMENT_EXCEPTION: "Excepción de asignación",
    OPPORTUNITY_READINESS_REVIEW: "Revisión de readiness",
};
const PROTO_WORK_ITEM_STATUS_LABEL = {
    OPEN: "Abierto",
    IN_PROGRESS: "En curso",
    WAITING: "En espera",
    RESOLVED: "Resuelto",
    CANCELLED: "Cancelado",
};
/** Open Work incluye sólo obligaciones activas (§7.1). */
const PROTO_WORK_ITEM_ACTIVE = ["OPEN", "IN_PROGRESS", "WAITING"];
const PROTO_COMM_DIRECTION_LABEL = {
    INBOUND: "Entrante", OUTBOUND: "Saliente",
};
const PROTO_COMM_CHANNEL_LABEL = {
    WEB_FORM: "Formulario web",
    SECURE_CLARIFICATION: "Aclaración segura",
    EMAIL: "Correo",
    PHONE: "Teléfono",
    SMS: "SMS",
    WHATSAPP: "WhatsApp",
    SYSTEM_MESSAGE: "Mensaje del sistema",
};
const PROTO_COMM_STATUS_LABEL = {
    DRAFT: "Borrador", QUEUED: "En cola", DISPATCHED: "Enviado", FAILED: "Falló", RECEIVED: "Recibido",
};
const PROTO_COMM_ACTOR_LABEL = {
    HUMAN: "Persona",
    AUTOMATED: "Automatizado",
    AI_ASSISTED_HUMAN: "Persona asistida por IA",
    SYSTEM_GENERATED: "Generado por el sistema",
};
/**
 * §8.3 — DISPATCHED es el único estado saliente que sirve como evidencia de
 * primera respuesta. FAILED no cuenta; DRAFT y QUEUED tampoco.
 */
function protoEsPrimeraRespuestaValida(status, direction) {
    return direction === "OUTBOUND" && status === "DISPATCHED";
}
const PROTO_EVIDENCE_CATEGORY_LABEL = {
    SUPPORTING: "Evidencia a favor",
    CONTRADICTORY: "Evidencia en contra",
    MISSING: "Evidencia faltante",
};
const PROTO_EVIDENCE_SOURCE_LABEL = {
    CANONICAL_FACT: "Dato canónico",
    RECEIVED_INFORMATION: "Información recibida",
    SYSTEM_ASSESSMENT: "Evaluación del sistema",
    HUMAN_DECISION: "Decisión humana",
    AI_INTERPRETATION: "Interpretación de IA",
    HISTORICAL_FACT: "Hecho histórico",
    POLICY_CONFIGURATION: "Configuración de política",
};
const PROTO_SIMILARITY_LABEL = {
    MATCH: "Coincide",
    PARTIAL_MATCH: "Coincide en parte",
    DIFFERENT: "Difiere",
    UNKNOWN: "Sin determinar",
};
const PROTO_ELIGIBILITY_LABEL = {
    ELIGIBLE: "Elegible",
    INELIGIBLE: "No elegible",
    UNKNOWN: "Sin determinar",
};
const PROTO_POLICY_RESULT_LABEL = {
    PASS: "Cumple", FAIL: "No cumple", NOT_APPLICABLE: "No aplica", UNKNOWN: "Sin determinar",
};
const PROTO_POLICY_CHECK_LABEL = {
    NAMED_ACCOUNT_OR_EXISTING_RELATIONSHIP: "Cuenta nominada o relación existente",
    TERRITORY_ELIGIBILITY: "Elegibilidad territorial",
    PRODUCT_SEGMENT_ELIGIBILITY: "Elegibilidad de segmento de producto",
    AVAILABILITY: "Disponibilidad",
    WORKLOAD: "Carga de trabajo",
    PRIORITY_COMPATIBILITY: "Compatibilidad de prioridad",
};
const PROTO_ASSIGNMENT_EVENT_LABEL = {
    AUTO_ASSIGNMENT_ATTEMPTED: "Intento de asignación automática",
    OWNER_ASSIGNED: "Responsable asignado",
    OWNER_REASSIGNED: "Responsable reasignado",
    ASSIGNMENT_FAILED_NO_ELIGIBLE_OWNER: "Sin responsable elegible",
    ROUTED_TO_SALES_OPS_QUEUE: "Enviado a la cola de Sales Ops",
    ASSIGNMENT_OVERRIDE_APPROVED: "Anulación de política aprobada",
    ASSIGNMENT_REEVALUATION_REQUESTED: "Reevaluación de asignación solicitada",
};
/**
 * Catálogo núcleo de LAB-001. La configuración de la BizCap Instance puede
 * cambiar parámetros, evidencia, rutas y etiquetas, pero NO redefinir el
 * significado semántico de estas ocho condiciones.
 */
const PROTO_READINESS_CATALOG = [
    { id: "RC-01", key: "QUALIFICATION_COMPLETE", name: "Calificación completa",
        question: "¿La evaluación gobernada de calificación terminó con un resultado aceptable o una excepción aprobada?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-qualification" },
    { id: "RC-02", key: "SCORE_PRIORITY_AVAILABLE", name: "Score y prioridad disponibles",
        question: "¿Están disponibles los resultados gobernados de score/prioridad necesarios para progresar?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-leads" },
    { id: "RC-03", key: "VALID_COMMERCIAL_OWNER", name: "Responsable comercial válido",
        question: "¿Hay un responsable comercial válido asignado según la política vigente?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-assignment" },
    { id: "RC-04", key: "MEANINGFUL_NEXT_BEST_ACTION", name: "Próximo paso significativo",
        question: "¿Existe un próximo paso gobernado con sentido para este lead?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-leads" },
    { id: "RC-05", key: "COMMERCIAL_NEED_SUFFICIENTLY_DEFINED", name: "Necesidad comercial suficientemente definida",
        question: "¿La necesidad comercial está lo bastante definida para crear una oportunidad sin ambigüedad material?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-missing-info" },
    { id: "RC-06", key: "REQUIRED_COMMERCIAL_FACTS_COMPLETE", name: "Hechos comerciales requeridos completos",
        question: "¿Están presentes como información canónica aceptada el medio de contacto, producto, cantidad, unidad y destino?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-missing-info" },
    { id: "RC-07", key: "NO_BLOCKING_REVIEW_OR_EXCEPTION_PENDING", name: "Sin revisiones ni excepciones bloqueantes",
        question: "¿No queda ninguna revisión humana, de duplicado o excepción sin resolver que bloquee?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-reviews" },
    { id: "RC-08", key: "NO_EXISTING_OPEN_OPPORTUNITY_FOR_SAME_NEED", name: "Sin oportunidad abierta para la misma necesidad",
        question: "¿No existe ya una oportunidad abierta que represente la misma necesidad comercial?",
        blockingWhenUnsatisfied: true, routeHint: "lab-001-opportunity" },
];
function protoFindReadinessCondition(id) {
    return PROTO_READINESS_CATALOG.find((c) => c.id === id) ?? null;
}
const PROTO_READINESS_STATUS_LABEL = {
    SATISFIED: "Satisfecha",
    NOT_SATISFIED: "No satisfecha",
    BLOCKING: "Bloqueante",
    PENDING: "Pendiente",
    NOT_APPLICABLE: "No aplica",
};
/**
 * `NOT_SATISFIED` describe una condición incumplida que la evaluación
 * autoritativa clasificó como NO bloqueante en ese contexto. `BLOCKING`
 * significa que la conversión está prohibida. Para el núcleo RC-01…RC-08 una
 * condición obligatoria incumplida se devuelve normalmente como BLOCKING.
 */
const PROTO_READINESS_STATUS_MEANING = {
    SATISFIED: "Cumple su requisito gobernado de preparación.",
    NOT_SATISFIED: "No alcanza su objetivo, pero la evaluación la clasificó como no bloqueante en este contexto.",
    BLOCKING: "No se cumple y la evaluación prohíbe explícitamente convertir.",
    PENDING: "La evaluación o el trabajo requerido siguen incompletos. En el núcleo de LAB-001 bloquea la conversión.",
    NOT_APPLICABLE: "No aplica legítimamente en el contexto configurado. No es un fallo.",
};
const PROTO_OVERALL_READINESS_LABEL = {
    READY: "Listo para convertir",
    NOT_READY: "No listo",
    PENDING: "Evaluación pendiente",
};
const PROTO_BIZCAPS = [
    {
        bizCapId: "LAB-001",
        name: "Lead Intake & Qualification",
        hasOperationalSurface: true,
        entryRouteId: "lab-001",
        note: "BizCap controlada de UX-14: Leads, Work Queue, Reviews, Calificación, Asignación y Oportunidad.",
    },
    {
        bizCapId: "LAB-002",
        name: "Quote & Proposal Management",
        hasOperationalSurface: false,
        entryRouteId: null,
        note: "Planned. Asignable a un usuario, sin superficie operativa construida en este prototipo.",
    },
    {
        bizCapId: "LAB-003",
        name: "Order Intake & Validation",
        hasOperationalSurface: false,
        entryRouteId: null,
        note: "Planned. Asignable a un usuario, sin superficie operativa construida en este prototipo.",
    },
];
function protoFindBizCap(bizCapId) {
    return PROTO_BIZCAPS.find((b) => b.bizCapId === bizCapId) ?? null;
}
const PROTO_TENANT_STATE_LABEL = {
    TENANT_CONTEXT_SWITCHING: "Cambiando de organización",
    TENANT_ACCESS_REVOKED: "Acceso revocado en esta organización",
    TENANT_CONTEXT_STALE: "El contexto de organización está desactualizado",
    TENANT_BIZCAP_NOT_AVAILABLE: "Esa BizCap no está disponible en esta organización",
    ADMIN_CHANGE_REQUIRES_STEP_UP: "Este cambio de acceso exige verificación adicional",
    ACCESS_CHANGE_SUCCESS: "Acceso actualizado",
    ACCESS_CHANGE_CONFLICT: "El acceso cambió mientras editabas",
};
const PROTO_MEMBERSHIP_STATUS_LABEL = {
    active: "Activa",
    invited: "Invitación pendiente",
    suspended: "Suspendida",
    revoked: "Revocada",
};
