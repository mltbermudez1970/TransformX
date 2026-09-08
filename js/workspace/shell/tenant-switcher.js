"use strict";
/**
 * Identidad de Tenant y conmutador global — TX-UX-MTAC-AMD-001 §6, §13.
 *
 * Dos piezas distintas y deliberadamente separadas:
 *
 *  · TenantIdentityBadge — SIEMPRE visible. Responde "¿en qué organización
 *    estoy trabajando?" antes de que nadie toque nada. Para un usuario de un
 *    solo Tenant es texto, no un control: no se ofrece un botón que no lleva
 *    a ninguna parte.
 *
 *  · TenantSwitcher — sólo para quien tiene más de una membresía activa.
 *    Cambiar de organización es un cambio de contexto de seguridad, así que
 *    el control lo enuncia y la transición se anuncia; no es un filtro.
 */
/** Insignia de identidad de organización. */
function protoRenderTenantBadge() {
    const tenant = protoGetActiveTenant();
    if (!tenant)
        return "";
    const user = protoGetSessionUser();
    const multiples = user ? protoActiveMembershipsOf(user.userId).length > 1 : false;
    const identidad = `
    <span class="ws-tenant__mark" aria-hidden="true">${protoEscape(tenant.initials)}</span>
    <span class="ws-tenant__text">
      <span class="ws-tenant__label">Organización</span>
      <span class="ws-tenant__name">${protoEscape(tenant.shortName)}</span>
    </span>`;
    // Un solo Tenant: identidad sin control. Nada que conmutar.
    if (!multiples) {
        return `<p class="ws-tenant ws-tenant--static">${identidad}</p>`;
    }
    return `
    <div class="c-menu-wrapper ws-tenant-switcher">
      <button type="button" class="ws-tenant ws-tenant--button" id="ws-tenant-trigger"
              aria-haspopup="true" aria-expanded="false" aria-controls="ws-tenant-panel">
        ${identidad}
        <span class="ws-tenant__caret" aria-hidden="true">▾</span>
      </button>
      <div class="c-menu-account ws-tenant__panel" id="ws-tenant-panel"
           role="menu" aria-labelledby="ws-tenant-trigger" hidden>
        <div class="c-menu__group" role="group" aria-labelledby="ws-tenant-cat">
          <h3 class="c-menu__category" id="ws-tenant-cat">Cambiar de organización</h3>
          <p class="ws-tenant__warn">
            Cambiar de organización cambia tu contexto de trabajo: BizCaps,
            pendientes, permisos y Capio se recargan desde la organización
            seleccionada.
          </p>
          <ul class="c-menu__list">
            ${protoRenderTenantOptions()}
          </ul>
        </div>
      </div>
    </div>`;
}
function protoRenderTenantOptions() {
    const user = protoGetSessionUser();
    if (!user)
        return "";
    const activo = protoGetActiveTenantId();
    return protoActiveMembershipsOf(user.userId)
        .map((m) => {
        const t = protoFindTenant(m.tenantId);
        if (!t)
            return "";
        const esActual = m.tenantId === activo;
        const acceso = protoEffectiveAccess(user.userId, m.tenantId);
        // El resumen es informativo. NO se pide elegir rol (§5, §14).
        const resumen = acceso.bizCapIds.length
            ? `${String(acceso.bizCapIds.length)} BizCap${acceso.bizCapIds.length === 1 ? "" : "s"} · ${protoEscape(protoRolesLabel(acceso.roles))}`
            : "Sin BizCaps asignadas";
        return `
        <li role="none">
          <button type="button" role="menuitem" tabindex="-1"
                  data-tenant-go="${protoEscape(m.tenantId)}"
                  ${esActual ? 'aria-current="true" disabled' : ""}>
            <span class="ws-tenant-option__name">${protoEscape(t.name)}</span>
            <span class="ws-tenant-option__meta">${resumen}</span>
            ${esActual ? '<span class="ws-tenant-option__current">Organización actual</span>' : ""}
          </button>
        </li>`;
    })
        .join("");
}
/**
 * EffectiveAccessSummary — el acceso del usuario en el Tenant activo, mostrado
 * como **derivado y de sólo lectura** (§8 del amendment).
 *
 * Enseña roles POR BizCap, no una lista plana: el rol sólo significa algo
 * dentro de su BizCap, y aplanarlos haría creer que son atributos de la
 * persona. Los permisos se cuentan, no se editan aquí: la primitiva de
 * administración es el rol, no el permiso suelto.
 */
function protoRenderEffectiveAccessSummary(user) {
    const tenantId = protoGetActiveTenantId();
    if (!tenantId)
        return `<p class="ws-account__meta">Sin organización activa.</p>`;
    const acceso = protoEffectiveAccess(user.userId, tenantId);
    if (!acceso.rolesByBizCap.length) {
        return `<p class="ws-account__meta">Sin BizCaps asignadas en esta organización.</p>`;
    }
    const filas = acceso.rolesByBizCap
        .map((r) => {
        const def = protoFindBizCap(r.bizCapId);
        const chips = r.roles
            .map((rol) => `<span class="ws-role-chip">${protoEscape(PROTO_ROLE_LABEL[rol])}</span>`)
            .join("");
        return `
        <li class="ws-access__item">
          <span class="ws-access__bizcap">${protoEscape(r.bizCapId)} ${protoEscape(def ? def.name : "")}</span>
          <span class="ws-role-list">${chips}</span>
        </li>`;
    })
        .join("");
    return `
    <ul class="ws-access" aria-label="Acceso efectivo en la organización activa">${filas}</ul>
    <p class="ws-account__meta ws-small">
      ${String(acceso.permissions.length)} permisos efectivos, derivados de estos roles.
      Se muestran para transparencia; no se editan uno a uno.
    </p>`;
}
/**
 * Estado TENANT_CONTEXT_SWITCHING: pantalla de transición que bloquea toda
 * acción material mientras el contexto se rehace. Se pinta sobre el documento
 * porque el cambio implica navegar y no debe quedar interfaz del Tenant viejo
 * accesible durante el salto.
 */
function protoMostrarCambioDeTenant(destinoNombre) {
    const capa = document.createElement("div");
    capa.className = "ws-tenant-switching";
    capa.setAttribute("role", "status");
    capa.setAttribute("aria-live", "polite");
    capa.innerHTML = `
    <div class="ws-tenant-switching__box">
      <p class="ws-tenant-switching__title">Cambiando a ${protoEscape(destinoNombre)}…</p>
      <p class="ws-tenant-switching__note">
        Se está recargando tu contexto de trabajo. Las acciones quedan
        suspendidas hasta que termine.
      </p>
    </div>`;
    document.body.appendChild(capa);
    // Suspender explícitamente todo envío material durante la transición.
    document
        .querySelectorAll("button[data-conv-submit], button[data-dw-submit], button[data-lead-command], button[type=submit]")
        .forEach((b) => { b.disabled = true; });
}
/** Cablea el conmutador con el patrón de menú ya usado en el shell. */
function protoWireTenantSwitcher() {
    const toggle = document.querySelector("#ws-tenant-trigger");
    const panel = document.querySelector("#ws-tenant-panel");
    if (!toggle || !panel)
        return;
    const items = () => [...panel.querySelectorAll('[role="menuitem"]:not([disabled])')];
    const abrir = () => {
        panel.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
        items()[0]?.focus();
    };
    const cerrar = (devolverFoco) => {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        if (devolverFoco)
            toggle.focus();
    };
    toggle.addEventListener("click", () => {
        panel.hidden ? abrir() : cerrar(true);
    });
    panel.addEventListener("keydown", (e) => {
        const lista = items();
        const i = lista.indexOf(document.activeElement);
        if (e.key === "Escape") {
            e.preventDefault();
            cerrar(true);
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            lista[(i + 1) % lista.length]?.focus();
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            lista[(i - 1 + lista.length) % lista.length]?.focus();
        }
        if (e.key === "Home") {
            e.preventDefault();
            lista[0]?.focus();
        }
        if (e.key === "End") {
            e.preventDefault();
            lista[lista.length - 1]?.focus();
        }
    });
    document.addEventListener("click", (e) => {
        if (panel.hidden)
            return;
        const t = e.target;
        if (!panel.contains(t) && !toggle.contains(t))
            cerrar(false);
    });
    panel.querySelectorAll("[data-tenant-go]").forEach((b) => {
        b.addEventListener("click", () => {
            const tenantId = b.getAttribute("data-tenant-go");
            if (!tenantId)
                return;
            const t = protoFindTenant(tenantId);
            protoMostrarCambioDeTenant(t ? t.name : "otra organización");
            // Latencia simulada para que el estado de transición sea observable.
            window.setTimeout(() => {
                const destino = protoSwitchTenant(tenantId);
                if (!destino) {
                    location.assign(protoRouteHref("system", { state: "tenant-access-revoked" }));
                    return;
                }
                location.assign(destino);
            }, 650);
        });
    });
}
