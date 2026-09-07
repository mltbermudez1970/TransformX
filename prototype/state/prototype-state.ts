/**
 * Prototype state — coordinación de escenario, fixtures y navegación.
 *
 * ALCANCE ESTRICTO: elegir qué escenario está activo, resolver sus fixtures y
 * construir rutas de navegación coherentes dentro del prototipo.
 *
 * NO ES una state machine: no guarda ni transiciona estados de dominio, no
 * deriva `availableActions` ni resuelve permisos. Esos valores son datos de
 * escenario provenientes de UX-10…UX-14.
 *
 * Orden de carga requerido en cada página del workspace:
 *   fixtures.js → scenarios.js → mock-api.js → prototype-mode.js → prototype-state.js
 */

const PROTO_SCENARIO_STORAGE_KEY = "transformx-prototype-scenario";
const PROTO_SCENARIO_PARAM = "scenario";

function protoReadStoredScenarioId(): string | null {
  try {
    return sessionStorage.getItem(PROTO_SCENARIO_STORAGE_KEY);
  } catch {
    /* sessionStorage no disponible */
    return null;
  }
}

/** Escenario activo: query string > sesión > escenario por defecto. */
function protoGetActiveScenarioId(): string {
  const fromQuery = new URLSearchParams(location.search).get(PROTO_SCENARIO_PARAM);
  if (fromQuery && protoGetScenario(fromQuery)) {
    protoSetActiveScenario(fromQuery);
    return fromQuery;
  }

  const stored = protoReadStoredScenarioId();
  if (stored && protoGetScenario(stored)) return stored;

  return PROTO_DEFAULT_SCENARIO_ID;
}

function protoSetActiveScenario(scenarioId: string): void {
  if (!protoGetScenario(scenarioId)) return;
  try {
    sessionStorage.setItem(PROTO_SCENARIO_STORAGE_KEY, scenarioId);
  } catch {
    /* sessionStorage no disponible */
  }
}

function protoGetActiveScenario(): ProtoScenario | null {
  return protoGetScenario(protoGetActiveScenarioId());
}

/** Actor del escenario activo, resuelto contra los fixtures. */
function protoGetActiveActor(): ProtoActor | null {
  const scenario = protoGetActiveScenario();
  if (!scenario) return null;
  return PROTO_ACTORS.find((actor) => actor.actorId === scenario.actor) ?? null;
}

/** Leads del fixtureSet declarado por el escenario activo. */
function protoGetActiveLeads(): ProtoCanonicalLead[] {
  const scenario = protoGetActiveScenario();
  if (!scenario) return [];
  return protoGetLeads(scenario.fixtureSet);
}

/**
 * Base del sitio para construir rutas relativas al repositorio, tanto si la
 * página está bajo `/workspace/...` como si es una página pública.
 */
function protoGetSiteBase(): string {
  const marker = "/workspace/";
  const index = location.pathname.indexOf(marker);
  if (index !== -1) return location.pathname.slice(0, index + 1);
  return location.pathname.replace(/[^/]*$/, "");
}

/**
 * Convierte una ruta del catálogo ("workspace/leads/") en URL navegable.
 *
 * La ruta puede traer ya su propia query — los `targetRoute` de los fixtures
 * son de esa forma ("workspace/qualification/?leadId=LEAD-00045"). Esos
 * parámetros se conservan y se fusionan: concatenar un segundo `?` dejaba el
 * valor del último parámetro absorbiendo `prototype=true`
 * (`leadId=LEAD-00047?prototype=true`), y toda acción de work item terminaba
 * en SYS-02 "no encontrado".
 */
function protoResolveRoute(route: string, scenarioId?: string): string {
  const limpia = route.replace(/^\/+/, "");
  const hashAt = limpia.indexOf("#");
  const hash = hashAt >= 0 ? limpia.slice(hashAt) : "";
  const sinHash = hashAt >= 0 ? limpia.slice(0, hashAt) : limpia;
  const queryAt = sinHash.indexOf("?");
  const ruta = queryAt >= 0 ? sinHash.slice(0, queryAt) : sinHash;

  const params = new URLSearchParams(queryAt >= 0 ? sinHash.slice(queryAt + 1) : "");
  params.set("prototype", "true");
  params.set(PROTO_SCENARIO_PARAM, scenarioId ?? protoGetActiveScenarioId());
  return `${protoGetSiteBase()}${ruta}?${params.toString()}${hash}`;
}

/** Navega dentro del prototipo preservando modo y escenario. */
function protoNavigate(route: string, scenarioId?: string): void {
  if (scenarioId) protoSetActiveScenario(scenarioId);
  location.assign(protoResolveRoute(route, scenarioId));
}

/** Limpia la coordinación de escenario/modo (no borra fixtures: son constantes). */
function protoResetPrototypeState(): void {
  try {
    sessionStorage.removeItem(PROTO_SCENARIO_STORAGE_KEY);
    sessionStorage.removeItem(PROTO_MODE_STORAGE_KEY);
  } catch {
    /* sessionStorage no disponible */
  }
}
