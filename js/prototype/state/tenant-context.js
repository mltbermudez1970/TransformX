"use strict";
/**
 * Cambio de contexto de Tenant — TX-UX-MTAC-AMD-001 §6.
 *
 * Cambiar de organización NO es un filtro de la interfaz: es un **cambio de
 * contexto de seguridad**. Todo lo que la sesión acumuló mientras trabajaba en
 * el Tenant anterior (comandos aplicados, oportunidades creadas, estado de
 * vista, hilo privado de Capio) pertenece a ese Tenant y no puede sobrevivir
 * al salto. Arrastrarlo sería fuga de datos entre organizaciones.
 *
 * Lo que SÍ sobrevive: la identidad autenticada y el nivel de aseguramiento
 * (MFA ya satisfecho). Cambiar de organización no vuelve a pedir credenciales.
 */
/**
 * Claves de `sessionStorage` cuyo contenido pertenece a un Tenant concreto.
 * Al cambiar de Tenant se vacían todas. La sesión y el modo prototipo NO están
 * aquí a propósito: son transversales a la identidad, no al Tenant.
 */
const PROTO_TENANT_SCOPED_KEYS = [
    "transformx-prototype-commands", // comandos materiales ya aplicados
    "transformx-prototype-opportunities", // oportunidades creadas en la sesión
    "transformx-capio-workspace-log", // hilo privado de Capio (§10)
];
/** Prefijo del estado de vista: se limpia por barrido, no por nombre exacto. */
const PROTO_TENANT_SCOPED_PREFIXES = ["transformx-view-"];
/**
 * Vacía todo el estado atado al Tenant anterior. Se llama ANTES de establecer
 * el nuevo contexto, para que ninguna superficie pueda leer datos mezclados
 * durante la transición.
 */
function protoClearTenantScopedState() {
    try {
        PROTO_TENANT_SCOPED_KEYS.forEach((k) => sessionStorage.removeItem(k));
        const aBorrar = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i);
            if (k && PROTO_TENANT_SCOPED_PREFIXES.some((p) => k.startsWith(p)))
                aBorrar.push(k);
        }
        aBorrar.forEach((k) => sessionStorage.removeItem(k));
    }
    catch {
        /* sessionStorage no disponible */
    }
}
/**
 * Ejecuta el cambio de Tenant y devuelve la ruta a la que hay que navegar.
 *
 * Devuelve `null` cuando el destino no es una membresía activa: en ese caso
 * quien llama debe mostrar TENANT_ACCESS_REVOKED, nunca intentar el salto.
 */
function protoSwitchTenant(tenantId) {
    const s = protoGetSession();
    if (!s)
        return null;
    const m = protoFindMembership(s.userId, tenantId);
    if (!m || m.status !== "active")
        return null;
    protoClearTenantScopedState();
    if (!protoSetActiveTenant(tenantId))
        return null;
    // Tras el cambio, la ruta actual puede pertenecer a un BizCap que este
    // Tenant no tiene: en ese caso se aterriza en un lugar seguro y se explica.
    return protoSafeRouteForTenant(protoCurrentRouteId(), s.userId, tenantId);
}
/**
 * ¿A qué ruta puede entrar este usuario en este Tenant?
 *
 * Si la ruta actual cuelga de un BizCap sin asignación, devuelve la Home del
 * Tenant con el motivo declarado en la query para que la superficie destino
 * pueda enunciar TENANT_BIZCAP_NOT_AVAILABLE. No se redirige en silencio.
 */
function protoSafeRouteForTenant(routeId, userId, tenantId) {
    const bizCapId = protoBizCapOfRoute(routeId);
    if (!bizCapId)
        return protoRouteHref("home");
    if (protoTieneBizCap(userId, tenantId, bizCapId))
        return protoRouteHref(routeId);
    return protoRouteHref("bizcaps", { tenantNotice: "bizcap-not-available", bizCap: bizCapId });
}
/**
 * BizCap al que pertenece una ruta, o null si es transversal (Home, My Work,
 * Capio, Administración, superficies de sistema).
 *
 * Se resuelve por la cadena de breadcrumbs declarada en `routes.ts`: no se
 * infiere del nombre de la ruta.
 */
function protoBizCapOfRoute(routeId) {
    const route = protoFindRoute(routeId);
    if (!route)
        return null;
    const cadena = [...route.parents, route.routeId];
    if (cadena.includes("lab-001"))
        return "LAB-001";
    return null;
}
/**
 * Guarda de contexto para toda superficie autenticada. Devuelve la ruta a la
 * que hay que desviar, o null si se puede seguir.
 */
function protoTenantGuardRedirect() {
    const estado = protoTenantContextState();
    if (estado === "UNRESOLVED") {
        // Identidad autenticada pero sin organización resuelta todavía.
        return protoRouteHref("auth", {
            screen: "select-organization",
            returnTo: protoCurrentRelativeRoute(),
        });
    }
    if (estado === "TENANT_ACCESS_REVOKED") {
        return protoRouteHref("system", { state: "tenant-access-revoked" });
    }
    if (estado === "TENANT_CONTEXT_STALE") {
        return protoRouteHref("system", { state: "tenant-context-stale" });
    }
    // Contexto válido: queda comprobar que la ruta pertenezca a un BizCap
    // asignado en ESTE Tenant.
    const s = protoGetSession();
    if (!s || !s.tenantId)
        return null;
    const bizCapId = protoBizCapOfRoute(protoCurrentRouteId());
    if (bizCapId && !protoTieneBizCap(s.userId, s.tenantId, bizCapId)) {
        return protoRouteHref("bizcaps", { tenantNotice: "bizcap-not-available", bizCap: bizCapId });
    }
    return null;
}
