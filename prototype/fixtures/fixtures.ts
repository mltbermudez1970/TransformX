/**
 * Fixtures sintéticos del prototipo — estructura canónica UX-14.
 *
 * Fuente: Resolution Package §10 (Canonical Fact), §11 (canonicalLead),
 * §2.1 (qualification) y §12 (comparación MI-03).
 *
 * Reglas:
 *  - 100 % sintético. Ninguna empresa, persona, correo o teléfono es real.
 *  - `availableActions` viene SIEMPRE del fixture. Ninguna superficie la
 *    reconstruye a partir de `lifecycleState`.
 *  - Un Canonical Fact es el valor de negocio vigente y aceptado. NO lo son:
 *    la interpretación de IA, la información recibida aún no aceptada, el
 *    resultado de calificación ni los valores históricos.
 *  - Se declaran como constantes TS (no JSON + fetch) para que el prototipo
 *    funcione abriendo el HTML directamente desde el sistema de archivos.
 */

interface ProtoOrganization {
  organizationId: string;
  name: string;
  bizcapId: "LAB-001";
  bizcapName: string;
}

/** Actor operativo. El rol, permisos y ámbito viven en PROTO_AUTH_USERS. */
interface ProtoActor {
  actorId: string;
  displayName: string;
  initials: string;
  role: ProtoRole;
}

/* ---------------------------------------------------------------------------
 * §10 — Canonical Fact
 * ------------------------------------------------------------------------- */

/** Estado de un valor canónico versionado. */
type ProtoFieldStatus = "CANONICAL" | "MISSING" | "NOT_PROVIDED" | "PENDING_ACCEPTANCE";

interface ProtoCanonicalField<T> {
  value: T | null;
  status: ProtoFieldStatus;
  /** Procedencia opcional; puede mostrarse en L2/L3, no necesariamente en L1. */
  source?: string;
  observedAt?: string;
  acceptedAt?: string;
  acceptedBy?: string;
  version?: number;
}

interface ProtoCommercialNeed {
  commercialNeedId: string;
  version: number;
  // Requeridos para iniciar calificación
  productOffering: ProtoCanonicalField<string>;
  quantity: ProtoCanonicalField<number>;
  unit: ProtoCanonicalField<string>;
  geographyDestination: ProtoCanonicalField<string>;
  // Opcionales / enriquecimiento
  recurringDemand: ProtoCanonicalField<string>;
  material: ProtoCanonicalField<string>;
  dimensionsOrCapacity: ProtoCanonicalField<string>;
  requestedOrRequiredDate: ProtoCanonicalField<string>;
  specialRequirements: ProtoCanonicalField<string>;
}

interface ProtoCanonicalLead {
  leadId: string;
  leadReference: string;
  lifecycleState: ProtoLeadState;
  // Procedencia canónica
  receivedAt: string;
  source: string;
  channel: string;
  company: { companyId: string; companyName: string };
  contact: { contactId: string; fullName: string; email: string | null; phone: string | null };
  commercialNeed: ProtoCommercialNeed;
  updatedAt: string;
  canonicalVersion: number;
  /**
   * Provisto por fixture/mock API. La UI lo consume tal cual.
   * Dos leads QUALIFIED pueden exponer acciones distintas.
   */
  availableActions: ProtoAction[];
  /** Nota de guion para quien facilite la sesión de validación. */
  guion: string;
}

/* ---------------------------------------------------------------------------
 * §2.1 — Calificación (evaluación autoritativa, NO es Canonical Fact del lead)
 * ------------------------------------------------------------------------- */

interface ProtoCriterionAssessment {
  id: ProtoCriterionId;
  name: string;
  status: ProtoCriterionStatus;
  /** Valor observado que produjo el resultado. */
  observedValue?: string;
  /** Resumen legible de la regla configurada. */
  configuredRule?: string;
  evidence?: string[];
  /** Sólo cuando status === "EXCEPTION": conserva la evaluación original. */
  exception?: {
    originalStatus: ProtoCriterionStatus;
    approvedBy: string;
    approvedAt: string;
    rationale: string;
  };
  traceability?: string;
}

interface ProtoQualification {
  assessmentId: string;
  assessmentVersion: number;
  /** Provisto por fixture/mock API. El frontend NO lo calcula. */
  overallStatus: ProtoCriterionStatus;
  criteria: ProtoCriterionAssessment[];
}

/* ---------------------------------------------------------------------------
 * §12 — Comparación MI-03: Canonical vs Received vs AI
 * ------------------------------------------------------------------------- */

type ProtoMiAction =
  | "ACCEPT_RECEIVED_VALUE"
  | "CORRECT_RECEIVED_VALUE"
  | "KEEP_CANONICAL_VALUE"
  | "REQUEST_HUMAN_REVIEW";

/** Acciones de interacción de MI-03. NO son estados del ciclo de vida. */
const PROTO_MI_ACTION_LABEL: Record<ProtoMiAction, string> = {
  ACCEPT_RECEIVED_VALUE: "Aceptar valor recibido",
  CORRECT_RECEIVED_VALUE: "Corregir valor recibido",
  KEEP_CANONICAL_VALUE: "Mantener valor canónico",
  REQUEST_HUMAN_REVIEW: "Solicitar revisión humana",
};

interface ProtoFieldComparison {
  leadId: string;
  field: string;
  fieldLabel: string;
  canonical: { value: string | number | null; unit?: string; version: number };
  received: { value: string | number | null; unit?: string; receivedAt: string; source: string };
  /** Tipo declarado explícitamente: una interpretación de IA nunca es canónica. */
  aiInterpretation: { type: "AI_INTERPRETATION"; value: string | number | null; unit?: string; confidence: number };
  availableActions: ProtoMiAction[];
}

/* ---------------------------------------------------------------------------
 * Datos
 * ------------------------------------------------------------------------- */

const PROTO_ORGANIZATION: ProtoOrganization = {
  organizationId: "org-demo-001",
  name: "Organización Demo S.A.",
  bizcapId: "LAB-001",
  bizcapName: "Lead Intake & Qualification",
};

const PROTO_ACTORS: ProtoActor[] = [
  { actorId: "act-001", displayName: "Ana Ruiz", initials: "AR", role: "SALES_REPRESENTATIVE" },
  { actorId: "act-002", displayName: "Bruno Salas", initials: "BS", role: "SALES_OPERATIONS_ANALYST" },
  { actorId: "act-003", displayName: "Elena Mora", initials: "EM", role: "SALES_MANAGER" },
  { actorId: "act-004", displayName: "Hugo Reyes", initials: "HR", role: "HUMAN_REVIEWER" },
];

/** Atajo para declarar un campo canónico vigente. */
function protoCanon<T>(value: T, version = 1): ProtoCanonicalField<T> {
  return { value, status: "CANONICAL", version };
}

const PROTO_FIELD_MISSING: ProtoCanonicalField<never> = { value: null, status: "MISSING" };
const PROTO_FIELD_NOT_PROVIDED: ProtoCanonicalField<never> = { value: null, status: "NOT_PROVIDED" };

const PROTO_CANONICAL_LEADS: ProtoCanonicalLead[] = [
  {
    leadId: "LEAD-00041",
    leadReference: "LD-2026-00041",
    lifecycleState: "CAPTURED",
    receivedAt: "2026-09-01T13:05:00-05:00",
    source: "WEB",
    channel: "TRANSFORMX_PUBLIC_FORM",
    company: { companyId: "COMP-0041", companyName: "Andina Textil" },
    contact: { contactId: "CONT-0041", fullName: "Carla Méndez", email: "carla.mendez@ejemplo-andina.test", phone: "+593 99 000 0001" },
    commercialNeed: {
      commercialNeedId: "NEED-0041", version: 1,
      productOffering: protoCanon("Tela poliéster 180 g/m²"),
      quantity: protoCanon(12000),
      unit: protoCanon("metros/mes"),
      geographyDestination: protoCanon("Quito, EC"),
      recurringDemand: protoCanon("MONTHLY"),
      material: protoCanon("Poliéster"),
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-01T13:06:00-05:00",
    canonicalVersion: 2,
    availableActions: ["VIEW_LEAD", "START_QUALIFICATION", "VIEW_COMMUNICATIONS"],
    guion: "S-01 Complete inquiry: captura completa, lista para iniciar calificación.",
  },
  {
    leadId: "LEAD-00042",
    leadReference: "LD-2026-00042",
    lifecycleState: "NEEDS_INFORMATION",
    receivedAt: "2026-09-04T13:14:00-05:00",
    source: "WEB",
    channel: "TRANSFORMX_PUBLIC_FORM",
    company: { companyId: "COMP-0042", companyName: "Acme Packaging LLC" },
    contact: { contactId: "CONT-0042", fullName: "Laura Chen", email: "laura@ejemplo-acme.test", phone: null },
    commercialNeed: {
      commercialNeedId: "NEED-0042", version: 2,
      productOffering: protoCanon("PET Bottle 500 ml"),
      quantity: PROTO_FIELD_MISSING,
      unit: PROTO_FIELD_MISSING,
      geographyDestination: protoCanon("Orlando, FL"),
      recurringDemand: protoCanon("MONTHLY"),
      material: PROTO_FIELD_NOT_PROVIDED,
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-04T13:16:00-05:00",
    canonicalVersion: 5,
    availableActions: ["VIEW_LEAD", "REQUEST_MISSING_INFORMATION", "VIEW_COMMUNICATIONS"],
    guion: "S-02 Missing information: faltan quantity y unit para poder calificar.",
  },
  {
    leadId: "LEAD-00043",
    leadReference: "LD-2026-00043",
    lifecycleState: "NEEDS_INFORMATION",
    receivedAt: "2026-09-04T09:00:00-05:00",
    source: "EMAIL",
    channel: "INBOUND_EMAIL",
    company: { companyId: "COMP-0043", companyName: "Metalúrgica Sur" },
    contact: { contactId: "CONT-0043", fullName: "Diego Prado", email: "diego.prado@ejemplo-metsur.test", phone: null },
    commercialNeed: {
      commercialNeedId: "NEED-0043", version: 3,
      productOffering: protoCanon("Perfil estructural 2\""),
      quantity: protoCanon(10000, 3),
      unit: protoCanon("unidades/mes", 3),
      geographyDestination: protoCanon("Lima, PE"),
      recurringDemand: PROTO_FIELD_NOT_PROVIDED,
      material: protoCanon("Acero"),
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-04T15:22:00-05:00",
    canonicalVersion: 7,
    availableActions: ["VIEW_LEAD", "REVIEW_RECEIVED_INFORMATION", "REQUEST_HUMAN_REVIEW"],
    guion: "S-03 Conflicting update: la información recibida contradice el valor canónico.",
  },
  {
    leadId: "LEAD-00044",
    leadReference: "LD-2026-00044",
    lifecycleState: "DUPLICATE_REVIEW",
    receivedAt: "2026-09-02T09:12:00-05:00",
    source: "EVENT",
    channel: "EVENT_FORM",
    company: { companyId: "COMP-0041", companyName: "Andina Textil" },
    contact: { contactId: "CONT-0044", fullName: "Carla Mendez", email: "c.mendez@ejemplo-andina.test", phone: "+593 99 000 0001" },
    commercialNeed: {
      commercialNeedId: "NEED-0044", version: 1,
      productOffering: protoCanon("Tela poliéster 180 g/m²"),
      quantity: protoCanon(12000),
      unit: protoCanon("metros/mes"),
      geographyDestination: protoCanon("Quito, EC"),
      recurringDemand: protoCanon("MONTHLY"),
      material: protoCanon("Poliéster"),
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-02T09:13:00-05:00",
    canonicalVersion: 1,
    availableActions: ["VIEW_LEAD", "OPEN_DUPLICATE_REVIEW", "RESOLVE_DUPLICATE_REVIEW", "REQUEST_MORE_INFORMATION"],
    guion: "S-04 Probable duplicate: candidato de LEAD-00041 — misma necesidad, no sólo misma empresa.",
  },
  {
    leadId: "LEAD-00045",
    leadReference: "LD-2026-00045",
    lifecycleState: "UNDER_QUALIFICATION",
    receivedAt: "2026-09-03T08:02:00-05:00",
    source: "REFERRAL",
    channel: "PARTNER_REFERRAL",
    company: { companyId: "COMP-0045", companyName: "Servicios Pacífico" },
    contact: { contactId: "CONT-0045", fullName: "Fabián Cruz", email: "fabian.cruz@ejemplo-pacifico.test", phone: "+52 55 0000 0005" },
    commercialNeed: {
      commercialNeedId: "NEED-0045", version: 2,
      productOffering: protoCanon("Film retráctil industrial"),
      quantity: protoCanon(800),
      unit: protoCanon("kg/mes"),
      geographyDestination: protoCanon("Guadalajara, MX"),
      recurringDemand: protoCanon("MONTHLY"),
      material: protoCanon("Polietileno"),
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-03T10:40:00-05:00",
    canonicalVersion: 4,
    availableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "OPEN_HUMAN_REVIEW", "RESOLVE_HUMAN_REVIEW", "REQUEST_MORE_INFORMATION"],
    guion: "S-05 Human review required: QD-03 en REVIEW, volumen bajo el umbral configurado.",
  },
  {
    leadId: "LEAD-00046",
    leadReference: "LD-2026-00046",
    lifecycleState: "UNDER_QUALIFICATION",
    receivedAt: "2026-09-03T16:48:00-05:00",
    source: "WEB",
    channel: "TRANSFORMX_PUBLIC_FORM",
    company: { companyId: "COMP-0046", companyName: "Agro Llanos" },
    contact: { contactId: "CONT-0046", fullName: "Gabriela Ortiz", email: "gabriela.ortiz@ejemplo-llanos.test", phone: "+54 11 0000 0006" },
    commercialNeed: {
      commercialNeedId: "NEED-0046", version: 1,
      productOffering: protoCanon("Big bag 1000 kg"),
      quantity: protoCanon(5000),
      unit: protoCanon("unidades/trimestre"),
      geographyDestination: protoCanon("Rosario, AR"),
      recurringDemand: protoCanon("QUARTERLY"),
      material: PROTO_FIELD_NOT_PROVIDED,
      dimensionsOrCapacity: PROTO_FIELD_NOT_PROVIDED,
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-03T17:02:00-05:00",
    canonicalVersion: 3,
    availableActions: ["VIEW_LEAD", "VIEW_ASSIGNMENT", "RESOLVE_ASSIGNMENT_EXCEPTION"],
    guion: "S-06 Assignment exception: la asignación automática no halló responsable elegible.",
  },
  {
    leadId: "LEAD-00047",
    leadReference: "LD-2026-00047",
    lifecycleState: "QUALIFIED",
    receivedAt: "2026-09-02T11:25:00-05:00",
    source: "WEB",
    channel: "TRANSFORMX_PUBLIC_FORM",
    company: { companyId: "COMP-0047", companyName: "Distribuidora Centro" },
    contact: { contactId: "CONT-0047", fullName: "Elena Vargas", email: "elena.vargas@ejemplo-centro.test", phone: "+57 300 000 0004" },
    commercialNeed: {
      commercialNeedId: "NEED-0047", version: 2,
      productOffering: protoCanon("Caja corrugada 40x30x25"),
      quantity: protoCanon(60000),
      unit: protoCanon("unidades/mes"),
      geographyDestination: protoCanon("Bogotá, CO"),
      recurringDemand: protoCanon("MONTHLY"),
      material: protoCanon("Cartón corrugado"),
      dimensionsOrCapacity: protoCanon("40x30x25 cm"),
      requestedOrRequiredDate: PROTO_FIELD_NOT_PROVIDED,
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-04T08:10:00-05:00",
    canonicalVersion: 6,
    // Calificado pero NO listo: sin CONVERT_TO_OPPORTUNITY.
    availableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS"],
    guion: "S-07 Qualified not ready: calificado ≠ listo; readiness con condición bloqueante.",
  },
  {
    leadId: "LEAD-00048",
    leadReference: "LD-2026-00048",
    lifecycleState: "QUALIFIED",
    receivedAt: "2026-09-01T15:40:00-05:00",
    source: "WEB",
    channel: "TRANSFORMX_PUBLIC_FORM",
    company: { companyId: "COMP-0048", companyName: "Innova Foods" },
    contact: { contactId: "CONT-0048", fullName: "Marta Solís", email: "marta.solis@ejemplo-innova.test", phone: "+51 1 000 0008" },
    commercialNeed: {
      commercialNeedId: "NEED-0048", version: 3,
      productOffering: protoCanon("Bandeja termoformada PP"),
      quantity: protoCanon(150000),
      unit: protoCanon("unidades/mes"),
      geographyDestination: protoCanon("Lima, PE"),
      recurringDemand: protoCanon("MONTHLY"),
      material: protoCanon("Polipropileno"),
      dimensionsOrCapacity: protoCanon("18x12x4 cm"),
      requestedOrRequiredDate: protoCanon("2026-11-02"),
      specialRequirements: PROTO_FIELD_NOT_PROVIDED,
    },
    updatedAt: "2026-09-04T09:30:00-05:00",
    canonicalVersion: 8,
    availableActions: ["VIEW_LEAD", "VIEW_QUALIFICATION", "VIEW_ASSIGNMENT", "VIEW_OPPORTUNITY_READINESS", "CONVERT_TO_OPPORTUNITY"],
    guion: "S-08 Ready for conversion: readiness satisfecho y actor con opportunity.convert.",
  },
];

/* ---------------------------------------------------------------------------
 * Calificaciones por lead (evaluación separada del Canonical Fact)
 * ------------------------------------------------------------------------- */

const PROTO_QUALIFICATIONS: Record<string, ProtoQualification> = {
  "LEAD-00045": {
    assessmentId: "QA-001",
    assessmentVersion: 3,
    overallStatus: "REVIEW",
    criteria: [
      { id: "QD-01", name: "Product Fit", status: "PASS", observedValue: "Film retráctil industrial", configuredRule: "Oferta dentro del catálogo de la instancia", evidence: ["Catálogo LAB-001 v4"], traceability: "QA-001/QD-01" },
      { id: "QD-02", name: "Geography Fit", status: "PASS", observedValue: "Guadalajara, MX", configuredRule: "Cobertura configurada incluye MX", evidence: ["Cobertura v2"], traceability: "QA-001/QD-02" },
      { id: "QD-03", name: "Minimum Commercial Volume", status: "REVIEW", observedValue: "800 kg/mes", configuredRule: "Umbral mínimo configurado: 1000 kg/mes", evidence: ["Política comercial v3"], traceability: "QA-001/QD-03" },
      { id: "QD-04", name: "Contactability", status: "PASS", observedValue: "email + teléfono", configuredRule: "Requiere email o teléfono", traceability: "QA-001/QD-04" },
      { id: "QD-05", name: "Commercial Intent", status: "PASS", observedValue: "Solicitud con volumen y destino", configuredRule: "Intención comercial accionable", traceability: "QA-001/QD-05" },
    ],
  },
  "LEAD-00047": {
    assessmentId: "QA-002",
    assessmentVersion: 2,
    overallStatus: "PASS",
    criteria: [
      { id: "QD-01", name: "Product Fit", status: "PASS", observedValue: "Caja corrugada 40x30x25", traceability: "QA-002/QD-01" },
      { id: "QD-02", name: "Geography Fit", status: "PASS", observedValue: "Bogotá, CO", traceability: "QA-002/QD-02" },
      { id: "QD-03", name: "Minimum Commercial Volume", status: "PASS", observedValue: "60000 unidades/mes", traceability: "QA-002/QD-03" },
      { id: "QD-04", name: "Contactability", status: "PASS", observedValue: "email + teléfono", traceability: "QA-002/QD-04" },
      { id: "QD-05", name: "Commercial Intent", status: "PASS", observedValue: "Demanda recurrente declarada", traceability: "QA-002/QD-05" },
    ],
  },
  "LEAD-00048": {
    assessmentId: "QA-003",
    assessmentVersion: 4,
    // EXCEPTION ≠ PASS: conserva la evaluación original y añade autoridad aparte.
    overallStatus: "PASS",
    criteria: [
      { id: "QD-01", name: "Product Fit", status: "PASS", observedValue: "Bandeja termoformada PP", traceability: "QA-003/QD-01" },
      { id: "QD-02", name: "Geography Fit", status: "EXCEPTION", observedValue: "Lima, PE", configuredRule: "Cobertura configurada no incluye PE para esta línea",
        exception: { originalStatus: "FAIL", approvedBy: "Elena Mora — Sales Manager", approvedAt: "2026-09-04T09:20:00-05:00", rationale: "Acuerdo marco regional vigente cubre PE para este cliente." },
        evidence: ["Cobertura v2", "Acuerdo marco REG-2026-11"], traceability: "QA-003/QD-02" },
      { id: "QD-03", name: "Minimum Commercial Volume", status: "PASS", observedValue: "150000 unidades/mes", traceability: "QA-003/QD-03" },
      { id: "QD-04", name: "Contactability", status: "PASS", observedValue: "email + teléfono", traceability: "QA-003/QD-04" },
      { id: "QD-05", name: "Commercial Intent", status: "PASS", observedValue: "Fecha requerida declarada", traceability: "QA-003/QD-05" },
    ],
  },
};

/* ---------------------------------------------------------------------------
 * Comparaciones MI-03
 * ------------------------------------------------------------------------- */

const PROTO_FIELD_COMPARISONS: ProtoFieldComparison[] = [
  {
    leadId: "LEAD-00043",
    field: "quantity",
    fieldLabel: "Cantidad",
    canonical: { value: 10000, unit: "unidades/mes", version: 3 },
    received: { value: 25000, unit: "unidades/mes", receivedAt: "2026-09-04T15:22:00-05:00", source: "CUSTOMER_SECURE_CLARIFICATION" },
    aiInterpretation: { type: "AI_INTERPRETATION", value: 25000, unit: "unidades/mes", confidence: 0.98 },
    availableActions: ["ACCEPT_RECEIVED_VALUE", "CORRECT_RECEIVED_VALUE", "KEEP_CANONICAL_VALUE", "REQUEST_HUMAN_REVIEW"],
  },
  {
    leadId: "LEAD-00042",
    field: "quantity",
    fieldLabel: "Cantidad",
    canonical: { value: null, unit: undefined, version: 5 },
    received: { value: 25000, unit: "unidades/mes", receivedAt: "2026-09-04T16:05:00-05:00", source: "CUSTOMER_SECURE_CLARIFICATION" },
    aiInterpretation: { type: "AI_INTERPRETATION", value: 25000, unit: "unidades/mes", confidence: 0.91 },
    availableActions: ["ACCEPT_RECEIVED_VALUE", "CORRECT_RECEIVED_VALUE", "REQUEST_HUMAN_REVIEW"],
  },
];

/* ---------------------------------------------------------------------------
 * Conjuntos de fixtures por escenario
 * ------------------------------------------------------------------------- */

interface ProtoFixtureSet {
  fixtureSetId: string;
  description: string;
  leadIds: string[];
}

const PROTO_FIXTURE_SETS: ProtoFixtureSet[] = [
  { fixtureSetId: "fx-queue-base", description: "Cola completa de leads sintéticos.",
    leadIds: ["LEAD-00041", "LEAD-00042", "LEAD-00043", "LEAD-00044", "LEAD-00045", "LEAD-00046", "LEAD-00047", "LEAD-00048"] },
  { fixtureSetId: "fx-my-work", description: "Subconjunto asignado al actor.", leadIds: ["LEAD-00041", "LEAD-00047"] },
  { fixtureSetId: "fx-complete-inquiry", description: "Captura completa.", leadIds: ["LEAD-00041"] },
  { fixtureSetId: "fx-missing-information", description: "Captura incompleta.", leadIds: ["LEAD-00042"] },
  { fixtureSetId: "fx-conflicting-update", description: "Información recibida en conflicto.", leadIds: ["LEAD-00043"] },
  { fixtureSetId: "fx-duplicate-review", description: "Par candidato a duplicado.", leadIds: ["LEAD-00041", "LEAD-00044"] },
  { fixtureSetId: "fx-human-review", description: "Criterio en REVIEW.", leadIds: ["LEAD-00045"] },
  { fixtureSetId: "fx-assignment-exception", description: "Sin responsable elegible.", leadIds: ["LEAD-00046"] },
  { fixtureSetId: "fx-qualified-not-ready", description: "Calificado con bloqueo de readiness.", leadIds: ["LEAD-00047"] },
  { fixtureSetId: "fx-ready-for-conversion", description: "Listo para conversión.", leadIds: ["LEAD-00048"] },
  { fixtureSetId: "fx-empty", description: "Conjunto vacío para estados sin resultados.", leadIds: [] },
];

/* ---------------------------------------------------------------------------
 * Accesores
 * ------------------------------------------------------------------------- */

function protoFindLead(leadId: string): ProtoCanonicalLead | null {
  return PROTO_CANONICAL_LEADS.find((l) => l.leadId === leadId) ?? null;
}

function protoGetFixtureSet(fixtureSetId: string): ProtoFixtureSet | null {
  return PROTO_FIXTURE_SETS.find((s) => s.fixtureSetId === fixtureSetId) ?? null;
}

/** Leads de un fixtureSet, en el orden declarado. */
function protoGetLeads(fixtureSetId: string): ProtoCanonicalLead[] {
  const set = protoGetFixtureSet(fixtureSetId);
  if (!set) return [];
  const leads: ProtoCanonicalLead[] = [];
  set.leadIds.forEach((id) => {
    const lead = protoFindLead(id);
    if (lead) leads.push(lead);
  });
  return leads;
}

function protoGetQualification(leadId: string): ProtoQualification | null {
  return PROTO_QUALIFICATIONS[leadId] ?? null;
}

function protoGetFieldComparisons(leadId: string): ProtoFieldComparison[] {
  return PROTO_FIELD_COMPARISONS.filter((c) => c.leadId === leadId);
}

/** Campos requeridos ausentes para poder iniciar la calificación (§10.3/§10.4). */
function protoMissingRequiredFields(lead: ProtoCanonicalLead): string[] {
  const faltantes: string[] = [];
  const n = lead.commercialNeed;
  if (!lead.contact.email && !lead.contact.phone) faltantes.push("contact.emailOrPhone");
  if (n.productOffering.status !== "CANONICAL") faltantes.push("productOffering");
  if (n.quantity.status !== "CANONICAL") faltantes.push("quantity");
  if (n.unit.status !== "CANONICAL") faltantes.push("unit");
  if (n.geographyDestination.status !== "CANONICAL") faltantes.push("geographyDestination");
  return faltantes;
}

/**
 * ¿El fixture expone esta acción para este lead?
 * Único camino permitido para saberlo: leer `availableActions` del fixture.
 */
function protoLeadPermite(lead: ProtoCanonicalLead, accion: ProtoAction): boolean {
  return lead.availableActions.includes(accion);
}
