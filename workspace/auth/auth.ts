/**
 * Superficies de identidad AUTH-01…AUTH-12 — CÓDIGO EXCLUSIVO DE PROTOTIPO.
 *
 * Reglas duras que este archivo respeta:
 *  - No hay credenciales reales, OAuth, proveedor MFA ni backend de sesión.
 *    Ninguna contraseña, OTP o código de recuperación se compara con nada:
 *    el desenlace lo fija el perfil sintético o el parámetro `?outcome=`.
 *  - El flujo público de recuperación NO revela si una cuenta existe.
 *  - Capio no recibe jamás contraseñas, OTP, códigos de recuperación ni
 *    secretos de autenticador: en las superficies de identidad el shell no
 *    monta el acceso a Capio, y `protoContieneSecreto()` (en `session.ts`,
 *    cargado por todas las páginas) bloquea ese contenido donde sí lo hay.
 *  - Nada se persiste salvo el objeto de sesión simulada de `session.ts`.
 */

type ProtoAuthScreenId =
  | "sign-in"
  | "forgot-password"
  | "reset-password"
  | "change-password"
  | "account-locked"
  | "sign-up"
  | "invitation"
  | "mfa-enrollment"
  | "mfa-challenge"
  | "mfa-recovery"
  | "trusted-device"
  | "step-up"
  /** AUTH-13 — TX-UX-MTAC-AMD-001 §5. */
  | "select-organization";

interface ProtoAuthScreen {
  code: string;
  titulo: string;
  intro: string;
  render: () => string;
  wire: () => void;
}

/** Clave de ejemplo, obviamente falsa; no es un secreto TOTP funcional. */
const PROTO_FAKE_SETUP_KEY = "DEMO-ONLY-NO-ES-UN-SECRETO-REAL";

function protoAuthParam(nombre: string): string | null {
  return new URLSearchParams(location.search).get(nombre);
}

function protoAuthScreenId(): ProtoAuthScreenId {
  const s = protoAuthParam("screen");
  const validos: ProtoAuthScreenId[] = [
    "sign-in", "forgot-password", "reset-password", "change-password",
    "account-locked", "sign-up", "invitation", "mfa-enrollment",
    "select-organization",
    "mfa-challenge", "mfa-recovery", "trusted-device", "step-up",
  ];
  return validos.find((v) => v === s) ?? "sign-in";
}

/** Permite forzar un desenlace desde el escenario o la URL. */
function protoAuthForcedOutcome(): ProtoAuthOutcome | null {
  const o = protoAuthParam("outcome");
  const validos: ProtoAuthOutcome[] = [
    "success", "auth_failure", "locked", "recovery",
    "mfa_required", "step_up_required", "session_expired",
  ];
  return validos.find((v) => v === o) ?? null;
}

/* ---------------------------------------------------------------------------
 * Utilidades de UI
 * ------------------------------------------------------------------------- */

/** Feedback con la familia operacional `.c-alert` (Resolution Package §13.2). */
function protoAuthFeedback(mensaje: string, tipo: "error" | "ok" | "info"): void {
  const zona = document.querySelector<HTMLElement>("[data-auth-feedback]");
  if (!zona) return;
  const severidad = tipo === "ok" ? "success" : tipo === "error" ? "error" : "info";
  zona.className = `auth-feedback ws-feedback c-alert c-alert--${severidad}`;
  zona.setAttribute("role", severidad === "error" ? "alert" : "status");
  zona.setAttribute("aria-live", severidad === "error" ? "assertive" : "polite");
  zona.innerHTML = "";
  const p = document.createElement("p");
  p.className = "c-alert-message";
  p.textContent = mensaje;
  zona.appendChild(p);
  zona.hidden = false;
}

/**
 * Vacía el mensaje pero deja la región live declarada y en el árbol de
 * accesibilidad: ocultarla con `hidden` obligaría al lector de pantalla a
 * descubrirla y anunciarla en el mismo instante, que es justo el caso que no
 * se anuncia de forma fiable.
 */
function protoAuthLimpiarFeedback(): void {
  const zona = document.querySelector<HTMLElement>("[data-auth-feedback]");
  if (!zona) return;
  zona.className = "auth-feedback ws-feedback";
  zona.setAttribute("role", "status");
  zona.setAttribute("aria-live", "polite");
  zona.textContent = "";
  zona.hidden = false;
}

function protoAuthMarcarCampo(input: HTMLInputElement, invalido: boolean): void {
  input.setAttribute("aria-invalid", String(invalido));
}

/**
 * Envío único: el botón queda deshabilitado y en estado `.c-btn--loading`
 * mientras la operación está en curso. La etiqueta no se sustituye por
 * "Procesando…": el estado se comunica por `aria-busy` y por el indicador
 * visual del componente, no cambiando el nombre accesible del control.
 */
function protoAuthOcupado(boton: HTMLButtonElement, ocupado: boolean, etiqueta: string): void {
  boton.disabled = ocupado;
  boton.classList.toggle("c-btn--loading", ocupado);
  boton.setAttribute("aria-busy", String(ocupado));
  boton.textContent = etiqueta;
}

function protoAuthIrA(ruta: string): void {
  location.assign(ruta);
}

/** Conserva `returnTo` al saltar entre superficies de identidad. */
function protoAuthHref(screen: ProtoAuthScreenId, extra?: Record<string, string>): string {
  const params: Record<string, string> = { screen, ...(extra ?? {}) };
  const ret = protoAuthParam("returnTo");
  if (ret) params["returnTo"] = ret;
  return protoRouteHref("auth", params);
}

/**
 * Destino tras autenticar. La identidad ya está verificada; lo que falta es
 * resolver el **contexto de organización** (TX-UX-MTAC-AMD-001 §3):
 *
 *   0 membresías activas → estado gobernado sin acceso (no un Workspace falso)
 *   1 membresía activa   → se establece sola, sin preguntar
 *  >1 membresías activas → AUTH-13 Seleccionar organización
 *
 * El `returnTo` sobrevive a los tres caminos: quien entró queriendo llegar a
 * un sitio concreto sigue llegando después de resolver la organización.
 */
function protoAuthLanding(): string {
  const user = protoGetSessionUser();
  if (!user) return protoResolveRoute(protoResolveLanding());

  const resolucion = protoResolveTenantMemberships(user.userId);

  if (resolucion.kind === "none") {
    return protoRouteHref("system", { state: "no-tenant-access" });
  }

  if (resolucion.kind === "auto") {
    protoSetActiveTenant(resolucion.tenantId);
    return protoResolveRoute(protoResolveLanding());
  }

  const extra: Record<string, string> = { screen: "select-organization" };
  const ret = protoAuthParam("returnTo");
  if (ret) extra["returnTo"] = ret;
  return protoRouteHref("auth", extra);
}

function protoAuthCampo(
  id: string, label: string, type: string, autocomplete: string, ayuda?: string
): string {
  return `
    <div class="auth-field">
      <label class="form-label" for="${id}">${label}</label>
      <input class="form-input" type="${type}" id="${id}" name="${id}" autocomplete="${autocomplete}"
             ${ayuda ? `aria-describedby="${id}-help"` : ""} required>
      ${ayuda ? `<p class="form-hint" id="${id}-help">${ayuda}</p>` : ""}
    </div>`;
}

/* ---------------------------------------------------------------------------
 * AUTH-01 Sign In
 * ------------------------------------------------------------------------- */

function protoRenderSignIn(): string {
  return `
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("email", "Correo corporativo", "email", "username")}
      ${protoAuthCampo("password", "Contraseña", "password", "current-password")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Iniciar sesión</button>
    </form>
    <ul class="auth-links">
      <li><a href="${protoAuthHref("forgot-password")}">¿Olvidaste tu contraseña?</a></li>
      <li><a href="${protoAuthHref("sign-up")}">Solicitar acceso</a></li>
      <li><a href="${protoAuthHref("invitation")}">Tengo una invitación</a></li>
    </ul>
    ${protoRenderGuionUsuarios()}`;
}

/** Guion visible para quien facilite la sesión de validación. */
function protoRenderGuionUsuarios(): string {
  const filas = PROTO_AUTH_USERS.map(
    (u) => `<tr><th scope="row">${u.email}</th><td>${u.guion}</td></tr>`
  ).join("");
  return `
    <details class="auth-guion">
      <summary>Perfiles sintéticos para la sesión de validación</summary>
      <p class="form-hint">Cualquier contraseña no vacía es aceptada: no se verifica nada. El desenlace lo fija el perfil.</p>
      <div class="workspace-table-wrapper">
        <table class="workspace-table">
          <caption class="sr-only">Perfiles sintéticos y su guion</caption>
          <thead><tr><th scope="col">Correo</th><th scope="col">Qué demuestra</th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
      <p class="form-hint">Un correo desconocido produce fallo genérico, sin revelar si la cuenta existe.</p>
    </details>`;
}

function protoWireSignIn(): void {
  const form = document.querySelector<HTMLFormElement>("[data-auth-form]");
  const btn = document.querySelector<HTMLButtonElement>("[data-auth-submit]");
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    protoAuthLimpiarFeedback();

    const email = form.querySelector<HTMLInputElement>("#email");
    const pass = form.querySelector<HTMLInputElement>("#password");
    if (!email || !pass) return;

    const faltaEmail = email.value.trim() === "";
    const faltaPass = pass.value === "";
    protoAuthMarcarCampo(email, faltaEmail);
    protoAuthMarcarCampo(pass, faltaPass);
    if (faltaEmail || faltaPass) {
      protoAuthFeedback("Ingresa tu correo corporativo y tu contraseña.", "error");
      (faltaEmail ? email : pass).focus();
      return;
    }

    protoAuthOcupado(btn, true, "Iniciar sesión");
    const user = protoFindAuthUser(email.value);
    const forzado = protoAuthForcedOutcome();
    const desenlace: ProtoAuthOutcome = forzado ?? (user ? user.scriptedOutcome : "auth_failure");

    const res = await protoMockRequest<{ ok: boolean }>({
      operationId: "auth.signIn",
      outcome: desenlace === "auth_failure" ? "permission_denied" : "success",
      latencyMs: 600,
    });
    protoAuthOcupado(btn, false, "Iniciar sesión");
    if (!res) return;

    if (!user || desenlace === "auth_failure") {
      // Mensaje genérico: no revela si la cuenta existe.
      protoAuthFeedback("No pudimos validar esas credenciales. Revisa los datos e inténtalo de nuevo.", "error");
      protoAuthMarcarCampo(email, true);
      protoAuthMarcarCampo(pass, true);
      email.focus();
      return;
    }

    if (user.status === "locked" || desenlace === "locked") {
      protoAuthIrA(protoAuthHref("account-locked", { user: user.userId }));
      return;
    }

    if (user.status === "invited") {
      protoAuthIrA(protoAuthHref("invitation", { user: user.userId }));
      return;
    }

    // Credenciales aceptadas: sesión abierta pero SIN segundo factor satisfecho.
    protoStartSession(user, false, false);
    const policy = protoPolicyOf(user);

    if (policy?.mfaRequired && !user.mfaEnrolled) {
      protoAuthIrA(protoAuthHref("mfa-enrollment"));
      return;
    }
    if (policy?.mfaRequired) {
      protoAuthIrA(protoAuthHref("mfa-challenge"));
      return;
    }

    protoMarkMfaSatisfied(false);
    protoAuthIrA(protoAuthLanding());
  });
}

/* ---------------------------------------------------------------------------
 * AUTH-02 / AUTH-03 / AUTH-04 — contraseña
 * ------------------------------------------------------------------------- */

function protoRenderForgot(): string {
  return `
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("email", "Correo corporativo", "email", "username",
        "Si existe una cuenta asociada, recibirás instrucciones. No confirmamos si un correo está registrado.")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Enviar instrucciones</button>
    </form>
    <ul class="auth-links"><li><a href="${protoAuthHref("sign-in")}">Volver a iniciar sesión</a></li></ul>`;
}

function protoWireForgot(): void {
  const form = document.querySelector<HTMLFormElement>("[data-auth-form]");
  const btn = document.querySelector<HTMLButtonElement>("[data-auth-submit]");
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.querySelector<HTMLInputElement>("#email");
    if (!email) return;
    if (email.value.trim() === "") {
      protoAuthMarcarCampo(email, true);
      protoAuthFeedback("Ingresa tu correo corporativo.", "error");
      email.focus();
      return;
    }
    protoAuthMarcarCampo(email, false);
    protoAuthOcupado(btn, true, "Enviar instrucciones");
    await protoMockRequest({ operationId: "auth.forgotPassword", outcome: "success", latencyMs: 700 });
    protoAuthOcupado(btn, false, "Enviar instrucciones");

    // Respuesta idéntica exista o no la cuenta (no account enumeration).
    protoAuthFeedback(
      "Si ese correo corresponde a una cuenta, enviamos instrucciones para restablecer la contraseña. Revisa tu bandeja. (Simulado: no se envía ningún correo.)",
      "ok"
    );
    form.hidden = true;
    document.querySelector<HTMLElement>("[data-auth-feedback]")?.focus();
    protoAuthAgregarAccion("Continuar al paso de restablecimiento (simulado)", protoAuthHref("reset-password"));
  });
}

function protoRenderReset(): string {
  return `
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("nueva", "Nueva contraseña", "password", "new-password", "Mínimo 12 caracteres en este prototipo.")}
      ${protoAuthCampo("confirmar", "Confirmar contraseña", "password", "new-password")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Restablecer contraseña</button>
    </form>`;
}

function protoRenderChange(): string {
  return `
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("actual", "Contraseña actual", "password", "current-password")}
      ${protoAuthCampo("nueva", "Nueva contraseña", "password", "new-password", "Mínimo 12 caracteres en este prototipo.")}
      ${protoAuthCampo("confirmar", "Confirmar contraseña", "password", "new-password")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Cambiar contraseña</button>
    </form>`;
}

function protoWirePassword(etiqueta: string, destino: () => string): void {
  const form = document.querySelector<HTMLFormElement>("[data-auth-form]");
  const btn = document.querySelector<HTMLButtonElement>("[data-auth-submit]");
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nueva = form.querySelector<HTMLInputElement>("#nueva");
    const conf = form.querySelector<HTMLInputElement>("#confirmar");
    if (!nueva || !conf) return;

    const corta = nueva.value.length < 12;
    const distinta = nueva.value !== conf.value;
    protoAuthMarcarCampo(nueva, corta);
    protoAuthMarcarCampo(conf, distinta);

    if (corta) {
      protoAuthFeedback("La contraseña debe tener al menos 12 caracteres.", "error");
      nueva.focus();
      return;
    }
    if (distinta) {
      protoAuthFeedback("Las contraseñas no coinciden.", "error");
      conf.focus();
      return;
    }

    protoAuthOcupado(btn, true, etiqueta);
    await protoMockRequest({ operationId: "auth.setPassword", outcome: "success", latencyMs: 650 });
    protoAuthOcupado(btn, false, etiqueta);
    protoAuthFeedback("Contraseña actualizada (simulado). Nada se guardó ni se transmitió.", "ok");
    form.hidden = true;
    protoAuthAgregarAccion("Continuar", destino());
  });
}

/* ---------------------------------------------------------------------------
 * AUTH-05 Locked · AUTH-06 Sign Up · AUTH-07 Invitación
 * ------------------------------------------------------------------------- */

function protoRenderLocked(): string {
  return `
    <div class="auth-note" role="alert">
      Por seguridad, el acceso a esta cuenta está bloqueado. El bloqueo es un
      resultado de política, no un error técnico.
    </div>
    <p>Un administrador de tu organización puede desbloquearla, o puedes solicitar el desbloqueo por correo.</p>
    <div class="ws-actions">
      <button type="button" class="c-btn c-btn--primary" data-auth-unlock>Solicitar desbloqueo</button>
      <a class="c-btn c-btn--secondary" href="${protoAuthHref("sign-in")}">Volver a iniciar sesión</a>
    </div>`;
}

function protoWireLocked(): void {
  document.querySelector<HTMLButtonElement>("[data-auth-unlock]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    protoAuthOcupado(btn, true, "Solicitar desbloqueo");
    await protoMockRequest({ operationId: "auth.requestUnlock", outcome: "success", latencyMs: 600 });
    protoAuthOcupado(btn, false, "Solicitar desbloqueo");
    protoAuthFeedback("Solicitud de desbloqueo registrada (simulado). Un administrador debe aprobarla.", "ok");
  });
}

function protoRenderSignUp(): string {
  return `
    <div class="auth-note" role="note">
      TransformX no crea cuentas desde el sitio público. Esta superficie registra
      una solicitud de acceso; la organización y su gobernanza se configuran en la adopción.
    </div>
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("nombre", "Nombre y apellido", "text", "name")}
      ${protoAuthCampo("email", "Correo corporativo", "email", "username")}
      ${protoAuthCampo("empresa", "Organización", "text", "organization")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Solicitar acceso</button>
    </form>
    <ul class="auth-links"><li><a href="${protoAuthHref("sign-in")}">Ya tengo acceso</a></li></ul>`;
}

function protoWireSignUp(): void {
  const form = document.querySelector<HTMLFormElement>("[data-auth-form]");
  const btn = document.querySelector<HTMLButtonElement>("[data-auth-submit]");
  if (!form || !btn) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const campos = [...form.querySelectorAll<HTMLInputElement>("input")];
    const vacio = campos.find((c) => c.value.trim() === "");
    campos.forEach((c) => protoAuthMarcarCampo(c, c.value.trim() === ""));
    if (vacio) {
      protoAuthFeedback("Completa todos los campos.", "error");
      vacio.focus();
      return;
    }
    protoAuthOcupado(btn, true, "Solicitar acceso");
    await protoMockRequest({ operationId: "auth.signUp", outcome: "success", latencyMs: 700 });
    protoAuthOcupado(btn, false, "Solicitar acceso");
    protoAuthFeedback("Solicitud registrada (simulado). No se creó ninguna cuenta ni se envió ningún dato.", "ok");
    form.hidden = true;
  });
}

function protoRenderInvitation(): string {
  return `
    <div class="auth-note" role="note">
      Primer acceso por invitación. Define tu contraseña y, si la política de tu
      organización lo exige, inscribe un segundo factor.
    </div>
    <form class="auth-form" data-auth-form novalidate>
      ${protoAuthCampo("nueva", "Define tu contraseña", "password", "new-password", "Mínimo 12 caracteres en este prototipo.")}
      ${protoAuthCampo("confirmar", "Confirmar contraseña", "password", "new-password")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Activar acceso</button>
    </form>`;
}

/* ---------------------------------------------------------------------------
 * AUTH-08 · AUTH-09 · AUTH-10 · AUTH-11 · AUTH-12 — segundo factor
 * ------------------------------------------------------------------------- */

function protoRenderCampoOtp(label: string): string {
  return `
    <div class="auth-field">
      <label class="form-label" for="otp">${label}</label>
      <input class="form-input auth-otp" type="text" id="otp" name="otp" inputmode="numeric"
             autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"
             aria-describedby="otp-help" required>
      <p class="form-hint" id="otp-help">Seis dígitos. En el prototipo cualquier combinación es válida excepto <code>000000</code>, que demuestra el fallo.</p>
    </div>`;
}

function protoRenderMfaEnrollment(): string {
  const user = protoGetSessionUser();
  const policy = user ? protoPolicyOf(user) : null;
  return `
    <div class="auth-note" role="note">
      ${policy?.mfaRequired ? "La política de tu organización exige un segundo factor." : "El segundo factor es opcional según tu política."}
      Esta inscripción es simulada: no se genera ni almacena ningún secreto.
    </div>
    <div class="auth-secret">
      <p class="form-label">Clave de configuración (ejemplo)</p>
      <p class="auth-secret__value">${PROTO_FAKE_SETUP_KEY}</p>
      <p class="form-hint">Cadena ficticia. No funciona en ninguna app de autenticación real.</p>
    </div>
    <form class="auth-form" data-auth-form novalidate>
      ${protoRenderCampoOtp("Código de verificación")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Inscribir segundo factor</button>
    </form>`;
}

function protoRenderMfaChallenge(): string {
  const user = protoGetSessionUser();
  const policy = user ? protoPolicyOf(user) : null;
  return `
    <p>Introduce el código de tu aplicación de autenticación para completar el acceso${user ? ` como <strong>${user.displayName}</strong>` : ""}.</p>
    <form class="auth-form" data-auth-form novalidate>
      ${protoRenderCampoOtp("Código de verificación")}
      ${
        policy?.allowTrustedDevice
          ? `<label class="auth-check"><input type="checkbox" id="trusted" name="trusted"> Recordar este dispositivo ${policy.trustedDeviceDays} días</label>
             <p class="form-hint">Opción permitida por la política <em>${policy.label}</em>.</p>`
          : `<p class="form-hint">Tu política no permite marcar dispositivos de confianza.</p>`
      }
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Verificar</button>
    </form>
    <ul class="auth-links">
      <li><a href="${protoAuthHref("mfa-recovery")}">No tengo acceso a mi autenticador</a></li>
      <li><a href="${protoAuthHref("trusted-device")}">¿Qué es un dispositivo de confianza?</a></li>
    </ul>`;
}

function protoRenderMfaRecovery(): string {
  return `
    <div class="auth-note" role="note">
      Usa uno de los códigos de recuperación entregados durante la inscripción.
      Cada código sirve una sola vez.
    </div>
    <form class="auth-form" data-auth-form novalidate>
      <div class="auth-field">
        <label class="form-label" for="recovery">Código de recuperación</label>
        <input class="form-input" type="text" id="recovery" name="recovery" autocomplete="off"
               placeholder="XXXX-XXXX" aria-describedby="recovery-help" required>
        <p class="form-hint" id="recovery-help">Formato XXXX-XXXX. Simulado: no se compara con ningún código real.</p>
      </div>
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Usar código</button>
    </form>
    <ul class="auth-links"><li><a href="${protoAuthHref("mfa-challenge")}">Volver al desafío</a></li></ul>`;
}

function protoRenderTrustedDevice(): string {
  const user = protoGetSessionUser();
  const policy = user ? protoPolicyOf(user) : protoFindAuthPolicy("pol-standard");
  return `
    <div class="auth-note" role="note">
      Recordar un dispositivo es <strong>opcional</strong> y lo habilita la política
      de la organización, no la preferencia individual.
    </div>
    <dl class="auth-dl">
      <dt>Política aplicada</dt><dd>${policy ? policy.label : "—"}</dd>
      <dt>Dispositivos de confianza</dt><dd>${policy?.allowTrustedDevice ? `Permitidos durante ${policy.trustedDeviceDays} días` : "No permitidos"}</dd>
      <dt>Operaciones con step-up</dt><dd>${policy ? policy.stepUpOperations.join(", ") : "—"}</dd>
    </dl>
    <div class="ws-actions">
      <a class="c-btn c-btn--secondary" href="${protoAuthHref("mfa-challenge")}">Volver al desafío</a>
    </div>`;
}

/* ---------------------------------------------------------------------------
 * AUTH-13 Seleccionar organización — TX-UX-MTAC-AMD-001 §5
 * ------------------------------------------------------------------------- */

/**
 * Se pide la ORGANIZACIÓN, nunca el rol. Los roles se muestran como
 * información —para que la persona reconozca dónde está entrando— pero no son
 * una elección: dentro de un BizCap el usuario ejerce todos los que tenga.
 */
function protoRenderSelectOrganization(): string {
  const user = protoGetSessionUser();
  if (!user) {
    return `<p class="ws-empty" role="status">Inicia sesión para continuar.</p>`;
  }

  const activas = protoActiveMembershipsOf(user.userId);

  if (!activas.length) {
    return `
      <div class="c-alert c-alert--warning" role="status">
        <p class="c-alert-message"><strong>No tienes acceso a ninguna organización.</strong></p>
      </div>
      <p>Tu identidad es válida, pero todavía no perteneces a ninguna organización activa en TransformX.</p>
      <p class="ws-muted ws-small">Pide a la administración de tu organización que te dé acceso. No se abre un Workspace vacío: no hay contexto en el que trabajar.</p>`;
  }

  const filas = activas
    .map((m) => {
      const t = protoFindTenant(m.tenantId);
      if (!t) return "";
      const acceso = protoEffectiveAccess(user.userId, m.tenantId);
      const nBizCaps = acceso.bizCapIds.length;

      const roles = acceso.rolesByBizCap
        .map((r) => {
          const chips = r.roles
            .map((rol) => `<span class="ws-role-chip">${protoEscape(PROTO_ROLE_LABEL[rol])}</span>`)
            .join("");
          return `<li class="ws-access__item"><span class="ws-access__bizcap">${protoEscape(r.bizCapId)}</span><span class="ws-role-list">${chips}</span></li>`;
        })
        .join("");

      return `
        <li class="ws-tenant-card">
          <div class="ws-tenant-card__head">
            <span class="ws-tenant-card__mark" aria-hidden="true">${protoEscape(t.initials)}</span>
            <div class="ws-tenant-card__id">
              <h2 class="ws-tenant-card__name" id="tn-${protoEscape(t.tenantId)}">${protoEscape(t.name)}</h2>
              <p class="ws-tenant-card__meta">${protoEscape(t.industry)} · ${String(nBizCaps)} BizCap${nBizCaps === 1 ? "" : "s"} disponible${nBizCaps === 1 ? "" : "s"}</p>
            </div>
          </div>
          ${nBizCaps
            ? `<ul class="ws-access">${roles}</ul>`
            : `<p class="ws-muted ws-small">Sin BizCaps asignadas todavía en esta organización.</p>`}
          <button type="button" class="c-btn c-btn--primary" data-tenant-enter="${protoEscape(m.tenantId)}"
                  aria-describedby="tn-${protoEscape(t.tenantId)}">Entrar</button>
        </li>`;
    })
    .join("");

  return `
    <p>Perteneces a más de una organización. Elige en cuál quieres trabajar.</p>
    <ul class="ws-tenant-cards">${filas}</ul>
    <p class="ws-muted ws-small">
      No se te pide elegir un rol: dentro de cada BizCap ejerces todas las
      funciones que tengas asignadas en esa organización.
    </p>`;
}

function protoWireSelectOrganization(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-tenant-enter]").forEach((b) => {
    b.addEventListener("click", () => {
      const tenantId = b.getAttribute("data-tenant-enter");
      if (!tenantId) return;

      if (!protoSetActiveTenant(tenantId)) {
        protoAuthFeedback(
          "Ese acceso ya no está disponible. Vuelve a iniciar sesión para actualizar tus organizaciones.",
          "error"
        );
        return;
      }
      // El contexto arranca limpio: nada de una sesión previa cruza al Tenant.
      protoClearTenantScopedState();
      protoAuthIrA(protoResolveRoute(protoResolveLanding()));
    });
  });
}

function protoRenderStepUp(): string {
  const op = protoAuthParam("operation") ?? "assignment.override";
  return `
    <div class="auth-note" role="alert">
      La operación <strong>${op}</strong> exige verificación adicional aunque tu
      sesión siga activa. Esto es step-up, no un reinicio de sesión.
    </div>
    <form class="auth-form" data-auth-form novalidate>
      ${protoRenderCampoOtp("Código de verificación")}
      <button type="submit" class="c-btn c-btn--primary" data-auth-submit>Confirmar identidad</button>
    </form>`;
}

/** Verificación OTP compartida por AUTH-08/09/10/12. */
function protoWireOtp(etiqueta: string, alAcertar: () => void): void {
  const form = document.querySelector<HTMLFormElement>("[data-auth-form]");
  const btn = document.querySelector<HTMLButtonElement>("[data-auth-submit]");
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const campo = form.querySelector<HTMLInputElement>("#otp") ?? form.querySelector<HTMLInputElement>("#recovery");
    if (!campo) return;

    const valor = campo.value.trim();
    const esOtp = campo.id === "otp";
    const formatoOk = esOtp ? /^\d{6}$/.test(valor) : valor.length >= 4;

    if (!formatoOk) {
      protoAuthMarcarCampo(campo, true);
      protoAuthFeedback(esOtp ? "El código debe tener seis dígitos." : "Introduce un código de recuperación válido.", "error");
      campo.focus();
      return;
    }

    protoAuthMarcarCampo(campo, false);
    protoAuthOcupado(btn, true, etiqueta);
    const fallo = esOtp && valor === "000000";
    await protoMockRequest({
      operationId: "auth.verifyFactor",
      outcome: fallo ? "permission_denied" : "success",
      latencyMs: 600,
    });
    protoAuthOcupado(btn, false, etiqueta);

    if (fallo) {
      protoAuthMarcarCampo(campo, true);
      protoAuthFeedback("El código no es válido o expiró. Solicita uno nuevo e inténtalo otra vez.", "error");
      campo.focus();
      return;
    }
    alAcertar();
  });
}

function protoAuthAgregarAccion(texto: string, href: string): void {
  const zona = document.querySelector<HTMLElement>("[data-auth-actions]");
  if (!zona) return;
  zona.innerHTML = `<a class="c-btn c-btn--primary" href="${href}">${texto}</a>`;
  zona.hidden = false;
}

/* ---------------------------------------------------------------------------
 * Registro de superficies
 * ------------------------------------------------------------------------- */

const PROTO_AUTH_SCREENS: Record<ProtoAuthScreenId, ProtoAuthScreen> = {
  "sign-in": {
    code: "AUTH-01", titulo: "Iniciar sesión",
    intro: "Acceso simulado al Workspace de TransformX.",
    render: protoRenderSignIn, wire: protoWireSignIn,
  },
  "forgot-password": {
    code: "AUTH-02", titulo: "Recuperar contraseña",
    intro: "Te enviamos instrucciones sin confirmar si el correo está registrado.",
    render: protoRenderForgot, wire: protoWireForgot,
  },
  "reset-password": {
    code: "AUTH-03", titulo: "Restablecer contraseña",
    intro: "Define una contraseña nueva para tu cuenta.",
    render: protoRenderReset,
    wire: () => protoWirePassword("Restablecer contraseña", () => protoAuthHref("sign-in")),
  },
  "change-password": {
    code: "AUTH-04", titulo: "Cambiar contraseña",
    intro: "Actualiza tu contraseña desde una sesión activa.",
    render: protoRenderChange,
    wire: () => protoWirePassword("Cambiar contraseña", () => protoAuthLanding()),
  },
  "account-locked": {
    code: "AUTH-05", titulo: "Cuenta bloqueada",
    intro: "El acceso está suspendido por política de seguridad.",
    render: protoRenderLocked, wire: protoWireLocked,
  },
  "sign-up": {
    code: "AUTH-06", titulo: "Solicitar acceso",
    intro: "El registro no crea una cuenta productiva.",
    render: protoRenderSignUp, wire: protoWireSignUp,
  },
  invitation: {
    code: "AUTH-07", titulo: "Primer acceso",
    intro: "Activa tu acceso a partir de una invitación.",
    render: protoRenderInvitation,
    wire: () => protoWirePassword("Activar acceso", () => protoAuthHref("mfa-enrollment")),
  },
  "mfa-enrollment": {
    code: "AUTH-08", titulo: "Inscribir segundo factor",
    intro: "Configura la verificación en dos pasos.",
    render: protoRenderMfaEnrollment,
    wire: () => protoWireOtp("Inscribir segundo factor", () => {
      protoMarkMfaSatisfied(false);
      protoAuthIrA(protoAuthLanding());
    }),
  },
  "mfa-challenge": {
    code: "AUTH-09", titulo: "Verificación en dos pasos",
    intro: "Confirma tu identidad para completar el acceso.",
    render: protoRenderMfaChallenge,
    wire: () => protoWireOtp("Verificar", () => {
      const trusted = document.querySelector<HTMLInputElement>("#trusted");
      protoMarkMfaSatisfied(trusted?.checked === true);
      protoAuthIrA(protoAuthLanding());
    }),
  },
  "mfa-recovery": {
    code: "AUTH-10", titulo: "Recuperar segundo factor",
    intro: "Accede con un código de recuperación.",
    render: protoRenderMfaRecovery,
    wire: () => protoWireOtp("Usar código", () => {
      protoMarkMfaSatisfied(false);
      protoAuthIrA(protoAuthLanding());
    }),
  },
  "trusted-device": {
    code: "AUTH-11", titulo: "Dispositivo de confianza",
    intro: "Opción dirigida por política de la organización.",
    render: protoRenderTrustedDevice, wire: () => { /* superficie informativa */ },
  },
  "select-organization": {
    code: "AUTH-13", titulo: "Selecciona tu organización",
    intro: "Tu identidad ya está verificada. Falta elegir en qué organización vas a trabajar.",
    render: protoRenderSelectOrganization, wire: protoWireSelectOrganization,
  },
  "step-up": {
    code: "AUTH-12", titulo: "Verificación adicional requerida",
    intro: "Una operación sensible exige confirmar tu identidad.",
    render: protoRenderStepUp,
    wire: () => protoWireOtp("Confirmar identidad", () => {
      protoMarkStepUpSatisfied();
      protoAuthIrA(protoAuthLanding());
    }),
  },
};

function protoInitAuth(): void {
  const host = document.querySelector<HTMLElement>("[data-auth-surface]");
  if (!host) return;

  const id = protoAuthScreenId();
  const screen = PROTO_AUTH_SCREENS[id];

  const titulo = document.querySelector<HTMLElement>("[data-auth-title]");
  const code = document.querySelector<HTMLElement>("[data-auth-code]");
  const intro = document.querySelector<HTMLElement>("[data-auth-intro]");
  if (titulo) titulo.textContent = screen.titulo;
  if (code) code.textContent = screen.code;
  if (intro) intro.textContent = screen.intro;
  document.title = `${screen.code} ${screen.titulo} — Workspace (prototipo)`;

  host.innerHTML = screen.render();
  screen.wire();

  // Índice de superficies, para recorrer AUTH-01…AUTH-12 en la validación.
  const indice = document.querySelector<HTMLElement>("[data-auth-index]");
  if (indice) {
    indice.innerHTML = (Object.keys(PROTO_AUTH_SCREENS) as ProtoAuthScreenId[])
      .map((k) => {
        const s = PROTO_AUTH_SCREENS[k];
        const actual = k === id;
        return `<li><a href="${protoAuthHref(k)}" ${actual ? 'aria-current="page"' : ""} class="${actual ? "is-current" : ""}">${s.code} ${s.titulo}</a></li>`;
      })
      .join("");
  }
}

document.addEventListener("DOMContentLoaded", protoInitAuth);
