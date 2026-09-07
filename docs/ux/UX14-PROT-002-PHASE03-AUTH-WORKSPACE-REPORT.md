# TX-UX-014-PROT-002 — Fase 03: App Shell autenticado + Auth/MFA (PM-UX14-03)

**Artefacto:** `TX-UX-014-PROT-002 — Authenticated Workspace Validation Prototype`
**Rama:** `feature/ux14-workspace-prototype`
**Condición de parada alcanzada:** recorrido Landing → Start Adoption → Sign In → MFA → Workspace demostrado en navegador real.

---

## 1. Resumen

Se construyó el foundation del Workspace autenticado: App Shell con navegación
jerárquica, breadcrumbs y guarda de sesión; las **12 superficies de identidad**
AUTH-01…AUTH-12; las **4 superficies de sistema** SYS-01…SYS-04; y el acceso
contextual a Capio con sus fronteras explícitas.

Todo es simulación: **no hay credenciales, IdP, OAuth, proveedor MFA, sesión de
servidor ni backend**. Ninguna contraseña, OTP o código de recuperación se
compara con nada — el desenlace lo fija el perfil sintético.

**Supuesto registrado (OD-09 sin resolver):** se construyó sobre la familia de
componentes `.btn*`, la que usa PROT-001, por continuidad con la baseline. Si la
decisión final es migrar a `.c-*`, el cambio afecta a las superficies de esta
fase y debe hacerse antes de PM-UX14-04.

---

## 2. Rutas

### 2.1 Workspace (todas `noindex` + `Disallow: /workspace/`)

| routeId | Ruta | Superficie | Requiere sesión | Contenido operativo |
|---------|------|-----------|-----------------|---------------------|
| `home` | `workspace/` | Home + selector de escenarios | Sí | **PM-UX14-03** |
| `my-work` | `workspace/my-work/` | My Work | Sí | PM-UX14-04 |
| `bizcaps` | `workspace/bizcaps/` | BizCaps adoptadas | Sí | **PM-UX14-03** |
| `lab-001` | `workspace/bizcaps/lab-001/` | LAB-001 Overview | Sí | **PM-UX14-03** |
| `lab-001-leads` | `workspace/leads/` | Leads | Sí | PM-UX14-04 |
| `lab-001-queue` | `workspace/work-queue/` | Work Queue | Sí | PM-UX14-04 |
| `lab-001-reviews` | `workspace/reviews/` | Reviews | Sí | PM-UX14-05 |
| `lab-001-dashboard` | `workspace/dashboard/` | Dashboard | Sí | PM-UX14-04 |
| `lab-001-config` | `workspace/configuration/` | Configuration | Sí | PM-UX14-06 |
| `capio` | `workspace/capio/` | Capio contextual | Sí | **PM-UX14-03** |
| `administration` | `workspace/administration/` | Administration | Sí | PM-UX14-06 |
| `auth` | `workspace/auth/?screen=…` | AUTH-01…AUTH-12 | No | **PM-UX14-03** |
| `system` | `workspace/system/?state=…` | SYS-01…SYS-04 | No | **PM-UX14-03** |

Carpetas **nuevas** respecto del scaffold aprobado en PM-UX14-01, exigidas por el
App Shell de la sección A: `bizcaps/`, `bizcaps/lab-001/`, `work-queue/`,
`configuration/`, `capio/`, `administration/`. Las carpetas del scaffold
`missing-information/`, `qualification/`, `assignment/`, `opportunity/` y
`communications/` **no** están en la navegación global: son workspaces
especializados a los que se llega desde Lead Detail en PM-UX14-04/05/06.

### 2.2 Superficies de identidad

`workspace/auth/?screen=<id>` — un host, doce superficies:

| Código | `screen` | Qué representa |
|--------|----------|----------------|
| AUTH-01 | `sign-in` | Credenciales → ramifica según perfil |
| AUTH-02 | `forgot-password` | Recuperación **sin revelar existencia de cuenta** |
| AUTH-03 | `reset-password` | Definir contraseña nueva |
| AUTH-04 | `change-password` | Cambio desde sesión activa |
| AUTH-05 | `account-locked` | Bloqueo + solicitud de desbloqueo |
| AUTH-06 | `sign-up` | Solicitud de acceso (no crea cuenta) |
| AUTH-07 | `invitation` | Primer acceso por invitación |
| AUTH-08 | `mfa-enrollment` | Inscripción de segundo factor |
| AUTH-09 | `mfa-challenge` | Desafío MFA + dispositivo de confianza |
| AUTH-10 | `mfa-recovery` | Código de recuperación |
| AUTH-11 | `trusted-device` | Opción **dirigida por política**, no por preferencia |
| AUTH-12 | `step-up` | Verificación adicional con sesión activa |

`?outcome=<desenlace>` fuerza cualquier desenlace desde la URL o el escenario.

### 2.3 Superficies de sistema

`workspace/system/?state=<id>` — SYS-01 `permission-denied`, SYS-02 `not-found`,
SYS-03 `session-expired`, SYS-04 `recoverable-error`. Ninguna es un callejón sin
salida: todas ofrecen al menos una acción de retorno a contexto válido.

---

## 3. Fixtures y estados simulados

### 3.1 Perfiles sintéticos — `prototype/fixtures/auth-fixtures.ts`

| Correo | Estado | Qué demuestra |
|--------|--------|---------------|
| `ana.ruiz@demo.test` | activa, MFA inscrito | Camino feliz: credenciales → AUTH-09 → Workspace |
| `bruno.salas@demo.test` | activa, sin MFA | Política estricta exige inscripción → AUTH-08 |
| `carla.bloqueada@demo.test` | bloqueada | AUTH-05 con ruta de desbloqueo |
| `diego.invitado@demo.test` | invitada | AUTH-07 primer acceso |
| *(cualquier otro)* | — | `auth_failure` genérico, sin revelar existencia |

**No se almacena ninguna contraseña, hash ni secreto.** Cualquier contraseña no
vacía es aceptada porque no se verifica nada. La clave de inscripción MFA es la
cadena literal `DEMO-ONLY-NO-ES-UN-SECRETO-REAL`.

### 3.2 Políticas

`pol-standard` (MFA obligatorio, dispositivo de confianza 30 días, sesión 30 min)
y `pol-strict` (MFA obligatorio, sin dispositivo de confianza, sesión 15 min,
más operaciones con step-up).

### 3.3 Desenlaces soportados

`success` · `auth_failure` · `locked` · `recovery` · `mfa_required` ·
`step_up_required` · `session_expired` — todos determinísticos.

---

## 4. Componentes reutilizables vs código exclusivo de prototipo

### 4.1 Reutilizable (sistema de diseño existente)

`.btn*`, `.form-input`, `.form-label`, `.form-hint`, `.btn-group`, `.skip-link`,
`.sr-only`, y **todos** los tokens de `variables.css` — incluidos `--surface-card`
y `--accent-text`, introducidos durante el QA de PROT-001. Cero valores
hardcodeados nuevos.

### 4.2 Exclusivo de prototipo (desechable, no es dominio)

| Archivo | Rol |
|---------|-----|
| `workspace/shell/routes.ts` | Registro de rutas, navegación y breadcrumbs |
| `workspace/shell/shell.ts` | Render del chrome + guarda de sesión |
| `workspace/auth/auth.ts` | AUTH-01…AUTH-12 |
| `workspace/system/system.ts` | SYS-01…SYS-04 |
| `workspace/capio/capio-workspace.ts` | Capio contextual determinístico |
| `workspace/workspace-index.ts` | Home + selector de escenarios |
| `prototype/fixtures/auth-fixtures.ts` | Perfiles y políticas sintéticos |
| `prototype/state/session.ts` | Sesión simulada, return-to-context, guarda de secretos |
| `css/workspace.css` | Estilos del shell (fuera del bundle público) |

**Desviación deliberada de la convención del repositorio:** el chrome del
workspace se **renderiza por JS**, no se copia literalmente en cada HTML como en
las páginas comerciales. Motivo: son 13 superficies de simulación desechable, y
una corrección debe aplicarse a todas a la vez. Consecuencia asumida: las páginas
del workspace requieren JS. No aplica al sitio público.

---

## 5. Fronteras de confianza

### 5.1 Público ↔ autenticado

**Visualmente:** banner permanente "Prototipo · Workspace autenticado simulado",
cabecera navy con marca, barra lateral persistente y menú de cuenta — chrome
distinto del header comercial.
**Semánticamente:** `role="note"` con `aria-label="Frontera de confianza del
prototipo"`, `<header aria-label="Cabecera del workspace">`,
`<nav aria-label="Navegación del workspace">` frente a "Navegación principal" del
sitio público, y un enlace explícito "Salir al sitio público".

### 5.2 Capio no es autoridad de flujo

Ante intención operativa (aprobar, asignar, calificar, convertir, eliminar…)
Capio **declina** y remite a la superficie con autoridad. No aprueba, no asigna,
no califica, no convierte. Verificado automáticamente.

### 5.3 Capio nunca recibe secretos

Doble barrera:
1. **Estructural** — el shell no monta el acceso a Capio en rutas con
   `requiresAuth: false`, es decir, en ninguna superficie de identidad.
2. **Explícita** — `protoContieneSecreto()` detecta contraseñas, OTP y códigos de
   recuperación; esa entrada no se procesa **ni se refleja en el hilo**. Verificado.

### 5.4 Sin enumeración de cuentas

AUTH-02 devuelve un mensaje **idéntico** exista o no el correo. Verificado
comparando la respuesta para una cuenta real y una inexistente. AUTH-01 usa un
fallo genérico que no distingue "usuario no existe" de "contraseña incorrecta".

---

## 6. Return-to-context

Al intentar abrir una ruta protegida sin sesión, la guarda redirige a AUTH-01 con
`returnTo=<ruta original>`; el parámetro sobrevive el salto a AUTH-09 y, tras el
segundo factor, el usuario aterriza **en la ruta que pedía**, no en el Home.
`protoGetReturnTo()` sólo acepta rutas internas que empiecen por `workspace/` y
rechaza `..` y `//`, para que el parámetro no sirva de redirección abierta.
Verificado end-to-end con `workspace/reviews/`.

---

## 7. Notas de accesibilidad

- **Skip link** primero en el DOM en las 13 superficies, visible al recibir foco.
- **Landmarks**: un `<main id="main-content">` por página, `<header>`, `<nav>`
  etiquetadas y `<nav aria-label="Ruta de navegación">` para breadcrumbs.
- **Un solo `h1`** por superficie; verificado en las 13.
- **`aria-current="page"`** en exactamente un elemento de navegación y en el
  último breadcrumb.
- **Menú de cuenta**: `aria-expanded` + `aria-controls`, abre con Enter, foco al
  primer elemento, Escape cierra y **devuelve el foco** al disparador, cierre por
  clic fuera.
- **Drawer de navegación** (móvil): mismo contrato de teclado y foco.
- **Formularios**: `aria-invalid` en error, `aria-describedby` para las ayudas,
  y una región `role="alert" aria-live="assertive"` para el feedback.
- **Capio**: hilo con `aria-live="polite"`.
- **Estados de sistema**: `role="alert"` para lo que interrumpe, `role="status"`
  para lo informativo.
- **Objetivos táctiles** ≥24px (WCAG 2.5.8) y ≥44px en los controles del chrome.
- **Contraste AA** verificado en claro y oscuro en las 13 superficies.

---

## 8. Validación ejecutada (navegador real, Chrome headless vía CDP)

| Suite | Verificaciones | Resultado |
|-------|----------------|-----------|
| Aceptación PM-UX14-03 | 41 | **PASS** — 0 fallos |
| Recorrido E2E Landing → … → Workspace | 6 pasos | **PASS** |
| Workspace: reflow (6 viewports × 13), contraste (2 temas × 13), ARIA, touch, errores JS | 117 | **PASS** — 0 fallos |
| Regresión PROT-001: teclado | 49 | **PASS** |
| Regresión PROT-001: contraste | 22 | **PASS** — 0 combinaciones bajo el mínimo |
| Regresión PROT-001: responsive (7 viewports × 11) | 77 | **PASS** |
| `npm run build` + integridad de enlaces | — | **PASS**, 0 rotos |
| Fuga de código de prototipo al sitio público | 8 páginas comerciales | **0 fugas** |

### Defectos propios encontrados y corregidos durante la fase

| # | Defecto | Causa | Corrección |
|---|---------|-------|-----------|
| 1 | Capio lanzaba `ReferenceError` y no respondía | `protoContieneSecreto()` vivía en `auth.ts`, que **sólo carga la página de identidad**. TypeScript no lo detecta: ambos archivos comparten scope global en el mismo proyecto, pero cada página carga un subconjunto distinto de scripts | La guarda se movió a `prototype/state/session.ts`, que cargan todas las páginas. Se añadió captura de errores JS no atrapados a la suite para detectar esta clase de fallo |
| 2 | Desbordamiento horizontal en ≥1024px | `min-width: auto` del ítem de grid dejaba que la tabla de escenarios estirase la columna | `min-width: 0` en `.ws-main` |
| 3 | Desbordamiento horizontal en 320–375px | Mismo problema en la cabecera flex: marca y menú de cuenta no podían encogerse | `min-width: 0` + elipsis en marca y nombre; el acceso a Capio pasa a la navegación bajo 640px |
| 4 | `.ws-nav__phase` a 4.34 en oscuro | Usaba `--text-muted` | Pasa a `--text-secondary` |
| 5 | `.ws-banner__exit` de 18px de alto | Sin altura mínima | `min-height: 24px` |

---

## 9. Acceptance Gate PM-UX14-03

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| App Shell autenticado navegable | ✅ | 11 entradas de navegación, breadcrumbs y shell íntegro en las 13 superficies |
| Flujos Auth/MFA representativos e interactivos | ✅ | AUTH-01…AUTH-12 renderizan y operan; ramificación por perfil verificada |
| Return-to-context demostrado | ✅ | `workspace/reviews/` restaurado tras credenciales + MFA |
| Sin secretos reales | ✅ | Cero contraseñas/hashes/secretos almacenados; clave de inscripción literalmente ficticia |
| Sin backend de autenticación productivo | ✅ | Sin IdP, OAuth, proveedor MFA ni sesión de servidor; sólo `sessionStorage` |
| Keyboard/focus smoke test | ✅ | Skip link, menú de cuenta y drawer: Enter, Escape y retorno de foco |
| Build PASS | ✅ | exit 0, ambos proyectos TypeScript |

---

## 10. OPEN DECISIONS

Nuevas en esta fase:

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador |
|----|------------------|---------------------|-----------------|------------|
| **OD-10** | Estructura definitiva de navegación del workspace | Árbol de la sección A del prompt maestro, con LAB-001 anidado bajo BIZCAPS | Que Work Queue, Configuration y Administration tengan ese alcance y ubicación | UX-10.6 / UX-11 |
| **OD-11** | Duración de sesión, caducidad e inactividad | 30 min (estándar) y 15 min (estricta), inventados como valores de demostración | Que sean políticas reales | Seguridad + plataforma |
| **OD-12** | Catálogo real de operaciones que exigen step-up | Dos ejemplos sintéticos (`assignment.override`, `opportunity.convert`) | Que esa sea la lista definitiva | UX-12 + diseño de permisos |
| **OD-13** | Métodos MFA soportados en producción | TOTP representado; SMS declarado en el tipo pero no construido | Que TOTP sea el único método, ni que SMS esté soportado | Decisión de plataforma (ligada a DC-19) |
| **OD-14** | Si el workspace puede exigir JavaScript | El shell se renderiza por JS; sin JS no hay chrome | Que esto sea aceptable en producción | Decisión de arquitectura antes de cualquier build productivo |

Siguen abiertas **OD-01…OD-09**. En particular:

- **OD-01 es bloqueante para PM-UX14-04.** UX-10.1/10.2/10.3, UX-11, UX-12 y
  UX-13 no están en el repositorio. Esta fase pudo avanzar porque el App Shell y
  los flujos de identidad son estructurales y estaban descritos en el propio
  prompt maestro. **PM-UX14-04 no puede: My Work, Lead Detail, Missing
  Information y Qualification dependen de `availableActions`, reglas BDR, state
  machine y criterios QD-01…QD-05, que no se pueden inventar.**
- **OD-09 sigue sin resolver** y ya afecta a código escrito (ver §1).

---

**Estado: COMPLETADO. Detenido antes de PM-UX14-04.**
