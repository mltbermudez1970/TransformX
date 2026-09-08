/**
 * Administración de acceso del Tenant — TX-UX-MTAC-AMD-001 §8.
 *
 * La primitiva de administración es el **rol dentro de un BizCap**, no el
 * permiso suelto. Aquí se modela qué puede cambiar un administrador, qué
 * consecuencias tiene y qué guardas lo detienen. Las guardas son DATO del
 * mock: la UI no decide si un cambio es peligroso, lo pregunta.
 */

/** Una línea del cambio propuesto, antes de confirmarlo (ADM-09). */
interface ProtoAccessChange {
  kind: "BIZCAP_ADDED" | "BIZCAP_REMOVED" | "ROLE_ADDED" | "ROLE_REMOVED";
  bizCapId: ProtoBizCapId;
  role?: ProtoRole;
  /** Qué implica en la práctica para la persona administrada. */
  consequence: string;
}

/** Advertencia de gobernanza. `blocking` detiene la confirmación. */
interface ProtoAccessWarning {
  code: "LAST_TENANT_ADMIN" | "REMOVES_ALL_ACCESS" | "SELF_DOWNGRADE" | "STEP_UP_REQUIRED";
  message: string;
  blocking: boolean;
}

interface ProtoAccessChangeSet {
  userId: string;
  tenantId: string;
  changes: ProtoAccessChange[];
  warnings: ProtoAccessWarning[];
  /** Simulación de step-up (§8): un cambio sensible exige re-verificación. */
  requiresStepUp: boolean;
}

/**
 * Borrador editable: BizCap → roles seleccionados.
 *
 * La clave reservada `__TENANT__` guarda los roles de organización (hoy sólo
 * TENANT_ADMINISTRATOR). No es un BizCap: administrar el acceso de la
 * organización no es una función dentro de una capacidad de negocio.
 */
type ProtoAccessDraft = Record<string, ProtoRole[]>;

const PROTO_TENANT_ROLE_KEY = "__TENANT__";
const PROTO_ASSIGNABLE_TENANT_ROLES: ProtoRole[] = ["TENANT_ADMINISTRATOR"];

/** Roles ofrecibles por BizCap. Catálogo del fixture, no inferencia. */
const PROTO_ASSIGNABLE_ROLES: Record<ProtoBizCapId, ProtoRole[]> = {
  "LAB-001": [
    "SALES_REPRESENTATIVE",
    "SALES_OPERATIONS_ANALYST",
    "SALES_MANAGER",
    "HUMAN_REVIEWER",
    "BIZCAP_ADMINISTRATOR",
  ],
  "LAB-002": ["SALES_REPRESENTATIVE", "BIZCAP_ADMINISTRATOR"],
  "LAB-003": ["ORDER_REVIEWER", "BIZCAP_ADMINISTRATOR"],
};

/** Borrador inicial = estado actual de la membresía. */
function protoAccessDraftFrom(userId: string, tenantId: string): ProtoAccessDraft {
  const draft: ProtoAccessDraft = {};
  protoBizCapAssignmentsOf(userId, tenantId).forEach((a) => {
    draft[a.bizCapId] = [...a.roles];
  });
  const m = protoFindMembership(userId, tenantId);
  if (m && m.tenantRoles.length) draft[PROTO_TENANT_ROLE_KEY] = [...m.tenantRoles];
  return draft;
}

/**
 * Compara el borrador con el estado actual y devuelve el conjunto de cambios
 * materiales con sus consecuencias y advertencias.
 *
 * Quitar un BizCap arrastra TODOS los roles del usuario en ese BizCap dentro
 * de ese Tenant: se enuncia explícitamente, no se deja implícito.
 */
function protoAccessChangeSet(
  userId: string,
  tenantId: string,
  draft: ProtoAccessDraft,
  actorUserId: string
): ProtoAccessChangeSet {
  const actuales = protoBizCapAssignmentsOf(userId, tenantId);
  const actualPorBizCap = new Map<string, ProtoRole[]>(
    actuales.map((a) => [a.bizCapId, a.roles])
  );

  const changes: ProtoAccessChange[] = [];

  // BizCaps añadidos o con roles cambiados.
  Object.entries(draft).forEach(([bizCapId, roles]) => {
    if (bizCapId === PROTO_TENANT_ROLE_KEY) return;   // se trata aparte
    const def = protoFindBizCap(bizCapId);
    const previos = actualPorBizCap.get(bizCapId);
    const nombre = def ? `${def.bizCapId} ${def.name}` : bizCapId;

    if (!previos) {
      if (!roles.length) return;      // seleccionado sin roles: no es un cambio
      changes.push({
        kind: "BIZCAP_ADDED",
        bizCapId: bizCapId as ProtoBizCapId,
        consequence: def && !def.hasOperationalSurface
          ? `Gana acceso a ${nombre}. Esta BizCap todavía no tiene superficie operativa en el prototipo: la asignación queda registrada pero no abre pantallas de trabajo.`
          : `Gana acceso operativo a ${nombre}.`,
      });
      roles.forEach((r) =>
        changes.push({
          kind: "ROLE_ADDED", bizCapId: bizCapId as ProtoBizCapId, role: r,
          consequence: `Podrá ejercer ${PROTO_ROLE_LABEL[r]} dentro de ${nombre}.`,
        })
      );
      return;
    }

    roles.filter((r) => !previos.includes(r)).forEach((r) =>
      changes.push({
        kind: "ROLE_ADDED", bizCapId: bizCapId as ProtoBizCapId, role: r,
        consequence: `Añade la función ${PROTO_ROLE_LABEL[r]} en ${nombre}, junto a las que ya tenía.`,
      })
    );
    previos.filter((r) => !roles.includes(r)).forEach((r) =>
      changes.push({
        kind: "ROLE_REMOVED", bizCapId: bizCapId as ProtoBizCapId, role: r,
        consequence: `Deja de ejercer ${PROTO_ROLE_LABEL[r]} en ${nombre}.`,
      })
    );
  });

  // BizCaps retirados por completo.
  actuales
    .filter((a) => !(a.bizCapId in draft))
    .forEach((a) => {
      const def = protoFindBizCap(a.bizCapId);
      const nombre = def ? `${def.bizCapId} ${def.name}` : a.bizCapId;
      changes.push({
        kind: "BIZCAP_REMOVED",
        bizCapId: a.bizCapId,
        consequence: `Pierde el acceso a ${nombre} y, con él, ${a.roles.length === 1 ? "el rol" : `los ${String(a.roles.length)} roles`} que tenía ahí: ${protoRolesLabel(a.roles)}.`,
      });
    });

  // Roles de organización (fuera de todo BizCap).
  const mActual = protoFindMembership(userId, tenantId);
  const tenantAntes = mActual ? mActual.tenantRoles : [];
  const tenantDespues = draft[PROTO_TENANT_ROLE_KEY] ?? [];
  tenantDespues.filter((r) => !tenantAntes.includes(r)).forEach((r) =>
    changes.push({
      kind: "ROLE_ADDED", bizCapId: "LAB-001", role: r,
      consequence: `Podrá administrar el acceso de esta organización: asignar BizCaps y roles a otras personas.`,
    })
  );
  tenantAntes.filter((r) => !tenantDespues.includes(r)).forEach((r) =>
    changes.push({
      kind: "ROLE_REMOVED", bizCapId: "LAB-001", role: r,
      consequence: `Dejará de administrar el acceso de esta organización.`,
    })
  );

  /* --- Guardas de gobernanza -------------------------------------------- */

  const warnings: ProtoAccessWarning[] = [];
  const quedaSinAcceso =
    Object.entries(draft)
      .filter(([k]) => k !== PROTO_TENANT_ROLE_KEY)
      .every(([, r]) => r.length === 0) && actuales.length > 0;

  if (quedaSinAcceso) {
    warnings.push({
      code: "REMOVES_ALL_ACCESS",
      message:
        "Con estos cambios la persona conserva su membresía pero se queda sin ninguna BizCap: podrá entrar a la organización y no tendrá nada operativo que hacer.",
      blocking: false,
    });
  }

  // Bloqueo administrativo: no se puede dejar al Tenant sin administrador.
  const eraAdmin = tenantAntes.includes("TENANT_ADMINISTRATOR");
  const sigueAdmin = tenantDespues.includes("TENANT_ADMINISTRATOR");
  const admins = protoTenantAdminsOf(tenantId);
  if (eraAdmin && !sigueAdmin && admins.length <= 1) {
    warnings.push({
      code: "LAST_TENANT_ADMIN",
      message:
        "Es la última persona que puede administrar el acceso de esta organización. Si le retiras la administración, nadie podrá volver a conceder accesos, ni siquiera tú.",
      blocking: true,
    });
  }
  if (userId === actorUserId) {
    warnings.push({
      code: "SELF_DOWNGRADE",
      message: "Estás modificando tu propio acceso. El cambio te afectará en cuanto se aplique.",
      blocking: false,
    });
  }

  // Step-up: conceder administración o retirar acceso por completo.
  const concedeAdmin = !eraAdmin && sigueAdmin;
  const requiresStepUp = concedeAdmin || changes.some((c) => c.kind === "BIZCAP_REMOVED");
  if (requiresStepUp) {
    warnings.push({
      code: "STEP_UP_REQUIRED",
      message: "Este cambio es sensible: exige verificación adicional antes de aplicarse.",
      blocking: false,
    });
  }

  return { userId, tenantId, changes, warnings, requiresStepUp };
}

/**
 * Aplica el cambio sobre los fixtures en memoria y lo persiste para que
 * sobreviva a la navegación (el prototipo es multipágina).
 *
 * Es simulación: no hay backend, no hay evento de dominio y el efecto se
 * pierde al reiniciar el escenario. Lo que sí es real es la **consecuencia
 * observable**: el usuario administrado ve otra navegación al entrar.
 */
const PROTO_ACCESS_OVERRIDE_KEY = "transformx-prototype-access-overrides";

function protoApplyAccessChange(
  userId: string,
  tenantId: string,
  draft: ProtoAccessDraft
): void {
  const m = protoFindMembership(userId, tenantId);
  if (!m) return;

  const previos = new Map<string, ProtoBizCapAssignment>(m.bizCaps.map((a) => [a.bizCapId, a]));

  m.bizCaps = Object.entries(draft)
    .filter(([k, roles]) => k !== PROTO_TENANT_ROLE_KEY && roles.length > 0)
    .map(([bizCapId, roles]) => {
      const prev = previos.get(bizCapId);
      return {
        bizCapId: bizCapId as ProtoBizCapId,
        roles: [...roles],
        scopes: prev ? prev.scopes : ["SELF"],
        // Los permisos los resuelve el mock de autorización a partir del rol:
        // la UI nunca los compone.
        permissions: protoPermissionsForRoles(roles),
        assignedAt: prev ? prev.assignedAt : new Date().toISOString(),
      };
    });

  // El permiso de administración sigue al rol de organización, no al de BizCap.
  m.tenantRoles = draft[PROTO_TENANT_ROLE_KEY] ?? [];
  m.tenantPermissions = m.tenantRoles.includes("TENANT_ADMINISTRATOR")
    ? [...PROTO_PERMS_TENANT_ADMIN]
    : [];

  protoPersistAccessOverride(userId, tenantId, m.bizCaps, m.tenantRoles, m.tenantPermissions);
}

/** Resolución rol → permisos del mock de autorización. */
function protoPermissionsForRoles(roles: ProtoRole[]): ProtoPermission[] {
  const out = new Set<ProtoPermission>();
  roles.forEach((r) => {
    if (r === "SALES_REPRESENTATIVE") PROTO_PERMS_SALES_REP.forEach((p) => out.add(p));
    if (r === "HUMAN_REVIEWER") PROTO_PERMS_HUMAN_REVIEWER.forEach((p) => out.add(p));
    if (r === "SALES_MANAGER") PROTO_PERMS_SALES_MANAGER.forEach((p) => out.add(p));
    if (r === "ORDER_REVIEWER") PROTO_PERMS_ORDER_REVIEWER.forEach((p) => out.add(p));
    if (r === "TENANT_ADMINISTRATOR") PROTO_PERMS_TENANT_ADMIN.forEach((p) => out.add(p));
    if (r === "SALES_OPERATIONS_ANALYST") {
      (["lead.read", "work.read", "work.manage", "qualification.read", "assignment.read"] as ProtoPermission[])
        .forEach((p) => out.add(p));
    }
    if (r === "BIZCAP_ADMINISTRATOR") out.add("bizcap.configure");
  });
  return [...out];
}

/* --- Persistencia del cambio simulado -------------------------------------
 * Vive en sessionStorage porque el prototipo es multipágina: sin esto, el
 * cambio se perdería al navegar y no se podría demostrar VJ-12.
 */

interface ProtoAccessOverride {
  userId: string;
  tenantId: string;
  bizCaps: ProtoBizCapAssignment[];
  tenantRoles: ProtoRole[];
  tenantPermissions: ProtoPermission[];
}

function protoReadAccessOverrides(): ProtoAccessOverride[] {
  try {
    const raw = sessionStorage.getItem(PROTO_ACCESS_OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as ProtoAccessOverride[]) : [];
  } catch {
    return [];
  }
}

function protoPersistAccessOverride(
  userId: string,
  tenantId: string,
  bizCaps: ProtoBizCapAssignment[],
  tenantRoles: ProtoRole[],
  tenantPermissions: ProtoPermission[]
): void {
  try {
    const todos = protoReadAccessOverrides().filter(
      (o) => !(o.userId === userId && o.tenantId === tenantId)
    );
    todos.push({ userId, tenantId, bizCaps, tenantRoles, tenantPermissions });
    sessionStorage.setItem(PROTO_ACCESS_OVERRIDE_KEY, JSON.stringify(todos));
  } catch {
    /* sessionStorage no disponible */
  }
}

/**
 * Rehidrata los cambios de acceso aplicados en esta sesión sobre los fixtures.
 * Se llama una vez al cargar la capa de prototipo, antes de que ninguna
 * superficie lea membresías.
 */
function protoRehydrateAccessOverrides(): void {
  protoReadAccessOverrides().forEach((o) => {
    const m = protoFindMembership(o.userId, o.tenantId);
    if (!m) return;
    m.bizCaps = o.bizCaps;
    m.tenantRoles = o.tenantRoles ?? [];
    m.tenantPermissions = o.tenantPermissions;
  });
}

protoRehydrateAccessOverrides();
