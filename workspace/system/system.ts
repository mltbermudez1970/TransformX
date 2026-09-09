/**
 * Superficies de sistema del prototipo autenticado — SYS-01…SYS-04.
 *
 * Representan estados transversales de recuperación. Ninguno es un callejón sin
 * salida: todos ofrecen una acción que devuelve al usuario a un contexto válido.
 * Los estados de negocio (conflicto, stale) no se representan como errores
 * técnicos; eso corresponde a PM-UX14-06.
 */

type ProtoSystemStateId =
  | "permission-denied" | "not-found" | "session-expired" | "recoverable-error" | "critical-error"
  /* Contexto de Tenant — TX-UX-MTAC-AMD-001 §12. Fallan en cerrado: ninguno
     deja al usuario dentro de un Workspace cuyo contexto no es válido. */
  | "no-tenant-access" | "tenant-access-revoked" | "tenant-context-stale";

interface ProtoSystemState {
  code: string;
  titulo: string;
  /** Qué pasó, en lenguaje del usuario. */
  explicacion: string;
  /** Por qué pasó, sin culpar al usuario ni exponer detalle técnico. */
  causa: string;
  /** `alert` para lo que interrumpe; `status` para lo informativo. */
  live: "alert" | "status";
  acciones: () => string;
}

function protoSystemParam(nombre: string): string | null {
  return new URLSearchParams(location.search).get(nombre);
}

/**
 * Bloqueo de gobernanza: la interfaz le dice al usuario "no puedes".
 *
 * Es el evento más importante de UX-14: mide cuántas veces la gobernanza
 * confunde en vez de guiar. No cuenta errores técnicos, cuenta momentos en los
 * que una persona choca contra una frontera y hay que ver si la entiende.
 */
function protoTrackBloqueo(motivo: string, detalle?: Record<string, string | null>): void {
  trackEvent("governed_block_encountered", {
    reason: motivo,
    route: document.body.getAttribute("data-route"),
    scenario_id: (() => { try { return protoGetActiveScenarioId(); } catch { return null; } })(),
    ...(detalle ?? {}),
  });
}

function protoSystemStateId(): ProtoSystemStateId {
  const s = protoSystemParam("state");
  const validos: ProtoSystemStateId[] = [
    "permission-denied", "not-found", "session-expired", "recoverable-error", "critical-error",
    "no-tenant-access", "tenant-access-revoked", "tenant-context-stale",
  ];
  return validos.find((v) => v === s) ?? "not-found";
}

/** Destino seguro al que devolver al usuario. */
function protoSystemVolver(): string {
  const ret = protoGetReturnTo();
  return ret ? protoResolveRoute(ret) : protoRouteHref("home");
}

/** Salida segura cuando el contexto de organización no es utilizable. */
function protoTenantExitActions(): string {
  return `
    <a class="c-btn c-btn--primary" href="${protoRouteHref("auth", { screen: "select-organization" })}">Elegir otra organización</a>
    <a class="c-btn c-btn--secondary" href="${protoRouteHref("auth", { screen: "sign-in" })}">Volver a iniciar sesión</a>`;
}

const PROTO_SYSTEM_STATES: Record<ProtoSystemStateId, ProtoSystemState> = {
  "no-tenant-access": {
    code: "SYS-09",
    titulo: "Todavía no perteneces a ninguna organización",
    explicacion: "Tu identidad es válida, pero no tienes ninguna membresía activa en TransformX.",
    causa: "El acceso a una organización lo concede su administración, no se obtiene al crear la cuenta. No se abre un Workspace vacío porque no habría contexto en el que trabajar.",
    live: "status",
    acciones: () => `
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("auth", { screen: "sign-in" })}">Volver a iniciar sesión</a>`,
  },
  "tenant-access-revoked": {
    code: "SYS-10",
    titulo: "Tu acceso a esta organización ya no está activo",
    explicacion: "La membresía con la que estabas trabajando fue revocada o suspendida.",
    causa: "La administración de esa organización cambió tu acceso. El contexto se cierra de inmediato: no se sigue mostrando información de una organización a la que ya no perteneces.",
    live: "alert",
    acciones: protoTenantExitActions,
  },
  "tenant-context-stale": {
    code: "SYS-11",
    titulo: "El contexto de organización está desactualizado",
    explicacion: "La organización guardada en esta sesión ya no coincide con tus membresías.",
    causa: "Tu acceso cambió mientras la sesión estaba abierta. Hay que volver a resolver el contexto antes de continuar: seguir con el anterior mostraría datos que ya no te corresponden.",
    live: "alert",
    acciones: protoTenantExitActions,
  },
  "permission-denied": {
    code: "SYS-01",
    titulo: "No tienes permiso para ver esto",
    explicacion: "Tu rol en esta organización no incluye acceso a esta superficie.",
    causa: "Es un resultado de gobernanza, no un error del sistema. Los permisos los define la organización, no la aplicación.",
    live: "alert",
    acciones: () => `
      <a class="c-btn c-btn--primary" href="${protoRouteHref("home")}">Volver al inicio</a>
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("my-work")}">Ir a My Work</a>`,
  },
  "not-found": {
    code: "SYS-02",
    titulo: "No encontramos ese elemento",
    explicacion: "El elemento no existe, cambió de estado o ya no está disponible para ti.",
    causa: "Puede haberse resuelto, reasignado o archivado mientras lo abrías.",
    live: "status",
    acciones: () => `
      <a class="c-btn c-btn--primary" href="${protoRouteHref("my-work")}">Volver a My Work</a>
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("home")}">Ir al inicio</a>`,
  },
  "session-expired": {
    code: "SYS-03",
    titulo: "Tu sesión caducó",
    explicacion: "Por seguridad cerramos la sesión tras un periodo de inactividad.",
    causa: "Al volver a entrar te devolvemos exactamente a donde estabas.",
    live: "alert",
    acciones: () => {
      const ret = protoGetReturnTo();
      const extra: Record<string, string> = { screen: "sign-in" };
      if (ret) extra["returnTo"] = encodeURIComponent(ret);
      return `<a class="c-btn c-btn--primary" href="${protoRouteHref("auth", extra)}">Volver a iniciar sesión</a>`;
    },
  },
  "critical-error": {
    code: "SYS-05",
    titulo: "No podemos continuar con esta operación",
    explicacion: "Ocurrió un error que requiere intervención antes de continuar. Nada quedó a medias: la operación no se aplicó.",
    causa: "A diferencia de un error recuperable, reintentar sin más no es seguro. Comparte la referencia de abajo con soporte.",
    live: "alert",
    acciones: () => {
      const leadId = protoSystemParam("leadId");
      return `
      ${leadId ? `<a class="c-btn c-btn--primary" href="${protoRouteHref("lab-001-leads", { leadId })}">Volver al lead</a>` : ""}
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("my-work")}">Volver a My Work</a>
      <a class="c-btn c-btn--secondary" href="${protoRouteHref("home")}">Ir al inicio</a>`;
    },
  },
  "recoverable-error": {
    code: "SYS-04",
    titulo: "No pudimos completar la operación",
    explicacion: "Ocurrió un problema temporal. No se perdió nada de lo que habías introducido.",
    causa: "Puedes reintentar. Si persiste, el equipo de soporte puede revisarlo con el identificador de abajo.",
    live: "alert",
    acciones: () => `
      <button type="button" class="c-btn c-btn--primary" data-sys-retry>Reintentar</button>
      <a class="c-btn c-btn--secondary" href="${protoSystemVolver()}">Volver al contexto anterior</a>`,
  },
};

function protoInitSystem(): void {
  const host = document.querySelector<HTMLElement>("[data-system-surface]");
  if (!host) return;

  const id = protoSystemStateId();
  const estado = PROTO_SYSTEM_STATES[id];
  document.title = `${estado.code} ${estado.titulo} — Workspace (prototipo)`;

  // Llegar a una superficie de sistema es, casi siempre, haber chocado con una
  // frontera. Se registra el código para poder contarlo por tipo.
  protoTrackBloqueo(id, { sys_code: estado.code });

  host.innerHTML = `
    <div class="sys-card" role="${estado.live}">
      <p class="sys-card__code">${estado.code}</p>
      <h1 class="sys-card__title" id="sys-title">${estado.titulo}</h1>
      <p class="sys-card__text">${estado.explicacion}</p>
      <p class="sys-card__text sys-card__text--muted">${estado.causa}</p>
      ${id === "recoverable-error" ? `<p class="sys-card__ref">Referencia sintética: <code>req-0001</code></p>` : ""}
      ${id === "critical-error" ? `<p class="sys-card__ref">Referencia para soporte: <code>${protoSystemParam("ref") ?? "ERR-UX14-0006"}</code></p><p class="ws-muted ws-small">No se muestran trazas ni detalles de infraestructura.</p>` : ""}
      <div class="ws-actions" data-sys-actions>${estado.acciones()}</div>
    </div>
    <nav class="sys-index" aria-label="Estados del sistema">
      <h2 class="sys-index__title">Estados transversales</h2>
      <ul>
        ${(Object.keys(PROTO_SYSTEM_STATES) as ProtoSystemStateId[])
          .map((k) => {
            const s = PROTO_SYSTEM_STATES[k];
            const actual = k === id;
            return `<li><a href="${protoRouteHref("system", { state: k })}" ${actual ? 'aria-current="page"' : ""}>${s.code} ${s.titulo}</a></li>`;
          })
          .join("")}
      </ul>
    </nav>`;

  document.querySelector<HTMLButtonElement>("[data-sys-retry]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    btn.classList.add("c-btn--loading");
    btn.setAttribute("aria-busy", "true");
    const res = await protoMockRequest({ operationId: "system.retry", outcome: "success", latencyMs: 800 });
    btn.disabled = false;
    btn.classList.remove("c-btn--loading");
    btn.setAttribute("aria-busy", "false");
    const zona = document.querySelector<HTMLElement>("[data-sys-actions]");
    if (zona && res.ok) {
      const aviso = document.createElement("p");
      aviso.className = "sys-card__text";
      aviso.setAttribute("role", "status");
      aviso.textContent = "Reintento correcto (simulado). Puedes volver a tu contexto anterior.";
      zona.insertAdjacentElement("afterend", aviso);
    }
  });
}

document.addEventListener("DOMContentLoaded", protoInitSystem);
