"use strict";
/**
 * WorkItems — obligaciones humanas del prototipo (Addendum §5).
 *
 * Un WorkItem representa una obligación, revisión, excepción o seguimiento que
 * requiere atención humana. NO es el Lead y NO transfiere propiedad comercial:
 * `assignee` puede diferir de `commercialOwner`.
 *
 * Alimenta APP-02 My Work y WORK-01 Work Queue desde el MISMO modelo; la
 * sección Open Work de LEAD-03 reutiliza este conjunto, sin esquema paralelo.
 *
 * El orden de la cola lo provee este fixture (§5.6). El frontend no lo calcula.
 */
const PROTO_WORK_ITEMS = [
    {
        workItemId: "WI-0042",
        type: "MISSING_INFORMATION_REQUEST",
        status: "OPEN",
        title: "Solicitar información faltante",
        obligation: "Solicitar cantidad y unidad al cliente para continuar la calificación.",
        subject: { entityType: "LEAD", leadId: "LEAD-00042", leadReference: "LD-2026-00042", companyName: "Acme Packaging LLC" },
        assignee: { userId: "USR-001", displayName: "Ana Ruiz", role: "SALES_REPRESENTATIVE" },
        commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
        priority: "HIGH",
        riskLevel: "MEDIUM",
        createdAt: "2026-09-04T14:00:00-05:00",
        dueAt: "2026-09-04T18:00:00-05:00",
        isOverdue: false,
        reasonCode: "QUALIFICATION_MINIMUM_INFORMATION_MISSING",
        reasonSummary: "Faltan cantidad y unidad.",
        availableActions: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION"],
        targetRoute: "workspace/missing-information/?leadId=LEAD-00042&workItemId=WI-0042",
        sla: { status: "ON_TRACK", remainingMinutes: 176 },
        version: 3,
        updatedAt: "2026-09-04T15:04:00-05:00",
    },
    {
        workItemId: "WI-0043",
        type: "RECEIVED_INFORMATION_REVIEW",
        status: "OPEN",
        title: "Revisar información recibida",
        obligation: "El cliente respondió con un valor que contradice el dato canónico. Revisar y decidir.",
        subject: { entityType: "LEAD", leadId: "LEAD-00043", leadReference: "LD-2026-00043", companyName: "Metalúrgica Sur" },
        assignee: { userId: "USR-001", displayName: "Ana Ruiz", role: "SALES_REPRESENTATIVE" },
        commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
        priority: "HIGH",
        riskLevel: "HIGH",
        createdAt: "2026-09-04T15:25:00-05:00",
        dueAt: "2026-09-04T17:00:00-05:00",
        isOverdue: true,
        reasonCode: "RECEIVED_VALUE_CONFLICTS_WITH_CANONICAL",
        reasonSummary: "Cantidad recibida (25 000) difiere de la canónica (10 000).",
        availableActions: ["VIEW_LEAD", "REVIEW_RECEIVED_INFORMATION", "REQUEST_HUMAN_REVIEW"],
        targetRoute: "workspace/missing-information/?leadId=LEAD-00043&workItemId=WI-0043&view=received",
        sla: { status: "BREACHED" },
        version: 2,
        updatedAt: "2026-09-04T16:12:00-05:00",
    },
    {
        workItemId: "WI-0045",
        type: "QUALIFICATION_REVIEW",
        status: "IN_PROGRESS",
        title: "Revisar criterio en revisión",
        obligation: "QD-03 quedó en REVIEW: el volumen está bajo el umbral configurado y requiere criterio humano.",
        subject: { entityType: "LEAD", leadId: "LEAD-00045", leadReference: "LD-2026-00045", companyName: "Servicios Pacífico" },
        assignee: { userId: "USR-001", displayName: "Ana Ruiz", role: "SALES_REPRESENTATIVE" },
        commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
        priority: "MEDIUM",
        createdAt: "2026-09-03T10:40:00-05:00",
        dueAt: "2026-09-05T12:00:00-05:00",
        isOverdue: false,
        reasonCode: "QUALIFICATION_CRITERION_REQUIRES_REVIEW",
        reasonSummary: "QD-03 Minimum Commercial Volume en REVIEW.",
        availableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "REQUEST_HUMAN_REVIEW"],
        targetRoute: "workspace/qualification/?leadId=LEAD-00045",
        sla: { status: "AT_RISK", remainingMinutes: 420 },
        version: 4,
        updatedAt: "2026-09-04T09:15:00-05:00",
    },
    {
        workItemId: "WI-0046",
        type: "ASSIGNMENT_EXCEPTION",
        status: "WAITING",
        title: "Excepción de asignación",
        obligation: "La asignación automática no encontró un responsable elegible según la política.",
        subject: { entityType: "LEAD", leadId: "LEAD-00046", leadReference: "LD-2026-00046", companyName: "Agro Llanos" },
        assignee: null,
        priority: "MEDIUM",
        createdAt: "2026-09-03T17:02:00-05:00",
        dueAt: null,
        isOverdue: false,
        reasonCode: "NO_ELIGIBLE_OWNER",
        reasonSummary: "Sin responsable elegible para la geografía configurada.",
        availableActions: ["VIEW_LEAD", "VIEW_ASSIGNMENT"],
        targetRoute: "workspace/assignment/?leadId=LEAD-00046",
        sla: { status: "NOT_APPLICABLE" },
        version: 1,
        updatedAt: "2026-09-03T17:02:00-05:00",
        tags: ["PM-UX14-05"],
    },
    {
        workItemId: "WI-0047",
        type: "OPPORTUNITY_READINESS_REVIEW",
        status: "OPEN",
        title: "Revisar readiness de oportunidad",
        obligation: "El lead está calificado pero tiene una condición de readiness sin satisfacer.",
        subject: { entityType: "LEAD", leadId: "LEAD-00047", leadReference: "LD-2026-00047", companyName: "Distribuidora Centro" },
        assignee: { userId: "USR-003", displayName: "Elena Mora", role: "SALES_MANAGER" },
        commercialOwner: { userId: "USR-003", displayName: "Elena Mora" },
        priority: "LOW",
        createdAt: "2026-09-04T08:10:00-05:00",
        dueAt: "2026-09-08T12:00:00-05:00",
        isOverdue: false,
        reasonCode: "READINESS_CONDITION_NOT_SATISFIED",
        reasonSummary: "Falta confirmar condición comercial antes de convertir.",
        availableActions: ["VIEW_LEAD", "VIEW_OPPORTUNITY_READINESS"],
        targetRoute: "workspace/opportunity/?leadId=LEAD-00047",
        sla: { status: "ON_TRACK", remainingMinutes: 2400 },
        version: 1,
        updatedAt: "2026-09-04T08:10:00-05:00",
        tags: ["PM-UX14-06"],
    },
    {
        // RESUELTO: demuestra que Open Work lo excluye y que vive en History/Evidence.
        workItemId: "WI-0040",
        type: "MISSING_INFORMATION_REQUEST",
        status: "RESOLVED",
        title: "Solicitar información faltante",
        obligation: "Se solicitó el destino de entrega; el cliente respondió.",
        subject: { entityType: "LEAD", leadId: "LEAD-00041", leadReference: "LD-2026-00041", companyName: "Andina Textil" },
        assignee: { userId: "USR-001", displayName: "Ana Ruiz", role: "SALES_REPRESENTATIVE" },
        commercialOwner: { userId: "USR-001", displayName: "Ana Ruiz" },
        priority: "MEDIUM",
        createdAt: "2026-09-01T13:10:00-05:00",
        dueAt: "2026-09-01T18:00:00-05:00",
        isOverdue: false,
        reasonCode: "QUALIFICATION_MINIMUM_INFORMATION_MISSING",
        reasonSummary: "Faltaba destino de entrega.",
        availableActions: ["VIEW_LEAD"],
        targetRoute: "workspace/missing-information/?leadId=LEAD-00041&workItemId=WI-0040",
        sla: { status: "ON_TRACK" },
        version: 5,
        updatedAt: "2026-09-01T16:40:00-05:00",
    },
];
/**
 * Trabajo que llega mientras el usuario opera. NO se inserta solo: la cola lo
 * anuncia con un banner y sólo aparece tras un refresco explícito (§5.6).
 */
const PROTO_INCOMING_WORK_ITEMS = [
    {
        workItemId: "WI-0050",
        type: "MISSING_INFORMATION_REQUEST",
        status: "OPEN",
        title: "Solicitar información faltante",
        obligation: "Nueva consulta sin cantidad declarada.",
        subject: { entityType: "LEAD", leadId: "LEAD-00048", leadReference: "LD-2026-00048", companyName: "Innova Foods" },
        assignee: { userId: "USR-001", displayName: "Ana Ruiz", role: "SALES_REPRESENTATIVE" },
        commercialOwner: { userId: "USR-003", displayName: "Elena Mora" },
        priority: "HIGH",
        createdAt: "2026-09-05T08:00:00-05:00",
        dueAt: "2026-09-05T12:00:00-05:00",
        isOverdue: false,
        reasonCode: "QUALIFICATION_MINIMUM_INFORMATION_MISSING",
        reasonSummary: "Falta confirmar unidad de medida.",
        availableActions: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION"],
        targetRoute: "workspace/missing-information/?leadId=LEAD-00048&workItemId=WI-0050",
        sla: { status: "ON_TRACK", remainingMinutes: 240 },
        version: 1,
        updatedAt: "2026-09-05T08:00:00-05:00",
    },
];
/* ---------------------------------------------------------------------------
 * Accesores. El orden lo declara el fixture, no el frontend.
 * ------------------------------------------------------------------------- */
function protoFindWorkItem(workItemId) {
    return PROTO_WORK_ITEMS.find((w) => w.workItemId === workItemId) ?? null;
}
/** APP-02 My Work: obligaciones activas asignadas al actor, cross-BizCap. */
function protoGetMyWork(userId) {
    return PROTO_WORK_ITEMS.filter((w) => w.assignee?.userId === userId && PROTO_WORK_ITEM_ACTIVE.includes(w.status));
}
/** WORK-01 Work Queue: triage del equipo/BizCap, incluidos los sin asignar. */
function protoGetWorkQueue() {
    return PROTO_WORK_ITEMS.filter((w) => PROTO_WORK_ITEM_ACTIVE.includes(w.status));
}
/** Open Work de un lead: sólo obligaciones activas (§7.1). */
function protoGetOpenWork(leadId) {
    return PROTO_WORK_ITEMS.filter((w) => w.subject.leadId === leadId && PROTO_WORK_ITEM_ACTIVE.includes(w.status));
}
/** Trabajo cerrado del lead: pertenece a History/Evidence, no a Open Work. */
function protoGetClosedWork(leadId) {
    return PROTO_WORK_ITEMS.filter((w) => w.subject.leadId === leadId && !PROTO_WORK_ITEM_ACTIVE.includes(w.status));
}
function protoCountOpenWork(leadId) {
    return protoGetOpenWork(leadId).length;
}
