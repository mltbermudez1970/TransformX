/**
 * Catálogo de BizCaps del Tenant activo — TX-UX-MTAC-AMD-001 §7.
 *
 * Enumera **sólo las BizCaps asignadas al usuario en esta organización**. Una
 * BizCap sin asignación no aparece: no se muestra atenuada ni con un candado,
 * porque enseñar lo que otro tiene y tú no es información de la organización
 * que esta superficie no debe filtrar.
 *
 * Las asignadas que todavía no tienen superficie operativa (LAB-002, LAB-003)
 * sí aparecen, con su estado declarado. Es lo honesto: el usuario tiene el
 * acceso, lo que no existe todavía es el workspace.
 */

function protoRenderBizCaps(): void {
  const host = document.querySelector<HTMLElement>("[data-bizcaps-surface]");
  if (!host) return;

  const user = protoGetSessionUser();
  const tenantId = protoGetActiveTenantId();
  if (!user || !tenantId) return;

  const tenant = protoFindTenant(tenantId);
  const asignaciones = protoBizCapAssignmentsOf(user.userId, tenantId);

  const aviso = protoUrlParam("tenantNotice");
  const bizCapNoDisponible = protoUrlParam("bizCap");

  const tarjetas = asignaciones
    .map((a) => {
      const def = protoFindBizCap(a.bizCapId);
      if (!def) return "";
      const chips = a.roles
        .map((r) => `<span class="ws-role-chip">${protoEsc(PROTO_ROLE_LABEL[r])}</span>`)
        .join("");

      const accion = def.hasOperationalSurface && def.entryRouteId
        ? `<p class="ws-actions"><a class="c-btn c-btn--primary" href="${protoEsc(protoRouteHref(def.entryRouteId))}">Abrir ${protoEsc(def.bizCapId)}</a></p>`
        : `<p class="ws-muted ws-small"><strong>Sin superficie operativa en este prototipo.</strong> Tu acceso y tus funciones están registrados, pero las pantallas de trabajo de esta BizCap no forman parte del alcance de UX-14.</p>`;

      return `
        <li class="ws-card">
          <h2 class="ws-card__title">${protoEsc(def.bizCapId)} ${protoEsc(def.name)}</h2>
          <p class="ws-muted ws-small">${protoEsc(def.note)}</p>
          <p class="ws-card__roles">Tus funciones aquí: <span class="ws-role-list">${chips}</span></p>
          ${accion}
        </li>`;
    })
    .join("");

  host.innerHTML = `
    <p class="ws-code">BizCaps</p>
    <h1 class="ws-page__title" tabindex="-1">BizCaps en ${protoEsc(tenant ? tenant.name : tenantId)}</h1>
    <p class="ws-page__lead">Estas son las capacidades a las que tienes acceso en esta organización. En otra organización la lista puede ser distinta.</p>
    ${protoRenderMockNotice()}
    <div class="ws-feedback" data-bizcaps-feedback role="status" aria-live="polite"></div>

    ${aviso === "bizcap-not-available"
      ? `<div class="c-alert c-alert--warning" role="status">
           <p class="c-alert-message"><strong>Esa BizCap no está disponible aquí.</strong></p>
           <p class="c-alert-message">Venías de ${protoEsc(bizCapNoDisponible ?? "otra BizCap")}, que no está asignada en ${protoEsc(tenant ? tenant.name : "esta organización")}. Te dejamos en el catálogo en vez de abrir una superficie a la que no tienes acceso.</p>
         </div>`
      : ""}

    ${asignaciones.length
      ? `<ul class="ws-cards">${tarjetas}</ul>`
      : `<p class="ws-empty" role="status">No tienes ninguna BizCap asignada en esta organización. Pide acceso a la administración de ${protoEsc(tenant ? tenant.name : "tu organización")}.</p>`}`;

  if (aviso === "bizcap-not-available") {
    host.querySelector<HTMLElement>("h1")?.focus();
  }
}

document.addEventListener("DOMContentLoaded", protoRenderBizCaps);
