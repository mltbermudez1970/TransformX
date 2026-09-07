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

  { routeId: "auth", path: "workspace/auth/", label: "Acceso", parents: [], requiresAuth: false, phase: "PM-UX14-03" },
  { routeId: "system", path: "workspace/system/", label: "Estado del sistema", parents: [], requiresAuth: false, phase: "PM-UX14-03" },
];

/** Árbol de navegación global, según el App Shell aprobado. */
interface ProtoNavNode {
  routeId: string;
  children?: ProtoNavNode[];
}

const PROTO_NAV: ProtoNavNode[] = [
  { routeId: "home" },
  { routeId: "my-work" },
  {
    routeId: "bizcaps",
    children: [
      {
        routeId: "lab-001",
        children: [
          { routeId: "lab-001-leads" },
          { routeId: "lab-001-queue" },
          { routeId: "lab-001-reviews" },
          { routeId: "lab-001-dashboard" },
          { routeId: "lab-001-config" },
        ],
      },
    ],
  },
  { routeId: "capio" },
  { routeId: "administration" },
];

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
