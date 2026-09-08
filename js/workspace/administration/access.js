"use strict";
/**
 * ADM-06…ADM-09 — Administración de acceso del Tenant (TX-UX-MTAC-AMD-001 §8).
 *
 *   ADM-06 Users                  lista de miembros del Tenant activo
 *   ADM-07 User Access Detail     membresía, BizCaps, roles por BizCap
 *   ADM-08 BizCap & Role Assign.  asignar/quitar BizCaps y roles múltiples
 *   ADM-09 Review Access Changes  consecuencias antes de confirmar
 *
 * Fronteras que este archivo respeta:
 *  · El administrador administra **sólo el Tenant activo**. No hay selector de
 *    organización aquí: se administra donde se está.
 *  · La primitiva es el ROL dentro de un BizCap. Los permisos efectivos se
 *    muestran derivados y de sólo lectura; no se editan uno a uno.
 *  · Quitar un BizCap arrastra los roles de ese BizCap: se enuncia, no se
 *    deja implícito.
 *  · Las guardas (último administrador, step-up, conflicto) llegan del mock;
 *    la UI no decide qué cambio es peligroso.
 */
const PROTO_ADM_DRAFT_KEY = "transformx-prototype-access-draft";
function protoAdmParam(nombre) {
    return new URLSearchParams(location.search).get(nombre);
}
/** ¿Quien mira puede administrar el acceso de ESTA organización? */
function protoAdmPuedeAdministrar() {
    const user = protoGetSessionUser();
    const tenantId = protoGetActiveTenantId();
    if (!user || !tenantId)
        return false;
    return protoTienePermisoEnTenant(user.userId, tenantId, "tenant.access.assign");
}
/* --- Borrador (sobrevive a la navegación entre ADM-08 y ADM-09) ----------- */
function protoAdmLeerBorrador(userId) {
    try {
        const raw = sessionStorage.getItem(`${PROTO_ADM_DRAFT_KEY}:${userId}`);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function protoAdmGuardarBorrador(userId, draft) {
    try {
        sessionStorage.setItem(`${PROTO_ADM_DRAFT_KEY}:${userId}`, JSON.stringify(draft));
    }
    catch {
        /* sessionStorage no disponible */
    }
}
function protoAdmBorrarBorrador(userId) {
    try {
        sessionStorage.removeItem(`${PROTO_ADM_DRAFT_KEY}:${userId}`);
    }
    catch {
        /* sessionStorage no disponible */
    }
}
/* =========================================================================
 * ADM-06 — Users
 * ========================================================================= */
function protoRenderAdm06(host, tenantId) {
    const tenant = protoFindTenant(tenantId);
    const miembros = protoTenantMembers(tenantId);
    const filas = miembros
        .map((m) => {
        const u = PROTO_AUTH_USERS.find((x) => x.userId === m.userId);
        if (!u)
            return "";
        const acceso = protoEffectiveAccess(m.userId, tenantId);
        const nBiz = acceso.bizCapIds.length;
        return `
        <tr>
          <th scope="row">
            <a href="${protoEsc(protoRouteHref("administration-access", { userId: m.userId }))}">${protoEsc(u.displayName)}</a>
            <span class="ws-muted ws-small"><br>${protoEsc(u.email)}</span>
          </th>
          <td><span class="ws-chip ws-chip--${protoEsc(m.status)}">${protoEsc(PROTO_MEMBERSHIP_STATUS_LABEL[m.status])}</span></td>
          <td>${nBiz ? String(nBiz) : "Ninguna"}</td>
          <td class="ws-small">${nBiz ? protoEsc(protoRolesLabel(acceso.roles)) : "—"}</td>
        </tr>`;
    })
        .join("");
    host.innerHTML = `
    <p class="ws-code">ADM-06</p>
    <h1 class="ws-page__title">Usuarios de ${protoEsc(tenant ? tenant.name : tenantId)}</h1>
    <p class="ws-page__lead">Administras el acceso de esta organización. Los usuarios de otras organizaciones no aparecen aquí, aunque sean la misma persona.</p>
    ${protoRenderMockNotice()}
    <div class="ws-feedback" data-adm-feedback role="status" aria-live="polite"></div>

    <div class="workspace-table-wrapper">
      <table class="workspace-table">
        <caption class="sr-only">Miembros de la organización activa</caption>
        <thead>
          <tr>
            <th scope="col">Persona</th>
            <th scope="col">Membresía</th>
            <th scope="col">BizCaps</th>
            <th scope="col">Roles en esta organización</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}
/* =========================================================================
 * ADM-07 + ADM-08 — Detalle de acceso y asignación
 * ========================================================================= */
function protoRenderAdm0708(host, tenantId, userId) {
    const u = PROTO_AUTH_USERS.find((x) => x.userId === userId);
    const m = protoFindMembership(userId, tenantId);
    const tenant = protoFindTenant(tenantId);
    if (!u || !m) {
        host.innerHTML = `
      <p class="ws-code">ADM-07</p>
      <h1 class="ws-page__title">Usuario no encontrado</h1>
      <p class="ws-empty" role="status">Esa persona no pertenece a esta organización.</p>
      <p class="ws-actions"><a class="c-btn c-btn--secondary" href="${protoEsc(protoRouteHref("administration-access"))}">Volver a la lista</a></p>`;
        return;
    }
    const draft = protoAdmLeerBorrador(userId) ?? protoAccessDraftFrom(userId, tenantId);
    const acceso = protoEffectiveAccess(userId, tenantId);
    const bloques = PROTO_BIZCAPS.map((b) => {
        const asignado = b.bizCapId in draft;
        const seleccionados = draft[b.bizCapId] ?? [];
        const roles = PROTO_ASSIGNABLE_ROLES[b.bizCapId];
        const checkboxes = roles
            .map((r) => {
            const id = `adm-${b.bizCapId}-${r}`;
            return `
          <label class="c-checkbox" for="${id}">
            <input type="checkbox" id="${id}" data-adm-role="${protoEsc(r)}" data-adm-bizcap="${protoEsc(b.bizCapId)}"
                   ${seleccionados.includes(r) ? "checked" : ""} ${asignado ? "" : "disabled"}>
            <span>${protoEsc(PROTO_ROLE_LABEL[r])}</span>
          </label>`;
        })
            .join("");
        return `
      <fieldset class="ws-assign">
        <legend>
          ${protoEsc(b.bizCapId)} ${protoEsc(b.name)}
          ${b.hasOperationalSurface ? "" : '<span class="ws-chip ws-chip--planned">Sin superficie operativa</span>'}
        </legend>
        <label class="c-checkbox ws-assign__toggle" for="adm-biz-${protoEsc(b.bizCapId)}">
          <input type="checkbox" id="adm-biz-${protoEsc(b.bizCapId)}" data-adm-bizcap-toggle="${protoEsc(b.bizCapId)}" ${asignado ? "checked" : ""}>
          <span>Asignar esta BizCap</span>
        </label>
        <p class="ws-muted ws-small">${protoEsc(b.note)}</p>
        <div class="ws-assign__roles" data-adm-roles="${protoEsc(b.bizCapId)}">
          <p class="ws-assign__hint" id="hint-${protoEsc(b.bizCapId)}">
            Puede tener varias funciones a la vez dentro de esta BizCap.
          </p>
          ${checkboxes}
        </div>
      </fieldset>`;
    }).join("");
    host.innerHTML = `
    <p class="ws-back"><a href="${protoEsc(protoRouteHref("administration-access"))}">← Volver a usuarios</a></p>
    <p class="ws-code">ADM-07 · ADM-08</p>
    <h1 class="ws-page__title" tabindex="-1">${protoEsc(u.displayName)}</h1>
    <p class="ws-page__lead">${protoEsc(u.email)} · membresía ${protoEsc(PROTO_MEMBERSHIP_STATUS_LABEL[m.status])} en ${protoEsc(tenant ? tenant.name : tenantId)}</p>
    ${protoRenderMockNotice()}
    <div class="ws-feedback" data-adm-feedback role="status" aria-live="polite"></div>

    <section class="ws-section" aria-labelledby="adm-actual-title">
      <h2 class="ws-section__title" id="adm-actual-title">Acceso efectivo actual</h2>
      ${acceso.rolesByBizCap.length
        ? `<ul class="ws-access">${acceso.rolesByBizCap
            .map((r) => `<li class="ws-access__item"><span class="ws-access__bizcap">${protoEsc(r.bizCapId)}</span><span class="ws-role-list">${r.roles.map((rol) => `<span class="ws-role-chip">${protoEsc(PROTO_ROLE_LABEL[rol])}</span>`).join("")}</span></li>`)
            .join("")}</ul>`
        : `<p class="ws-muted">Sin BizCaps asignadas en esta organización.</p>`}
      <p class="ws-muted ws-small">
        ${String(acceso.permissions.length)} permisos efectivos derivados de estos roles.
        Se muestran para transparencia: la administración se hace por rol, no permiso a permiso.
      </p>
    </section>

    <section class="ws-section" aria-labelledby="adm-asignar-title">
      <h2 class="ws-section__title" id="adm-asignar-title">Asignación de BizCaps y roles</h2>
      <p class="ws-muted ws-small">Quitar una BizCap retira también todos los roles que la persona tenga en ella dentro de esta organización.</p>
      <form data-adm-form>
        ${bloques}
        <fieldset class="ws-assign ws-assign--tenant">
          <legend>Administración de la organización</legend>
          <p class="ws-muted ws-small">
            No es una función dentro de una BizCap: alcanza a toda la
            organización. Quien la tiene concede y retira accesos.
          </p>
          <div class="ws-assign__roles">
            ${PROTO_ASSIGNABLE_TENANT_ROLES.map((r) => {
        const id = `adm-tenant-${r}`;
        const marcados = draft[PROTO_TENANT_ROLE_KEY] ?? [];
        return `
                <label class="c-checkbox" for="${id}">
                  <input type="checkbox" id="${id}" data-adm-tenant-role="${protoEsc(r)}" ${marcados.includes(r) ? "checked" : ""}>
                  <span>${protoEsc(PROTO_ROLE_LABEL[r])}</span>
                </label>`;
    }).join("")}
          </div>
        </fieldset>
      </form>
      <div class="ws-actions">
        <button type="button" class="c-btn c-btn--primary" data-adm-review disabled>Revisar cambios</button>
        <button type="button" class="c-btn c-btn--secondary" data-adm-reset>Descartar cambios</button>
      </div>
    </section>`;
    protoWireAdm08(userId, tenantId, draft);
}
function protoWireAdm08(userId, tenantId, draft) {
    const form = document.querySelector("[data-adm-form]");
    const review = document.querySelector("[data-adm-review]");
    const reset = document.querySelector("[data-adm-reset]");
    if (!form || !review || !reset)
        return;
    const actor = protoGetSessionUser();
    const original = protoAccessDraftFrom(userId, tenantId);
    const refrescar = () => {
        const set = protoAccessChangeSet(userId, tenantId, draft, actor ? actor.userId : "");
        review.disabled = set.changes.length === 0;
        protoAdmGuardarBorrador(userId, draft);
    };
    form.querySelectorAll("[data-adm-bizcap-toggle]").forEach((cb) => {
        cb.addEventListener("change", () => {
            const biz = cb.getAttribute("data-adm-bizcap-toggle");
            if (!biz)
                return;
            const roles = form.querySelectorAll(`[data-adm-bizcap="${CSS.escape(biz)}"]`);
            if (cb.checked) {
                draft[biz] = draft[biz] ?? [];
                roles.forEach((r) => { r.disabled = false; });
            }
            else {
                // Quitar la BizCap arrastra sus roles: se refleja en el acto.
                delete draft[biz];
                roles.forEach((r) => { r.checked = false; r.disabled = true; });
            }
            refrescar();
        });
    });
    form.querySelectorAll("[data-adm-role]").forEach((cb) => {
        cb.addEventListener("change", () => {
            const biz = cb.getAttribute("data-adm-bizcap");
            const rol = cb.getAttribute("data-adm-role");
            if (!biz || !rol)
                return;
            const actuales = draft[biz] ?? [];
            draft[biz] = cb.checked
                ? [...actuales.filter((r) => r !== rol), rol]
                : actuales.filter((r) => r !== rol);
            refrescar();
        });
    });
    form.querySelectorAll("[data-adm-tenant-role]").forEach((cb) => {
        cb.addEventListener("change", () => {
            const rol = cb.getAttribute("data-adm-tenant-role");
            if (!rol)
                return;
            const actuales = draft[PROTO_TENANT_ROLE_KEY] ?? [];
            draft[PROTO_TENANT_ROLE_KEY] = cb.checked
                ? [...actuales.filter((r) => r !== rol), rol]
                : actuales.filter((r) => r !== rol);
            refrescar();
        });
    });
    reset.addEventListener("click", () => {
        protoAdmBorrarBorrador(userId);
        location.assign(protoRouteHref("administration-access", { userId }));
    });
    review.addEventListener("click", () => {
        protoAdmGuardarBorrador(userId, draft);
        location.assign(protoRouteHref("administration-access", { userId, view: "review" }));
    });
    void original;
    refrescar();
}
/* =========================================================================
 * ADM-09 — Revisar cambios y confirmar
 * ========================================================================= */
function protoRenderAdm09(host, tenantId, userId) {
    const u = PROTO_AUTH_USERS.find((x) => x.userId === userId);
    const draft = protoAdmLeerBorrador(userId);
    const actor = protoGetSessionUser();
    if (!u || !draft || !actor) {
        location.replace(protoRouteHref("administration-access", { userId }));
        return;
    }
    const set = protoAccessChangeSet(userId, tenantId, draft, actor.userId);
    const bloqueado = set.warnings.some((w) => w.blocking);
    const cambios = set.changes
        .map((c) => {
        const etiqueta = c.kind === "BIZCAP_ADDED" ? "Añade BizCap"
            : c.kind === "BIZCAP_REMOVED" ? "Quita BizCap"
                : c.kind === "ROLE_ADDED" ? "Añade rol"
                    : "Quita rol";
        const quita = c.kind === "BIZCAP_REMOVED" || c.kind === "ROLE_REMOVED";
        return `
        <li class="ws-change ws-change--${quita ? "remove" : "add"}">
          <span class="ws-change__kind">${protoEsc(etiqueta)}</span>
          <span class="ws-change__what">${protoEsc(c.bizCapId)}${c.role ? ` · ${protoEsc(PROTO_ROLE_LABEL[c.role])}` : ""}</span>
          <span class="ws-change__consequence">${protoEsc(c.consequence)}</span>
        </li>`;
    })
        .join("");
    const avisos = set.warnings
        .map((w) => `
      <div class="c-alert c-alert--${w.blocking ? "error" : "warning"}" role="${w.blocking ? "alert" : "status"}">
        <p class="c-alert-message">${protoEsc(w.message)}</p>
      </div>`)
        .join("");
    host.innerHTML = `
    <p class="ws-back"><a href="${protoEsc(protoRouteHref("administration-access", { userId }))}">← Volver a la asignación</a></p>
    <p class="ws-code">ADM-09</p>
    <h1 class="ws-page__title" tabindex="-1">Revisar cambios de acceso</h1>
    <p class="ws-page__lead">Cambios sobre ${protoEsc(u.displayName)} en esta organización. Nada se aplica hasta que confirmes.</p>
    ${protoRenderMockNotice()}
    <div class="ws-feedback" data-adm-feedback role="status" aria-live="polite"></div>

    ${avisos}

    <section class="ws-section" aria-labelledby="adm-cambios-title">
      <h2 class="ws-section__title" id="adm-cambios-title">${String(set.changes.length)} cambio${set.changes.length === 1 ? "" : "s"} material${set.changes.length === 1 ? "" : "es"}</h2>
      <ul class="ws-changes">${cambios}</ul>
    </section>

    ${set.requiresStepUp
        ? `<section class="ws-section" aria-labelledby="adm-stepup-title">
           <h2 class="ws-section__title" id="adm-stepup-title">Verificación adicional</h2>
           <p>Por la sensibilidad de este cambio hay que confirmar la identidad antes de aplicarlo.</p>
           <div class="auth-field">
             <label class="form-label" for="adm-otp">Código de verificación</label>
             <input class="form-input" type="text" id="adm-otp" inputmode="numeric" maxlength="6"
                    autocomplete="one-time-code" aria-describedby="adm-otp-help">
             <p class="form-hint" id="adm-otp-help">Seis dígitos. En el prototipo cualquier combinación es válida excepto <code>000000</code>.</p>
           </div>
         </section>`
        : ""}

    <div class="ws-actions">
      <button type="button" class="c-btn c-btn--primary" data-adm-confirm ${bloqueado ? "disabled" : ""}>Confirmar cambios</button>
      <a class="c-btn c-btn--secondary" href="${protoEsc(protoRouteHref("administration-access", { userId }))}">Seguir editando</a>
    </div>
    ${bloqueado ? `<p class="ws-muted ws-small">La confirmación está bloqueada por la advertencia de gobernanza señalada arriba.</p>` : ""}

    <section class="ws-section" data-adm-result hidden aria-labelledby="adm-result-title">
      <h2 class="ws-section__title" id="adm-result-title" tabindex="-1">Acceso actualizado</h2>
      <div data-adm-result-body></div>
    </section>`;
    protoWireAdm09(userId, tenantId, draft, set);
}
function protoWireAdm09(userId, tenantId, draft, set) {
    const btn = document.querySelector("[data-adm-confirm]");
    const feedback = document.querySelector("[data-adm-feedback]");
    if (!btn || !feedback)
        return;
    btn.addEventListener("click", async () => {
        // Step-up simulado: mismo contrato que AUTH-12, sin proveedor real.
        if (set.requiresStepUp) {
            const otp = document.querySelector("#adm-otp");
            const valor = otp ? otp.value.trim() : "";
            if (!/^\d{6}$/.test(valor) || valor === "000000") {
                otp?.setAttribute("aria-invalid", "true");
                protoRenderFeedback(feedback, {
                    severidad: "error",
                    mensaje: "Verificación adicional no superada.",
                    detalle: "Introduce un código de seis dígitos distinto de 000000. El cambio no se aplicó.",
                });
                otp?.focus();
                return;
            }
            otp?.setAttribute("aria-invalid", "false");
            protoMarkStepUpSatisfied();
        }
        const aplicado = await protoRunCommand({
            key: `ACCESS_CHANGE:${tenantId}:${userId}:${JSON.stringify(draft)}`,
            action: "VIEW_LEAD", // el catálogo de acciones es de LAB-001; aquí sólo
            // se reutiliza la mecánica de envío único.
            boton: btn,
            feedback,
            outcome: protoAdmParam("outcome") === "conflict" ? "business_conflict" : "success",
        });
        if (!aplicado)
            return;
        protoApplyAccessChange(userId, tenantId, draft);
        protoAdmBorrarBorrador(userId);
        const acceso = protoEffectiveAccess(userId, tenantId);
        const sec = document.querySelector("[data-adm-result]");
        const body = document.querySelector("[data-adm-result-body]");
        if (sec && body) {
            body.innerHTML = `
        <div class="c-alert c-alert--success" role="status">
          <p class="c-alert-message">Se aplicaron ${String(set.changes.length)} cambios de acceso.</p>
        </div>
        <h3 class="ws-small">Acceso efectivo resultante</h3>
        ${acceso.rolesByBizCap.length
                ? `<ul class="ws-access">${acceso.rolesByBizCap
                    .map((r) => `<li class="ws-access__item"><span class="ws-access__bizcap">${protoEsc(r.bizCapId)}</span><span class="ws-role-list">${r.roles.map((rol) => `<span class="ws-role-chip">${protoEsc(PROTO_ROLE_LABEL[rol])}</span>`).join("")}</span></li>`)
                    .join("")}</ul>`
                : `<p class="ws-muted">Sin BizCaps asignadas: la persona conserva la membresía pero no tiene superficie operativa.</p>`}
        <p class="ws-muted ws-small">${String(acceso.permissions.length)} permisos efectivos, derivados de los roles resultantes.</p>`;
            sec.hidden = false;
            btn.disabled = true;
            document.querySelector("#adm-result-title")?.focus();
        }
    });
}
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector("[data-adm-surface]");
    if (!host)
        return;
    if (!protoIsAuthenticated())
        return;
    const tenantId = protoGetActiveTenantId();
    if (!tenantId)
        return;
    // El acceso a la administración lo decide el permiso en ESTE Tenant.
    if (!protoAdmPuedeAdministrar()) {
        location.replace(protoRouteHref("system", { state: "permission-denied" }));
        return;
    }
    const userId = protoAdmParam("userId");
    const view = protoAdmParam("view");
    if (!userId)
        protoRenderAdm06(host, tenantId);
    else if (view === "review")
        protoRenderAdm09(host, tenantId, userId);
    else
        protoRenderAdm0708(host, tenantId, userId);
});
