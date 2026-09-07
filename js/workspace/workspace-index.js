"use strict";
/**
 * Home del Workspace autenticado (APP-01) — sólo prototipo.
 *
 * Muestra el contexto de la sesión simulada y el catálogo de escenarios
 * UX-14, que sigue siendo el control del prototipo hasta que PM-UX14-07
 * construya el selector definitivo.
 */
/** Prompt que construye el contenido operativo de cada superficie. */
const PROTO_SURFACE_PHASE = {
    "workspace/my-work/": "PM-UX14-04",
    "workspace/leads/": "PM-UX14-04",
    "workspace/missing-information/": "PM-UX14-04",
    "workspace/qualification/": "PM-UX14-04",
    "workspace/reviews/": "PM-UX14-05",
    "workspace/assignment/": "PM-UX14-05",
    "workspace/opportunity/": "PM-UX14-06",
    "workspace/system/": "PM-UX14-03",
};
function renderContextoSesion() {
    const host = document.querySelector("[data-home-context]");
    if (!host)
        return;
    const user = protoGetSessionUser();
    const session = protoGetSession();
    const scenario = protoGetActiveScenario();
    if (!user || !session)
        return;
    const policy = protoPolicyOf(user);
    const minutos = Math.max(0, Math.round((session.expiresAt - Date.now()) / 60_000));
    host.innerHTML = `
    <h1 class="ws-page__title">Hola, ${user.displayName.split(" ")[0] ?? user.displayName}</h1>
    <p class="ws-page__lead">${PROTO_ORGANIZATION.name} · ${PROTO_ORGANIZATION.bizcapId} ${PROTO_ORGANIZATION.bizcapName}</p>
    <dl class="ws-context">
      <div><dt>Actor</dt><dd>${user.displayName} — ${protoRoleLabelOf(user)}</dd></div>
      <div><dt>Ámbito y permisos</dt><dd>${user.scopes.join(", ")} · ${String(user.permissions.length)} permisos declarados</dd></div>
      <div><dt>Política</dt><dd>${policy ? policy.label : user.policyId}</dd></div>
      <div><dt>Segundo factor</dt><dd>${session.mfaSatisfied ? "Satisfecho" : "Pendiente"}${session.trustedDevice ? " · dispositivo de confianza" : ""}</dd></div>
      <div><dt>Sesión simulada</dt><dd>~${String(minutos)} min restantes</dd></div>
      <div><dt>Escenario activo</dt><dd>${scenario ? `${scenario.scenarioId} — ${scenario.title}` : "sin escenario"}</dd></div>
    </dl>`;
}
function renderScenarioCatalog() {
    const body = document.querySelector("[data-scenario-rows]");
    if (!body)
        return;
    const activo = protoGetActiveScenarioId();
    PROTO_SCENARIOS.forEach((scenario) => {
        const actor = PROTO_ACTORS.find((candidate) => candidate.actorId === scenario.actor);
        const leadCount = protoGetLeads(scenario.fixtureSet).length;
        const phase = PROTO_SURFACE_PHASE[scenario.initialRoute] ?? "por confirmar";
        const row = document.createElement("tr");
        if (scenario.scenarioId === activo)
            row.className = "is-current";
        const th = document.createElement("th");
        th.setAttribute("scope", "row");
        th.textContent = scenario.scenarioId;
        row.appendChild(th);
        [
            scenario.title,
            actor ? actor.displayName : scenario.actor,
            scenario.initialRoute,
            `${scenario.fixtureSet} (${String(leadCount)})`,
            scenario.mockOutcome,
            phase,
        ].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });
        const acciones = document.createElement("td");
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "c-btn c-btn--secondary";
        boton.textContent = scenario.scenarioId === activo ? "Activo" : "Activar";
        boton.disabled = scenario.scenarioId === activo;
        boton.addEventListener("click", () => {
            protoSetActiveScenario(scenario.scenarioId);
            location.reload();
        });
        acciones.appendChild(boton);
        row.appendChild(acciones);
        body.appendChild(row);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    if (!protoIsAuthenticated())
        return; // el shell ya habrá redirigido
    renderContextoSesion();
    renderScenarioCatalog();
});
