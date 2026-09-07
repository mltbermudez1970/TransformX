/**
 * Comunicaciones del Lead (Addendum §8).
 *
 * Registro cronológico de comunicación entrante y saliente asociada al Lead.
 *
 * Reglas duras:
 *  - `DISPATCHED` es el único estado saliente que sirve como evidencia de
 *    primera respuesta. `FAILED` no cuenta; `DRAFT` y `QUEUED` tampoco.
 *  - Las comunicaciones NO actualizan Canonical Facts. La información del
 *    cliente pasa por MI-03 antes de aceptarse como canónica.
 *  - Un borrador asistido por IA sigue etiquetado como asistencia de IA hasta
 *    que una persona lo envía o aprueba.
 *  - La disponibilidad de canal es dato de configuración: no todos los canales
 *    están habilitados para todos los tenants.
 */

interface ProtoCommunicationActor {
  actorType: ProtoCommunicationActorType;
  displayName: string;
  contactId?: string;
}

interface ProtoCommunication {
  communicationId: string;
  leadId: string;
  direction: ProtoCommunicationDirection;
  channel: ProtoCommunicationChannel;
  status: ProtoCommunicationStatus;
  purpose: string;
  subject?: string;
  summary: string;
  contentPreview?: string;
  from: ProtoCommunicationActor;
  to?: ProtoCommunicationActor;
  relatedWorkItemId?: string;
  relatedRequestId?: string;
  createdAt: string;
  dispatchedAt?: string | null;
  receivedAt?: string | null;
  failedAt?: string | null;
  failureCode?: string | null;
  /** Provisto por el fixture: el frontend no lo deduce. */
  isFirstResponse: boolean;
  provenance?: { createdBy: string; draftAssistance?: string };
  availableActions?: ProtoAction[];
}

/** Canales habilitados para la organización sintética (dato de configuración). */
const PROTO_ENABLED_CHANNELS: ProtoCommunicationChannel[] = [
  "WEB_FORM", "SECURE_CLARIFICATION", "EMAIL", "SYSTEM_MESSAGE",
];

const PROTO_COMMUNICATIONS: ProtoCommunication[] = [
  // --- LEAD-00041 (S-01): consulta entrante + primera respuesta válida ---
  {
    communicationId: "COM-0090",
    leadId: "LEAD-00041",
    direction: "INBOUND",
    channel: "WEB_FORM",
    status: "RECEIVED",
    purpose: "COMMERCIAL_INQUIRY",
    summary: "Consulta inicial con producto, volumen y destino.",
    from: { actorType: "HUMAN", displayName: "Carla Méndez", contactId: "CONT-0041" },
    createdAt: "2026-09-01T13:05:00-05:00",
    receivedAt: "2026-09-01T13:05:00-05:00",
    isFirstResponse: false,
  },
  {
    communicationId: "COM-0091",
    leadId: "LEAD-00041",
    direction: "OUTBOUND",
    channel: "EMAIL",
    status: "DISPATCHED",
    purpose: "FIRST_RESPONSE",
    subject: "Recibimos tu consulta",
    summary: "Acuse de recibo y confirmación de siguientes pasos.",
    contentPreview: "Gracias por contactarnos. Estamos revisando tu solicitud y…",
    from: { actorType: "HUMAN", displayName: "Ana Ruiz" },
    to: { actorType: "HUMAN", displayName: "Carla Méndez", contactId: "CONT-0041" },
    createdAt: "2026-09-01T13:40:00-05:00",
    dispatchedAt: "2026-09-01T13:41:00-05:00",
    isFirstResponse: true,
    provenance: { createdBy: "USR-001" },
  },

  // --- LEAD-00042 (S-02): borrador asistido por IA, aún sin enviar ---
  {
    communicationId: "COM-0095",
    leadId: "LEAD-00042",
    direction: "INBOUND",
    channel: "WEB_FORM",
    status: "RECEIVED",
    purpose: "COMMERCIAL_INQUIRY",
    summary: "Consulta sin cantidad ni unidad declaradas.",
    from: { actorType: "HUMAN", displayName: "Laura Chen", contactId: "CONT-0042" },
    createdAt: "2026-09-04T13:14:00-05:00",
    receivedAt: "2026-09-04T13:14:00-05:00",
    isFirstResponse: false,
  },
  {
    communicationId: "COM-0098",
    leadId: "LEAD-00042",
    direction: "OUTBOUND",
    channel: "EMAIL",
    status: "DRAFT",
    purpose: "MISSING_INFORMATION_REQUEST",
    subject: "Información adicional para continuar",
    summary: "Borrador para solicitar cantidad y unidad.",
    contentPreview: "Para continuar con la evaluación necesitamos confirmar la cantidad mensual estimada y su unidad de medida…",
    from: { actorType: "AI_ASSISTED_HUMAN", displayName: "Ana Ruiz" },
    to: { actorType: "HUMAN", displayName: "Laura Chen", contactId: "CONT-0042" },
    relatedWorkItemId: "WI-0042",
    relatedRequestId: "MIR-0017",
    createdAt: "2026-09-04T15:30:00-05:00",
    dispatchedAt: null,
    // Un borrador NO cuenta como primera respuesta ni inicia espera del cliente.
    isFirstResponse: false,
    provenance: { createdBy: "USR-001", draftAssistance: "AI_T12" },
    availableActions: ["SEND_INFORMATION_REQUEST", "CREATE_COMMUNICATION_DRAFT"],
  },

  // --- LEAD-00043 (S-03): envío fallido + aclaración entrante ---
  {
    communicationId: "COM-0100",
    leadId: "LEAD-00043",
    direction: "OUTBOUND",
    channel: "EMAIL",
    status: "FAILED",
    purpose: "MISSING_INFORMATION_REQUEST",
    subject: "Confirmación de cantidad",
    summary: "El envío falló: dirección de correo rechazada.",
    from: { actorType: "AI_ASSISTED_HUMAN", displayName: "Ana Ruiz" },
    to: { actorType: "HUMAN", displayName: "Diego Prado", contactId: "CONT-0043" },
    relatedWorkItemId: "WI-0043",
    createdAt: "2026-09-04T14:50:00-05:00",
    failedAt: "2026-09-04T14:51:00-05:00",
    failureCode: "RECIPIENT_REJECTED",
    // FAILED no cuenta como primera respuesta válida.
    isFirstResponse: false,
    provenance: { createdBy: "USR-001", draftAssistance: "AI_T12" },
    availableActions: ["RETRY_COMMUNICATION"],
  },
  {
    communicationId: "COM-0102",
    leadId: "LEAD-00043",
    direction: "INBOUND",
    channel: "SECURE_CLARIFICATION",
    status: "RECEIVED",
    purpose: "CUSTOMER_CLARIFICATION",
    summary: "El cliente informó 25 000 unidades mensuales.",
    from: { actorType: "HUMAN", displayName: "Diego Prado", contactId: "CONT-0043" },
    relatedWorkItemId: "WI-0043",
    createdAt: "2026-09-04T16:12:00-05:00",
    receivedAt: "2026-09-04T16:12:00-05:00",
    isFirstResponse: false,
  },

  // --- LEAD-00045 (S-05) ---
  {
    communicationId: "COM-0105",
    leadId: "LEAD-00045",
    direction: "INBOUND",
    channel: "WEB_FORM",
    status: "RECEIVED",
    purpose: "COMMERCIAL_INQUIRY",
    summary: "Consulta con volumen por debajo del umbral configurado.",
    from: { actorType: "HUMAN", displayName: "Fabián Cruz", contactId: "CONT-0045" },
    createdAt: "2026-09-03T08:02:00-05:00",
    receivedAt: "2026-09-03T08:02:00-05:00",
    isFirstResponse: false,
  },
  {
    communicationId: "COM-0106",
    leadId: "LEAD-00045",
    direction: "OUTBOUND",
    channel: "SYSTEM_MESSAGE",
    status: "DISPATCHED",
    purpose: "FIRST_RESPONSE",
    summary: "Acuse automático de recepción.",
    from: { actorType: "SYSTEM_GENERATED", displayName: "TransformX" },
    to: { actorType: "HUMAN", displayName: "Fabián Cruz", contactId: "CONT-0045" },
    createdAt: "2026-09-03T08:03:00-05:00",
    dispatchedAt: "2026-09-03T08:03:00-05:00",
    isFirstResponse: true,
  },
];

/** Comunicaciones del lead, más recientes primero (convención explícita). */
function protoGetCommunications(leadId: string): ProtoCommunication[] {
  return PROTO_COMMUNICATIONS.filter((c) => c.leadId === leadId).sort((a, b) =>
    (b.receivedAt ?? b.dispatchedAt ?? b.createdAt).localeCompare(a.receivedAt ?? a.dispatchedAt ?? a.createdAt)
  );
}

/** Evidencia de primera respuesta válida, si existe. */
function protoGetFirstResponse(leadId: string): ProtoCommunication | null {
  return (
    PROTO_COMMUNICATIONS.find(
      (c) => c.leadId === leadId && c.isFirstResponse && protoEsPrimeraRespuestaValida(c.status, c.direction)
    ) ?? null
  );
}
