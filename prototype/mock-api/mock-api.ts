/**
 * Mock API — simulador de respuestas para el prototipo autenticado.
 *
 * ALCANCE: simula únicamente la FORMA de la respuesta y su latencia, para que
 * las superficies de UX puedan mostrar estados de carga, error y conflicto.
 *
 * NO ES: una réplica del dominio productivo. No evalúa reglas BDR, no calcula
 * `availableActions`, no ejecuta transiciones de state machine, no resuelve
 * permisos ni calificación. Todo eso llega como dato precargado desde
 * `prototype/fixtures` y `prototype/scenarios`, definido por UX-10…UX-14.
 */

/** Fase de la operación (la carga es una fase, no un desenlace terminal). */
type ProtoPhase = "idle" | "loading" | "settled";

/** Desenlaces terminales soportados por el prototipo. */
type ProtoOutcomeKind =
  | "success"
  | "validation_error"
  | "business_conflict"
  | "stale"
  | "permission_denied"
  | "recoverable_error";

interface ProtoFieldError {
  field: string;
  message: string;
}

interface ProtoResponse<T> {
  requestId: string;
  operationId: string;
  kind: ProtoOutcomeKind;
  ok: boolean;
  /** Payload sintético; sólo presente cuando `kind === "success"`. */
  data: T | null;
  /** Mensaje orientado a UI, en español. */
  message: string;
  /** Errores por campo; sólo para `validation_error`. */
  fieldErrors: ProtoFieldError[];
  /** True cuando la UI debe ofrecer reintentar. */
  retryable: boolean;
  /** True cuando la UI debe ofrecer recargar datos antes de reintentar. */
  requiresRefresh: boolean;
}

interface ProtoRequestOptions<T> {
  operationId: string;
  /** Desenlace forzado; por defecto `success`. Lo fija el escenario activo. */
  outcome?: ProtoOutcomeKind;
  /** Payload sintético a devolver en caso de éxito. */
  data?: T;
  /** Latencia simulada en ms (por defecto PROTO_DEFAULT_LATENCY_MS). */
  latencyMs?: number;
  /** Mensaje que sustituye al mensaje por defecto del desenlace. */
  message?: string;
  fieldErrors?: ProtoFieldError[];
  /** Callback invocado al entrar en fase `loading`. */
  onPhaseChange?: (phase: ProtoPhase) => void;
}

const PROTO_DEFAULT_LATENCY_MS = 450;

const PROTO_OUTCOME_DEFAULTS: Record<
  ProtoOutcomeKind,
  { ok: boolean; message: string; retryable: boolean; requiresRefresh: boolean }
> = {
  success: {
    ok: true,
    message: "Operación completada.",
    retryable: false,
    requiresRefresh: false,
  },
  validation_error: {
    ok: false,
    message: "Revisa los campos marcados antes de continuar.",
    retryable: false,
    requiresRefresh: false,
  },
  business_conflict: {
    ok: false,
    message: "La acción no es válida para el estado actual del registro.",
    retryable: false,
    requiresRefresh: true,
  },
  stale: {
    ok: false,
    message: "Otro usuario actualizó este registro. Recarga para ver la versión vigente.",
    retryable: false,
    requiresRefresh: true,
  },
  permission_denied: {
    ok: false,
    message: "No tienes permiso para ejecutar esta acción.",
    retryable: false,
    requiresRefresh: false,
  },
  recoverable_error: {
    ok: false,
    message: "No pudimos completar la operación. Puedes reintentar.",
    retryable: true,
    requiresRefresh: false,
  },
};

let protoRequestCounter = 0;

function protoNextRequestId(): string {
  protoRequestCounter += 1;
  return `req-${String(protoRequestCounter).padStart(4, "0")}`;
}

function protoDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Ejecuta una operación simulada y resuelve con el desenlace indicado.
 * El desenlace es determinístico: lo decide el escenario, no el azar.
 */
async function protoMockRequest<T>(options: ProtoRequestOptions<T>): Promise<ProtoResponse<T>> {
  const kind: ProtoOutcomeKind = options.outcome ?? "success";
  const defaults = PROTO_OUTCOME_DEFAULTS[kind];

  options.onPhaseChange?.("loading");
  await protoDelay(options.latencyMs ?? PROTO_DEFAULT_LATENCY_MS);
  options.onPhaseChange?.("settled");

  return {
    requestId: protoNextRequestId(),
    operationId: options.operationId,
    kind,
    ok: defaults.ok,
    data: kind === "success" ? options.data ?? null : null,
    message: options.message ?? defaults.message,
    fieldErrors: kind === "validation_error" ? options.fieldErrors ?? [] : [],
    retryable: defaults.retryable,
    requiresRefresh: defaults.requiresRefresh,
  };
}
