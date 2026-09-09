/**
 * Selector y reset de escenarios UX-14 (PM-UX14-07 §A).
 *
 * Disponible desde cualquier superficie del workspace. Activar un escenario:
 *  1. fija el escenario activo,
 *  2. cambia el actor simulado al que declara el escenario,
 *  3. limpia el estado acumulado de la sesión (comandos aplicados,
 *     oportunidades creadas, estado de vista) para que sea reproducible,
 *  4. navega a su `initialRoute`.
 *
 * El panel muestra `expectedAvailableActions` y `expectedOutcome` para que
 * quien facilite la sesión pueda contrastar lo que ve con lo esperado.
 */

/** Usuario de identidad que corresponde al actor declarado por el escenario. */
function protoUserForActor(actorId: string): ProtoAuthUser | null {
  return PROTO_AUTH_USERS.find((u) => u.actorId === actorId && u.status === "active") ?? null;
}

/** Limpia el estado acumulado, conservando la sesión. */
function protoResetScenarioState(): void {
  protoResetCommandLog();
  protoResetCreatedOpportunities();
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PROTO_VIEW_STATE_PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* sessionStorage no disponible */
  }
}

/** Activa un escenario y navega a su ruta inicial con el actor correcto. */
function protoActivateScenario(scenarioId: string): void {
  const s = protoGetScenario(scenarioId);
  if (!s) return;

  trackEvent("scenario_activated", {
    scenario_id: scenarioId,
    scenario_title: s.title,
    actor: s.actor,
    tenant_id: s.tenantId ?? null,
  });

  protoSetActiveScenario(scenarioId);
  protoResetScenarioState();

  const user = protoUserForActor(s.actor);
  if (user) {
    // El escenario declara el actor: la sesión simulada lo adopta.
    protoStartSession(user, true, false);
    // …y también su organización. Un escenario entra directo a la superficie
    // que quiere validar: no debe pasar por AUTH-13 cada vez. Si el escenario
    // no declara Tenant se resuelve la primera membresía activa del actor.
    const tenantId = s.tenantId ?? protoActiveMembershipsOf(user.userId)[0]?.tenantId;
    if (tenantId) protoSetActiveTenant(tenantId);
  }

  location.assign(protoResolveRoute(s.initialRoute));
}

function protoRenderScenarioPanel(): string {
  const activo = protoGetActiveScenarioId();

  const filas = PROTO_SCENARIOS.map((s) => {
    const actor = PROTO_ACTORS.find((a) => a.actorId === s.actor);
    const esActual = s.scenarioId === activo;
    return `
      <tr class="${esActual ? "is-current" : ""}">
        <th scope="row">${protoEscape(s.scenarioId)}</th>
        <td>${protoEscape(s.title)}</td>
        <td>${protoEscape(actor ? actor.displayName : s.actor)}<br><span class="ws-muted ws-small">${protoEscape(actor ? PROTO_ROLE_LABEL[actor.role] : "")}</span></td>
        <td><code>${protoEscape(s.initialRoute)}</code></td>
        <td class="ws-small">${s.expectedAvailableActions.length
          ? s.expectedAvailableActions.map((a) => protoEscape(a)).join("<br>")
          : "<span class='ws-muted'>ninguna (acciones suspendidas)</span>"}</td>
        <td class="ws-small">${protoEscape(s.expectedOutcome)}</td>
        <td><button type="button" class="c-btn c-btn--secondary" data-scenario-go="${protoEscape(s.scenarioId)}"
              ${esActual ? "" : ""}>${esActual ? "Reactivar" : "Activar"}</button></td>
      </tr>`;
  }).join("");

  return `
    <dialog class="c-dialog ws-scenario-dialog" id="ws-scenario-dialog" aria-labelledby="ws-scn-title">
      <h3 class="c-dialog-title" id="ws-scn-title">Escenarios UX-14</h3>
      <p class="c-dialog-body">Activar un escenario fija su actor, limpia el estado acumulado de la sesión y abre su ruta inicial. Los valores esperados son la referencia de validación, no la fuente que consume la interfaz.</p>
      <div class="workspace-table-wrapper ws-scenario-table">
        <table class="workspace-table">
          <caption class="sr-only">Escenarios S-01 a S-10</caption>
          <thead><tr>
            <th scope="col">ID</th><th scope="col">Título</th><th scope="col">Actor</th>
            <th scope="col">Ruta inicial</th><th scope="col">Acciones esperadas</th>
            <th scope="col">Resultado esperado</th><th scope="col">Acción</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <div class="c-dialog-actions">
        <button type="button" class="c-btn c-btn--secondary" data-scenario-reset>Reiniciar estado</button>
        <button type="button" class="c-btn c-btn--secondary" data-scenario-close>Cerrar</button>
      </div>
    </dialog>`;
}

function protoWireScenarioSelector(): void {
  const dialog = document.querySelector<HTMLDialogElement>("#ws-scenario-dialog");
  const trigger = document.querySelector<HTMLButtonElement>("[data-scenario-open]");
  if (!dialog || !trigger) return;

  trigger.addEventListener("click", () => {
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-scenario-go]")?.focus();
  });

  dialog.querySelector<HTMLButtonElement>("[data-scenario-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => trigger.focus());

  dialog.querySelectorAll<HTMLButtonElement>("[data-scenario-go]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-scenario-go");
      if (id) protoActivateScenario(id);
    });
  });

  dialog.querySelector<HTMLButtonElement>("[data-scenario-reset]")?.addEventListener("click", () => {
    protoResetScenarioState();
    location.reload();
  });
}
