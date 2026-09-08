/**
 * Fixtures de identidad, rol, permisos y política — prototipo AUTH/MFA.
 *
 * REGLA CENTRAL: aquí NO hay credenciales. No se almacena ninguna contraseña,
 * hash, secreto TOTP ni código de recuperación real. El prototipo decide el
 * desenlace a partir de `scriptedOutcome` del perfil sintético, no de lo que
 * el usuario teclee. Tampoco hay IdP, OAuth, proveedor MFA ni backend.
 *
 * MODELO DE IDENTIDAD (Resolution Package §8 + TX-UX-MTAC-AMD-001 §4):
 * Rol ≠ Permiso ≠ Ámbito, y ninguno de los tres pertenece a la identidad.
 * `ProtoAuthUser` es **identidad pura**: quién es la persona, cómo se
 * autentica y bajo qué política. Rol, ámbito y permisos viven en
 * `prototype/fixtures/tenants.ts`, colgando de la asignación de BizCap dentro
 * de una membresía de Tenant, porque un rol es una función dentro de un
 * BizCap y cambia de un Tenant a otro para la misma persona.
 *
 * Los helpers de autorización de este archivo delegan en el Tenant activo:
 * son azúcar de compatibilidad para las superficies existentes, no una
 * segunda fuente de verdad.
 */

/** Desenlaces de identidad que el prototipo debe saber representar. */
type ProtoAuthOutcome =
  | "success"
  | "auth_failure"
  | "locked"
  | "recovery"
  | "mfa_required"
  | "step_up_required"
  | "session_expired";

type ProtoMfaMethod = "totp" | "sms" | "none";
type ProtoUserStatus = "active" | "locked" | "invited";

interface ProtoAuthPolicy {
  policyId: string;
  label: string;
  mfaRequired: boolean;
  /** AUTH-11: recordar dispositivo es opcional y dirigido por política. */
  allowTrustedDevice: boolean;
  trustedDeviceDays: number;
  /** AUTH-12: operaciones que exigen step-up aunque la sesión esté activa. */
  stepUpOperations: ProtoAction[];
  sessionMinutes: number;
}

interface ProtoAuthUser {
  userId: string;
  /** Enlaza con PROTO_ACTORS de fixtures.ts. */
  actorId: string;
  email: string;
  displayName: string;
  initials: string;
  /*
   * NO hay `role`, `scopes`, `permissions` ni `organizationId` aquí.
   * Un rol es una función dentro de un BizCap de un Tenant concreto: el mismo
   * humano tiene roles distintos en Tenants distintos. Ver
   * `protoMembershipsOf()` / `protoEffectiveAccess()` en tenants.ts.
   */
  policyId: string;
  mfaEnrolled: boolean;
  mfaMethod: ProtoMfaMethod;
  status: ProtoUserStatus;
  /** Guion del prototipo. NO es una credencial ni un permiso real. */
  scriptedOutcome: ProtoAuthOutcome;
  guion: string;
}

const PROTO_AUTH_POLICIES: ProtoAuthPolicy[] = [
  {
    policyId: "pol-standard",
    label: "Estándar — MFA obligatorio, dispositivo de confianza permitido",
    mfaRequired: true,
    allowTrustedDevice: true,
    trustedDeviceDays: 30,
    stepUpOperations: ["OVERRIDE_ASSIGNMENT_POLICY", "CONVERT_TO_OPPORTUNITY"],
    sessionMinutes: 30,
  },
  {
    policyId: "pol-strict",
    label: "Estricta — MFA obligatorio, sin dispositivo de confianza",
    mfaRequired: true,
    allowTrustedDevice: false,
    trustedDeviceDays: 0,
    stepUpOperations: ["OVERRIDE_ASSIGNMENT_POLICY", "CONVERT_TO_OPPORTUNITY", "DISQUALIFY_LEAD"],
    sessionMinutes: 15,
  },
];

const PROTO_AUTH_USERS: ProtoAuthUser[] = [
  {
    userId: "USR-001",
    actorId: "act-001",
    email: "ana.ruiz@demo.test",
    displayName: "Ana Ruiz",
    initials: "AR",
    policyId: "pol-standard",
    mfaEnrolled: true,
    mfaMethod: "totp",
    status: "active",
    scriptedOutcome: "mfa_required",
    guion: "Camino feliz: credenciales aceptadas → desafío MFA (AUTH-09) → Workspace.",
  },
  {
    userId: "USR-002",
    actorId: "act-002",
    email: "bruno.salas@demo.test",
    displayName: "Bruno Salas",
    initials: "BS",
    policyId: "pol-strict",
    mfaEnrolled: false,
    mfaMethod: "none",
    status: "active",
    scriptedOutcome: "mfa_required",
    guion: "Política exige MFA y no está inscrito → inscripción obligatoria (AUTH-08).",
  },
  {
    userId: "USR-003",
    actorId: "act-003",
    email: "elena.mora@demo.test",
    displayName: "Elena Mora",
    initials: "EM",
    policyId: "pol-standard",
    mfaEnrolled: true,
    mfaMethod: "totp",
    status: "active",
    scriptedOutcome: "mfa_required",
    guion: "Actor autorizado para OVERRIDE_ASSIGNMENT_POLICY y conversión (S-06, S-08).",
  },
  {
    userId: "USR-004",
    actorId: "act-004",
    email: "hugo.reyes@demo.test",
    displayName: "Hugo Reyes",
    initials: "HR",
    policyId: "pol-standard",
    mfaEnrolled: true,
    mfaMethod: "totp",
    status: "active",
    scriptedOutcome: "mfa_required",
    guion: "Resuelve revisión humana y duplicados (S-04, S-05).",
  },
  {
    userId: "USR-005",
    actorId: "act-001",
    email: "carla.bloqueada@demo.test",
    displayName: "Carla Bloqueada",
    initials: "CB",
    policyId: "pol-standard",
    mfaEnrolled: true,
    mfaMethod: "totp",
    status: "locked",
    scriptedOutcome: "locked",
    guion: "Cuenta bloqueada → AUTH-05, con ruta de desbloqueo simulada.",
  },
  {
    userId: "USR-006",
    actorId: "act-001",
    email: "diego.invitado@demo.test",
    displayName: "Diego Invitado",
    initials: "DI",
    policyId: "pol-standard",
    mfaEnrolled: false,
    mfaMethod: "none",
    status: "invited",
    scriptedOutcome: "recovery",
    guion: "Primer acceso por invitación (AUTH-07) → definir contraseña → inscripción MFA.",
  },
];

function protoFindAuthUser(email: string): ProtoAuthUser | null {
  const normalizado = email.trim().toLowerCase();
  return PROTO_AUTH_USERS.find((u) => u.email === normalizado) ?? null;
}

function protoFindAuthPolicy(policyId: string): ProtoAuthPolicy | null {
  return PROTO_AUTH_POLICIES.find((p) => p.policyId === policyId) ?? null;
}

function protoPolicyOf(user: ProtoAuthUser): ProtoAuthPolicy | null {
  return protoFindAuthPolicy(user.policyId);
}

/**
 * Comprueba un permiso declarado del actor.
 *
 * ⚠️ NO es un motor de autorización ni deriva `availableActions`. Sirve para
 * que las superficies puedan *explicar* por qué una acción provista por el
 * fixture aparece deshabilitada, nunca para decidir si debe existir.
 */
function protoActorTienePermiso(user: ProtoAuthUser, permiso: ProtoPermission): boolean {
  const tenantId = protoGetActiveTenantId();
  if (!tenantId) return false;      // Sin Tenant activo no hay autorización.
  return protoTienePermisoEnTenant(user.userId, tenantId, permiso);
}

/**
 * Etiqueta de los roles del usuario **en el Tenant activo**, sin jerarquías.
 * La misma persona devuelve otra etiqueta en otro Tenant: eso es lo correcto.
 */
function protoRoleLabelOf(user: ProtoAuthUser): string {
  const tenantId = protoGetActiveTenantId();
  if (!tenantId) return "Sin organización activa";
  const acceso = protoEffectiveAccess(user.userId, tenantId);
  return acceso.roles.length ? protoRolesLabel(acceso.roles) : "Sin roles asignados";
}

/**
 * Primer rol del usuario en el Tenant activo. **Sólo para mostrar el autor de
 * un evento** (quién hizo qué): no es un "rol principal" ni se usa para
 * autorizar nada. Si no hay roles devuelve null y quien llama lo omite.
 */
function protoPrimaryRoleOf(user: ProtoAuthUser): ProtoRole | undefined {
  const tenantId = protoGetActiveTenantId();
  if (!tenantId) return undefined;
  return protoEffectiveAccess(user.userId, tenantId).roles[0];
}
