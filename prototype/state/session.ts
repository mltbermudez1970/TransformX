/**
 * Sesión simulada del prototipo autenticado.
 *
 * NO es autenticación. Es un objeto en `sessionStorage` que representa el
 * *estado de UX* posterior a un inicio de sesión simulado: quién dice ser el
 * actor, si el segundo factor está satisfecho, cuándo "caduca" y a qué destino
 * hay que devolver al usuario (return-to-context).
 *
 * No hay token, cookie, backend, ni verificación de nada.
 */

interface ProtoSession {
  userId: string;
  /** Segundo factor satisfecho en esta sesión. */
  mfaSatisfied: boolean;
  /** AUTH-11: el dispositivo quedó marcado como de confianza por política. */
  trustedDevice: boolean;
  /** Marca de tiempo (ms) de caducidad simulada. */
  expiresAt: number;
  /** Momento del último step-up satisfecho (AUTH-12). */
  lastStepUpAt: number | null;
  startedAt: number;
}

const PROTO_SESSION_KEY = "transformx-prototype-session";
const PROTO_RETURN_PARAM = "returnTo";

/**
 * Guarda de secretos. Vive aquí —y no en `auth.ts`— porque la consume también
 * Capio, y `auth.js` sólo se carga en las superficies de identidad: un global
 * compartido entre páginas debe residir en un archivo que todas carguen.
 *
 * Devuelve true cuando el texto parece una contraseña, un OTP, un código de
 * recuperación o un secreto de autenticador. Ese contenido no debe llegar a
 * Capio ni quedar registrado en ningún hilo.
 */
function protoContieneSecreto(texto: string): boolean {
  const t = texto.trim();
  if (t.length === 0) return false;
  if (/^\d{4,10}$/.test(t)) return true; // OTP
  if (/[A-Z0-9]{4}-[A-Z0-9]{4}/i.test(t)) return true; // código de recuperación
  if (/contrase|password|otp|c[oó]digo|secret/i.test(t)) return true;
  return false;
}

/** Ruta por defecto tras autenticarse cuando no hay contexto que restaurar. */
const PROTO_DEFAULT_LANDING = "workspace/";

function protoReadSession(): ProtoSession | null {
  try {
    const raw = sessionStorage.getItem(PROTO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProtoSession>;
    if (typeof parsed.userId !== "string" || typeof parsed.expiresAt !== "number") return null;
    return {
      userId: parsed.userId,
      mfaSatisfied: parsed.mfaSatisfied === true,
      trustedDevice: parsed.trustedDevice === true,
      expiresAt: parsed.expiresAt,
      lastStepUpAt: typeof parsed.lastStepUpAt === "number" ? parsed.lastStepUpAt : null,
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function protoWriteSession(session: ProtoSession): void {
  try {
    sessionStorage.setItem(PROTO_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* sessionStorage no disponible */
  }
}

function protoClearSession(): void {
  try {
    sessionStorage.removeItem(PROTO_SESSION_KEY);
  } catch {
    /* sessionStorage no disponible */
  }
}

/**
 * Sesión vigente, o null si no existe, caducó o apunta a un usuario que no
 * existe en los fixtures. Sin esta última comprobación una sesión corrupta
 * superaba la guarda pero dejaba el shell sin actor: entrada permitida y
 * pantalla vacía.
 */
function protoGetSession(): ProtoSession | null {
  const s = protoReadSession();
  if (!s) return null;
  if (Date.now() > s.expiresAt) return null;
  if (!PROTO_AUTH_USERS.some((u) => u.userId === s.userId)) return null;
  return s;
}

/** True cuando hay una sesión guardada pero su ventana ya venció. */
function protoSessionExpired(): boolean {
  const s = protoReadSession();
  return s !== null && Date.now() > s.expiresAt;
}

function protoGetSessionUser(): ProtoAuthUser | null {
  const s = protoGetSession();
  if (!s) return null;
  return PROTO_AUTH_USERS.find((u) => u.userId === s.userId) ?? null;
}

/** Crea la sesión simulada tras un inicio de sesión aceptado. */
function protoStartSession(user: ProtoAuthUser, mfaSatisfied: boolean, trustedDevice: boolean): ProtoSession {
  const policy = protoPolicyOf(user);
  const minutos = policy ? policy.sessionMinutes : 30;
  const session: ProtoSession = {
    userId: user.userId,
    mfaSatisfied,
    trustedDevice,
    expiresAt: Date.now() + minutos * 60_000,
    lastStepUpAt: null,
    startedAt: Date.now(),
  };
  protoWriteSession(session);
  return session;
}

function protoMarkMfaSatisfied(trustedDevice: boolean): void {
  const s = protoGetSession();
  if (!s) return;
  s.mfaSatisfied = true;
  s.trustedDevice = trustedDevice;
  protoWriteSession(s);
}

function protoMarkStepUpSatisfied(): void {
  const s = protoGetSession();
  if (!s) return;
  s.lastStepUpAt = Date.now();
  protoWriteSession(s);
}

/** Fuerza la caducidad, para poder demostrar SYS session_expired. */
function protoExpireSessionNow(): void {
  const s = protoReadSession();
  if (!s) return;
  s.expiresAt = Date.now() - 1000;
  protoWriteSession(s);
}

/** La sesión existe y el segundo factor está satisfecho. */
function protoIsAuthenticated(): boolean {
  const s = protoGetSession();
  return s !== null && s.mfaSatisfied;
}

/* ---------------------------------------------------------------------------
 * Return-to-context
 * ------------------------------------------------------------------------- */

/** Ruta (relativa a la raíz del sitio) que el usuario intentaba abrir. */
function protoCurrentRelativeRoute(): string {
  const marker = "/workspace/";
  const i = location.pathname.indexOf(marker);
  if (i === -1) return PROTO_DEFAULT_LANDING;
  return `workspace/${location.pathname.slice(i + marker.length)}${location.search}`;
}

function protoGetReturnTo(): string | null {
  const raw = new URLSearchParams(location.search).get(PROTO_RETURN_PARAM);
  if (!raw) return null;
  // Sólo rutas internas del prototipo: nunca un destino externo.
  const limpio = decodeURIComponent(raw);
  if (!limpio.startsWith("workspace/") || limpio.includes("//") || limpio.includes("..")) return null;
  return limpio;
}

/** Destino tras autenticar: el contexto original si es válido, o el Home. */
function protoResolveLanding(): string {
  return protoGetReturnTo() ?? PROTO_DEFAULT_LANDING;
}
