"use strict";
/**
 * Modelo de acceso multi-Tenant — TX-UX-MTAC-AMD-001 §4, §9.
 *
 *   Identidad ──< Membresía de Tenant ──< Asignación de BizCap ──< roles[]
 *
 * FRONTERA INNEGOCIABLE
 * La UI no deriva semántica de rol. Los permisos efectivos llegan resueltos
 * desde aquí (`protoEffectiveAccess`) y la interfaz los **muestra**; nunca los
 * infiere del nombre del rol ni los recalcula. Los roles son funciones DENTRO
 * de un BizCap: no son cargos, no son globales a la identidad y no se piden al
 * usuario en una pantalla de "elige tu rol" (§14).
 */
/* --- Tenants -------------------------------------------------------------- */
const PROTO_TENANTS = [
    {
        tenantId: "tn-novaplast",
        name: "NovaPlast Industrial S.A.",
        shortName: "NovaPlast",
        initials: "NP",
        industry: "Manufactura de plásticos",
    },
    {
        tenantId: "tn-abc",
        name: "Empresa ABC",
        shortName: "Empresa ABC",
        initials: "AB",
        industry: "Distribución mayorista",
    },
    {
        tenantId: "tn-lumen",
        name: "Lumen Logística",
        shortName: "Lumen",
        initials: "LU",
        industry: "Logística y transporte",
    },
];
function protoFindTenant(tenantId) {
    return PROTO_TENANTS.find((t) => t.tenantId === tenantId) ?? null;
}
/* --- Conjuntos de permisos por función ------------------------------------
 * Se declaran aquí como DATO resuelto por el mock de autorización. La UI los
 * consume tal cual; no los deduce del nombre del rol.
 */
const PROTO_PERMS_SALES_REP = [
    "lead.read", "lead.edit_information", "work.read",
    "missing_information.request", "received_information.review",
    "qualification.read", "qualification.reassess",
    "opportunity_readiness.read",
    "communication.read", "communication.draft", "communication.send",
];
const PROTO_PERMS_HUMAN_REVIEWER = [
    "lead.read", "work.read", "qualification.read",
    "review.read", "review.resolve", "duplicate_review.resolve",
    "communication.read",
];
const PROTO_PERMS_SALES_MANAGER = [
    "lead.read", "work.read", "work.manage", "qualification.read",
    "assignment.read", "assignment.assign", "assignment.reassign", "assignment.override",
    "opportunity_readiness.read", "opportunity.convert",
    "lead.disqualify", "lead.close", "lead.reopen", "lead.requalify",
    "communication.read",
];
const PROTO_PERMS_ORDER_REVIEWER = ["order.review"];
const PROTO_PERMS_TENANT_ADMIN = [
    "tenant.administer", "tenant.user.read", "tenant.access.assign", "tenant.access.revoke",
];
/* --- Membresías ------------------------------------------------------------
 * §9 del amendment. USER-001 es el caso maestro: mismo humano, dos Tenants,
 * BizCaps distintos y varios roles dentro del mismo BizCap.
 */
const PROTO_MEMBERSHIPS = [
    /* === USER-001 · Ana Ruiz — usuaria multi-Tenant ========================= */
    {
        membershipId: "mb-001",
        userId: "USR-001",
        tenantId: "tn-novaplast",
        status: "active",
        bizCaps: [
            {
                bizCapId: "LAB-001",
                // Tres roles simultáneos en el MISMO BizCap: el caso que la enmienda
                // exige demostrar. No se pide elegir uno.
                roles: ["SALES_REPRESENTATIVE", "HUMAN_REVIEWER", "SALES_MANAGER"],
                scopes: ["SELF", "TEAM", "BIZCAP"],
                permissions: [
                    ...PROTO_PERMS_SALES_REP,
                    ...PROTO_PERMS_HUMAN_REVIEWER,
                    ...PROTO_PERMS_SALES_MANAGER,
                ],
                assignedAt: "2026-01-12T09:00:00-05:00",
            },
            {
                bizCapId: "LAB-002",
                roles: ["SALES_REPRESENTATIVE"],
                scopes: ["SELF"],
                permissions: ["lead.read", "communication.read"],
                assignedAt: "2026-02-03T09:00:00-05:00",
            },
        ],
        tenantRoles: [],
        tenantPermissions: [],
        joinedAt: "2026-01-12T09:00:00-05:00",
        note: "Caso maestro: tres roles en LAB-001 y acceso adicional a LAB-002.",
    },
    {
        membershipId: "mb-002",
        userId: "USR-001",
        tenantId: "tn-abc",
        status: "active",
        bizCaps: [
            {
                bizCapId: "LAB-001",
                // Mismo humano, otro Tenant: un único rol y menos alcance.
                roles: ["SALES_REPRESENTATIVE"],
                scopes: ["SELF"],
                permissions: PROTO_PERMS_SALES_REP,
                assignedAt: "2026-03-01T09:00:00-05:00",
            },
            {
                bizCapId: "LAB-003",
                roles: ["ORDER_REVIEWER"],
                scopes: ["BIZCAP"],
                permissions: PROTO_PERMS_ORDER_REVIEWER,
                assignedAt: "2026-03-01T09:00:00-05:00",
            },
        ],
        tenantRoles: [],
        tenantPermissions: [],
        joinedAt: "2026-03-01T09:00:00-05:00",
        note: "El mismo usuario con BizCaps y roles distintos al cambiar de Tenant.",
    },
    /* === USR-003 · Elena Mora — administradora del Tenant =================== */
    {
        membershipId: "mb-003",
        userId: "USR-003",
        tenantId: "tn-novaplast",
        status: "active",
        bizCaps: [
            {
                bizCapId: "LAB-001",
                roles: ["SALES_MANAGER"],
                scopes: ["TEAM", "BIZCAP"],
                permissions: PROTO_PERMS_SALES_MANAGER,
                assignedAt: "2026-01-05T09:00:00-05:00",
            },
        ],
        // Administra ÚNICAMENTE NovaPlast: no hay membresía suya en otro Tenant.
        tenantRoles: ["TENANT_ADMINISTRATOR"],
        tenantPermissions: PROTO_PERMS_TENANT_ADMIN,
        joinedAt: "2026-01-05T09:00:00-05:00",
        note: "TENANT-ADMIN-001: administra usuarios y asignaciones sólo en NovaPlast.",
    },
    /* === USR-002 · Bruno Salas — membresía sin BizCaps ====================== */
    {
        membershipId: "mb-004",
        userId: "USR-002",
        tenantId: "tn-novaplast",
        status: "active",
        bizCaps: [],
        tenantRoles: [],
        tenantPermissions: [],
        joinedAt: "2026-04-02T09:00:00-05:00",
        note: "Pertenece al Tenant pero no tiene ningún BizCap asignado todavía.",
    },
    /* === USR-004 · Hugo Reyes — un solo Tenant (resolución automática) ====== */
    {
        membershipId: "mb-005",
        userId: "USR-004",
        tenantId: "tn-novaplast",
        status: "active",
        bizCaps: [
            {
                bizCapId: "LAB-001",
                roles: ["HUMAN_REVIEWER"],
                scopes: ["BIZCAP"],
                permissions: PROTO_PERMS_HUMAN_REVIEWER,
                assignedAt: "2026-01-20T09:00:00-05:00",
            },
        ],
        tenantRoles: [],
        tenantPermissions: [],
        joinedAt: "2026-01-20T09:00:00-05:00",
        note: "Una sola membresía activa: el Tenant se resuelve sin pedirle nada.",
    },
    /* === USR-004 · membresía REVOCADA en otro Tenant ======================== */
    {
        membershipId: "mb-006",
        userId: "USR-004",
        tenantId: "tn-lumen",
        status: "revoked",
        bizCaps: [
            {
                bizCapId: "LAB-001",
                roles: ["HUMAN_REVIEWER"],
                scopes: ["BIZCAP"],
                permissions: PROTO_PERMS_HUMAN_REVIEWER,
                assignedAt: "2025-11-10T09:00:00-05:00",
            },
        ],
        tenantRoles: [],
        tenantPermissions: [],
        joinedAt: "2025-11-10T09:00:00-05:00",
        note: "Acceso revocado: debe fallar en cerrado, incluso con enlace profundo.",
    },
];
/* --- Consultas -------------------------------------------------------------
 * Todas devuelven DATO del fixture. Ninguna calcula semántica de negocio.
 */
/** Todas las membresías del usuario, en cualquier estado. */
function protoMembershipsOf(userId) {
    return PROTO_MEMBERSHIPS.filter((m) => m.userId === userId);
}
/** Sólo las membresías con las que se puede entrar a un Workspace. */
function protoActiveMembershipsOf(userId) {
    return protoMembershipsOf(userId).filter((m) => m.status === "active");
}
function protoFindMembership(userId, tenantId) {
    return PROTO_MEMBERSHIPS.find((m) => m.userId === userId && m.tenantId === tenantId) ?? null;
}
/** Asignaciones de BizCap del usuario en ese Tenant. Vacío si no hay membresía. */
function protoBizCapAssignmentsOf(userId, tenantId) {
    const m = protoFindMembership(userId, tenantId);
    if (!m || m.status !== "active")
        return [];
    return m.bizCaps;
}
function protoBizCapAssignment(userId, tenantId, bizCapId) {
    return protoBizCapAssignmentsOf(userId, tenantId).find((b) => b.bizCapId === bizCapId) ?? null;
}
function protoEffectiveAccess(userId, tenantId) {
    const m = protoFindMembership(userId, tenantId);
    if (!m || m.status !== "active") {
        return {
            userId, tenantId,
            status: m ? m.status : "none",
            bizCapIds: [], rolesByBizCap: [], roles: [], scopes: [], permissions: [],
        };
    }
    const roles = new Set();
    const scopes = new Set();
    const permissions = new Set();
    m.bizCaps.forEach((b) => {
        b.roles.forEach((r) => roles.add(r));
        b.scopes.forEach((s) => scopes.add(s));
        b.permissions.forEach((p) => permissions.add(p));
    });
    m.tenantRoles.forEach((r) => roles.add(r));
    m.tenantPermissions.forEach((p) => permissions.add(p));
    return {
        userId,
        tenantId,
        status: m.status,
        bizCapIds: m.bizCaps.map((b) => b.bizCapId),
        rolesByBizCap: m.bizCaps.map((b) => ({ bizCapId: b.bizCapId, roles: b.roles })),
        roles: [...roles],
        scopes: [...scopes],
        permissions: [...permissions],
    };
}
/** ¿El usuario tiene ese permiso en ese Tenant? Lectura, no inferencia. */
function protoTienePermisoEnTenant(userId, tenantId, permiso) {
    return protoEffectiveAccess(userId, tenantId).permissions.includes(permiso);
}
/** ¿El usuario puede operar ese BizCap en ese Tenant? */
function protoTieneBizCap(userId, tenantId, bizCapId) {
    return protoBizCapAssignmentsOf(userId, tenantId).some((b) => b.bizCapId === bizCapId);
}
/** Etiqueta legible de una lista de roles, para chips y resúmenes. */
function protoRolesLabel(roles) {
    return roles.map((r) => PROTO_ROLE_LABEL[r]).join(" · ");
}
/**
 * Administradores de Tenant activos. Sirve a la guarda de bloqueo
 * administrativo: quitar el último deja al Tenant sin quien lo administre.
 */
function protoTenantAdminsOf(tenantId) {
    return PROTO_MEMBERSHIPS.filter((m) => m.tenantId === tenantId &&
        m.status === "active" &&
        m.tenantRoles.includes("TENANT_ADMINISTRATOR"));
}
/** Miembros del Tenant, para ADM-06. */
function protoTenantMembers(tenantId) {
    return PROTO_MEMBERSHIPS.filter((m) => m.tenantId === tenantId);
}
