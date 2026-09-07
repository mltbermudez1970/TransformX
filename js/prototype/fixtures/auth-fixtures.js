"use strict";
/**
 * Fixtures de identidad, rol, permisos y política — prototipo AUTH/MFA.
 *
 * REGLA CENTRAL: aquí NO hay credenciales. No se almacena ninguna contraseña,
 * hash, secreto TOTP ni código de recuperación real. El prototipo decide el
 * desenlace a partir de `scriptedOutcome` del perfil sintético, no de lo que
 * el usuario teclee. Tampoco hay IdP, OAuth, proveedor MFA ni backend.
 *
 * MODELO DE IDENTIDAD (Resolution Package §8):
 * Rol ≠ Permiso ≠ Ámbito. Los tres se declaran por separado en cada actor.
 * El modelo de autorización productivo se define en Stage 13.
 */
const PROTO_AUTH_POLICIES = [
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
const PROTO_AUTH_USERS = [
    {
        userId: "USR-001",
        actorId: "act-001",
        email: "ana.ruiz@demo.test",
        displayName: "Ana Ruiz",
        initials: "AR",
        role: "SALES_REPRESENTATIVE",
        scopes: ["SELF"],
        permissions: [
            "lead.read", "lead.edit_information", "work.read",
            "missing_information.request", "received_information.review",
            "qualification.read", "qualification.reassess",
            "opportunity_readiness.read", "opportunity.convert",
            "communication.read", "communication.draft", "communication.send",
        ],
        organizationId: "org-demo-001",
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
        role: "SALES_OPERATIONS_ANALYST",
        scopes: ["BIZCAP"],
        permissions: [
            "lead.read", "work.read", "work.manage",
            "missing_information.request", "received_information.review",
            "qualification.read", "review.read", "duplicate_review.resolve",
            "assignment.read", "assignment.assign", "assignment.reassign",
            "communication.read",
        ],
        organizationId: "org-demo-001",
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
        role: "SALES_MANAGER",
        scopes: ["TEAM", "BIZCAP"],
        permissions: [
            "lead.read", "work.read", "work.manage",
            "qualification.read", "review.read", "review.resolve", "duplicate_review.resolve",
            "assignment.read", "assignment.assign", "assignment.reassign", "assignment.override",
            "opportunity_readiness.read", "opportunity.convert",
            "lead.disqualify", "lead.close",
            "communication.read", "communication.draft", "communication.send",
        ],
        organizationId: "org-demo-001",
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
        role: "HUMAN_REVIEWER",
        scopes: ["BIZCAP"],
        permissions: [
            "lead.read", "work.read",
            "qualification.read", "review.read", "review.resolve", "duplicate_review.resolve",
            "communication.read",
        ],
        organizationId: "org-demo-001",
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
        role: "SALES_REPRESENTATIVE",
        scopes: ["SELF"],
        permissions: ["lead.read", "work.read"],
        organizationId: "org-demo-001",
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
        role: "SALES_REPRESENTATIVE",
        scopes: ["SELF"],
        permissions: ["lead.read", "work.read"],
        organizationId: "org-demo-001",
        policyId: "pol-standard",
        mfaEnrolled: false,
        mfaMethod: "none",
        status: "invited",
        scriptedOutcome: "recovery",
        guion: "Primer acceso por invitación (AUTH-07) → definir contraseña → inscripción MFA.",
    },
];
function protoFindAuthUser(email) {
    const normalizado = email.trim().toLowerCase();
    return PROTO_AUTH_USERS.find((u) => u.email === normalizado) ?? null;
}
function protoFindAuthPolicy(policyId) {
    return PROTO_AUTH_POLICIES.find((p) => p.policyId === policyId) ?? null;
}
function protoPolicyOf(user) {
    return protoFindAuthPolicy(user.policyId);
}
/**
 * Comprueba un permiso declarado del actor.
 *
 * ⚠️ NO es un motor de autorización ni deriva `availableActions`. Sirve para
 * que las superficies puedan *explicar* por qué una acción provista por el
 * fixture aparece deshabilitada, nunca para decidir si debe existir.
 */
function protoActorTienePermiso(user, permiso) {
    return user.permissions.includes(permiso);
}
/** Etiqueta de rol legible, sin inventar jerarquías. */
function protoRoleLabelOf(user) {
    return PROTO_ROLE_LABEL[user.role];
}
