/**
 * Registro de rutas del Workspace autenticado (TX-UX-014-PROT-002).
 *
 * Fuente única para navegación, breadcrumbs y guardas de sesión. Cada página
 * declara su `routeId` en `<body data-route="…">` y el shell resuelve el resto.
 */

interface ProtoRoute {
  routeId: string;
  /** Ruta relativa a la raíz del repositorio. */
  path: string;
  label: string;
  /** Cadena de breadcrumbs por routeId, de la raíz al padre. */
  parents: string[];
  /** Exige sesión simulada con MFA satisfecho. */
  requiresAuth: boolean;
  /** Prompt que construye el contenido operativo de la superficie. */
  phase: string;
}

const PROTO_ROUTES: ProtoRoute[] = [
  { routeId: "home", path: "workspace/", label: "Home", parents: [], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "my-work", path: "workspace/my-work/", label: "My Work", parents: ["home"], requiresAuth: true, phase: "PM-UX14-03" },

  { routeId: "bizcaps", path: "workspace/bizcaps/", label: "BizCaps", parents: ["home"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "lab-001", path: "workspace/bizcaps/lab-001/", label: "LAB-001 Lead Intake & Qualification", parents: ["home", "bizcaps"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "lab-001-leads", path: "workspace/leads/", label: "Leads", parents: ["home", "bizcaps", "lab-001"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "lab-001-queue", path: "workspace/work-queue/", label: "Work Queue", parents: ["home", "bizcaps", "lab-001"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "lab-001-reviews", path: "workspace/reviews/", label: "Reviews", parents: ["home", "bizcaps", "lab-001"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "lab-001-dashboard", path: "workspace/dashboard/", label: "Dashboard", parents: ["home", "bizcaps", "lab-001"], requiresAuth: true, phase: "PM-UX14-04" },
  { routeId: "lab-001-config", path: "workspace/configuration/", label: "Configuration", parents: ["home", "bizcaps", "lab-001"], requiresAuth: true, phase: "PM-UX14-06" },

  // Workspaces especializados: se alcanzan desde Lead Detail, no desde la nav global.
  { routeId: "lab-001-missing-info", path: "workspace/missing-information/", label: "Información faltante", parents: ["home", "bizcaps", "lab-001", "lab-001-leads"], requiresAuth: true, phase: "PM-UX14-04" },
  { routeId: "lab-001-qualification", path: "workspace/qualification/", label: "Calificación", parents: ["home", "bizcaps", "lab-001", "lab-001-leads"], requiresAuth: true, phase: "PM-UX14-04" },
  { routeId: "lab-001-assignment", path: "workspace/assignment/", label: "Asignación", parents: ["home", "bizcaps", "lab-001", "lab-001-leads"], requiresAuth: true, phase: "PM-UX14-05" },
  { routeId: "lab-001-opportunity", path: "workspace/opportunity/", label: "Oportunidad", parents: ["home", "bizcaps", "lab-001", "lab-001-leads"], requiresAuth: true, phase: "PM-UX14-06" },

  { routeId: "capio", path: "workspace/capio/", label: "Capio", parents: ["home"], requiresAuth: true, phase: "PM-UX14-03" },
  { routeId: "administration", path: "workspace/administration/", label: "Administration", parents: ["home"], requiresAuth: true, phase: "PM-UX14-06" },
  // ADM-06…ADM-09 (TX-UX-MTAC-AMD-001 §8) son vistas de una misma ruta: el
  // prototipo es multipágina y el estado del borrador vive en sessionStorage.
  { routeId: "administration-access", path: "workspace/administration/access/", label: "Acceso de usuarios", parents: ["home", "administration"], requiresAuth: true, phase: "TX-UX-MTAC-AMD-001" },

  { routeId: "auth", path: "workspace/auth/", label: "Acceso", parents: [], requiresAuth: false, phase: "PM-UX14-03" },
  { routeId: "system", path: "workspace/system/", label: "Estado del sistema", parents: [], requiresAuth: false, phase: "PM-UX14-03" },
];

/** Árbol de navegación global, según el App Shell aprobado. */
interface ProtoNavNode {
  routeId: string;
  children?: ProtoNavNode[];
}

/** Subárbol operativo de cada BizCap con superficie construida. */
const PROTO_BIZCAP_NAV: Record<string, ProtoNavNode> = {
  "LAB-001": {
    routeId: "lab-001",
    children: [
      { routeId: "lab-001-leads" },
      { routeId: "lab-001-queue" },
      { routeId: "lab-001-reviews" },
      { routeId: "lab-001-dashboard" },
      { routeId: "lab-001-config" },
    ],
  },
};

/**
 * Navegación del Workspace generada desde el contexto de Tenant activo y las
 * asignaciones del usuario (TX-UX-MTAC-AMD-001 §7).
 *
 * Un BizCap sin asignación **no aparece** como superficie operativa: no basta
 * con ocultar enlaces, es que el árbol no lo contiene. Y la administración
 * sólo se ofrece a quien tiene `tenant.administer` en ESTE Tenant, así que el
 * mismo usuario ve menús distintos en organizaciones distintas.
 */
function protoBuildNav(userId: string, tenantId: string | null): ProtoNavNode[] {
  const nav: ProtoNavNode[] = [{ routeId: "home" }, { routeId: "my-work" }];
  if (!tenantId) return nav;

  const asignaciones = protoBizCapAssignmentsOf(userId, tenantId);
  const hijos = asignaciones
    .map((a) => PROTO_BIZCAP_NAV[a.bizCapId])
    .filter((n): n is ProtoNavNode => n !== undefined);

  // El nodo BizCaps se ofrece siempre que haya alguna asignación: el catálogo
  // enumera también las asignadas sin superficie operativa (LAB-002/LAB-003),
  // que se explican allí en vez de fingir un workspace.
  if (asignaciones.length) nav.push({ routeId: "bizcaps", children: hijos });

  nav.push({ routeId: "capio" });

  if (protoTienePermisoEnTenant(userId, tenantId, "tenant.administer")) {
    nav.push({ routeId: "administration", children: [{ routeId: "administration-access" }] });
  }
  return nav;
}

function protoFindRoute(routeId: string): ProtoRoute | null {
  return PROTO_ROUTES.find((r) => r.routeId === routeId) ?? null;
}

/** routeId declarado por la página actual en `<body data-route>`. */
function protoCurrentRouteId(): string {
  return document.body.getAttribute("data-route") ?? "home";
}

function protoCurrentRoute(): ProtoRoute | null {
  return protoFindRoute(protoCurrentRouteId());
}

/** URL navegable de una ruta, preservando modo prototipo y escenario. */
function protoRouteHref(routeId: string, extra?: Record<string, string>): string {
  const route = protoFindRoute(routeId);
  if (!route) return "#";
  const base = protoResolveRoute(route.path);
  if (!extra) return base;
  const url = new URL(base, location.href);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.pathname + url.search;
}
