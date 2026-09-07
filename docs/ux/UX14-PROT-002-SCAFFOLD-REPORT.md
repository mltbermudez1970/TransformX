# UX14-PROT-002 — Scaffold Report (PM-UX14-01)

**Artefacto objetivo:** `TX-UX-014-PROT-002 — Authenticated Workspace Validation Prototype`
**Alcance de este prompt:** preparación estructural. **No** se construyeron My Work,
Lead Detail, workflows ni el shell autenticado (PM-UX14-03 en adelante).
**Rama:** `feature/ux14-workspace-prototype`

---

## A. Auditoría previa (estado inicial)

| Aspecto | Hallazgo |
|---------|----------|
| Repositorio | Limpio en `main`, sin cambios pendientes |
| Build inicial | `npm run build` (`tsc`) → **PASS**, exit 0 |
| Toolchain | TypeScript 7.x como única dependencia; `tsc` con `rootDir: ./ts`, `outDir: ./js`, `strict`, `noUncheckedIndexedAccess` |
| Módulos | Los `.ts` **no** son módulos ES: se compilan a scripts globales cargados con `<script defer>` |
| Páginas públicas | 9 comerciales + `playground.html` + 2 prototipos noindex (`acceso.html`, `adopcion.html`) |
| CSS | Entry único `css/styles.css` con `@import` de 15 módulos; cascada explícita |
| Tokens | 200+ custom properties en `variables.css` (color, tipografía, espaciado 8px, radios, sombras, transiciones) |
| Átomos existentes | `.btn`/`.btn--primary\|secondary\|ghost\|outline-light\|sm\|lg`, `.c-btn*`, `.toast`/`.c-toast*`, `.c-alert*`, `.c-dialog*`, `.c-menu*`, `.c-check`/`.c-radio`, `.card*`, `.badge`, `.form-*` |
| Theme | `data-theme` en `<html>`, boot inline anti-FOUC + `js/theme.js`, `[data-theme-toggle]` |
| Deployment | Cloudflare Pages desde `main`; dominio canónico `transformx.app` |
| **UX-10…UX-14** | **No presentes en el repositorio** — ver OD-01 |

No se movió ningún archivo público: no hubo necesidad demostrada.

---

## B. Archivos creados

### Capa de simulación (`prototype/`)

| Archivo | Rol |
|---------|-----|
| `prototype/README.md` | Contrato de la capa: qué contiene y qué no, frontera prototipo ≠ producción |
| `prototype/fixtures/fixtures.ts` | Datos sintéticos: 1 organización, 2 actores, 6 leads, 6 fixture sets |
| `prototype/scenarios/scenarios.ts` | Catálogo determinístico S-01…S-10 |
| `prototype/mock-api/mock-api.ts` | Simulación de forma y latencia de respuesta; 6 desenlaces + fase `loading` |
| `prototype/state/prototype-mode.ts` | Detección del modo prototipo y revelado de accesos ocultos |
| `prototype/state/prototype-state.ts` | Coordinación escenario / fixture / navegación |

### Superficies reservadas (`workspace/`)

`workspace/index.html` (entrada del scaffold, noindex), `workspace/workspace-index.ts`
y un `README.md` por superficie en: `my-work/`, `leads/`, `missing-information/`,
`qualification/`, `reviews/`, `assignment/`, `opportunity/`, `communications/`,
`auth/`, `system/`, `dashboard/`.

Cada README declara escenario asociado, prompt que la construye y fuente de verdad.
Se usan READMEs porque Git no versiona carpetas vacías; no se creó ninguna carpeta
fuera del scaffold aprobado.

### Documentación y toolchain

`docs/ux/README.md`, `docs/ux/UX14-PROT-002-SCAFFOLD-REPORT.md` (este archivo),
`tsconfig.prototype.json`, `css/workspace.css`.

---

## C. Archivos modificados

| Archivo | Cambio | Riesgo |
|---------|--------|--------|
| `package.json` | `build` = `tsc && tsc -p tsconfig.prototype.json`; se agregan `build:site` y `build:prototype` | Ninguno: `build` sigue compilando el sitio primero |
| `acceso.html` | +1 `<script defer>` de modo prototipo, +1 acceso `[data-prototype-entry] hidden` | Página noindex; el acceso permanece oculto fuera de modo prototipo |
| `adopcion.html` | Idem | Idem |
| `robots.txt` | `Disallow: /workspace/` y `Disallow: /prototype/` | Ninguno: no afecta rutas públicas ya indexadas |

**Archivos movidos: ninguno.**
**Páginas comerciales modificadas: ninguna** (`index`, `bizcaps`, `bizcap-lead-intake-qualification`, `precios`, `empresa`, `contacto`, `privacidad`, `terminos`, `playground` intactas).

---

## D. Decisiones de arquitectura tomadas

1. **Salida compilada centralizada en `js/`.** El segundo proyecto TypeScript
   (`tsconfig.prototype.json`) emite a `js/prototype/**` y `js/workspace/**`, con lo
   que se preserva la regla del repo "`js/` es generado, nunca se edita a mano".
2. **Datos como constantes TS, no JSON + `fetch`.** El prototipo debe abrirse
   directamente desde el sistema de archivos, donde `fetch` de JSON local falla.
3. **Prefijo `PROTO_` / `proto*`** en todo símbolo global de la capa de prototipo.
   Verificado: **0 colisiones** con los globales del sitio (`theme.js`,
   `animaciones.js`, `validators.js`).
4. **`css/workspace.css` enlazado sólo en páginas del workspace**, después de
   `css/styles.css`. Desviación deliberada del "entry único": mantiene la capa de
   prototipo fuera del bundle público. El shell definitivo llega en PM-UX14-03.
5. **`loading` es una fase (`ProtoPhase`), no un desenlace terminal**; se notifica
   por `onPhaseChange`. Los 6 desenlaces terminales son `success`,
   `validation_error`, `business_conflict`, `stale`, `permission_denied`,
   `recoverable_error`.
6. **Desenlaces determinísticos**: los fija el escenario activo, nunca el azar.
7. **Idioma**: UI del workspace en español, con términos de dominio en inglés como
   nombres propios (BizCap, Lead Intake & Qualification, My Work), igual que el
   sitio público. Consistente con la regla "sitio 100 % español" de `CLAUDE.md`.
8. **Modo prototipo explícito**: `?prototype=true`, cualquier ruta bajo
   `/workspace/`, o flag en `sessionStorage`. Fuera de ese modo los accesos
   `[data-prototype-entry]` permanecen `hidden` y el flujo público no cambia.

---

## E. Ruta de entrada

```
index.html (landing)
  └─ adopcion.html — Start Adoption              [público, noindex, CTAs intactos]
       └─ [modo prototipo] → workspace/index.html
            └─ workspace/auth/ — login + MFA simulados   ← PM-UX14-03
                 └─ workspace/… — superficies operativas ← PM-UX14-04/05/06
```

`acceso.html` expone el mismo acceso condicional. Ningún CTA existente fue
redirigido, eliminado ni reetiquetado.

---

## F. Validación ejecutada

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| Build completo | `npm run build` | **PASS** (ambos proyectos) |
| Typecheck sitio | `npx tsc --noEmit` | **PASS**, 0 errores |
| Typecheck prototipo | `npx tsc -p tsconfig.prototype.json --noEmit` | **PASS**, 0 errores |
| Forma del output | `grep 'export {}' js/prototype js/workspace` | Sin `export {}` — scripts globales, como el resto del repo |
| Colisión de globales | Comparación de símbolos top-level | **0 colisiones** |
| Integridad de enlaces | Resolución de todo `href`/`src` relativo en los 12 HTML | **0 enlaces rotos** |
| Fuga de mocks al flujo público | Búsqueda de `prototype`/`PROTO_`/`workspace/` en páginas comerciales | **0 fugas** (sólo coincide la clase CSS preexistente `.prototype-notice`) |
| Diff de HTML vs `main` | `git diff --stat main -- '*.html'` | Sólo `acceso.html` y `adopcion.html` (+6 líneas cada uno) |

**Backend productivo introducido: 0.** Sin PostgreSQL, IdP, MFA real, event bus,
outbox, multi-tenancy, AI runtime ni integraciones reales.

---

## G. Riesgos registrados

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R-01 | Dos proyectos `tsc` emiten a `js/`; ejecutar sólo `tsc` deja el prototipo desactualizado | `npm run build` los encadena; `build:site` y `build:prototype` quedan explícitos |
| R-02 | Scripts globales sin módulos ES → colisión de nombres al crecer el prototipo | Prefijo `PROTO_`/`proto*` obligatorio + verificación de colisiones en cada prompt |
| R-03 | `workspace/` se sirve desde el mismo origen público: `noindex` + `robots.txt` **no son control de acceso** | Documentado; el hosting definitivo del workspace es OD-03 / DC-20 |
| R-04 | `js/` mezcla salida del sitio y del prototipo | Separación por subcarpeta (`js/prototype/`, `js/workspace/`) y documentada en `prototype/README.md` |
| R-05 | Riesgo de que fixtures sintéticos se lean como datos reales en una demo | Banner "Prototipo" permanente, correos con TLD reservado `.test`, nombres genéricos |
| R-06 | `favicon.ico` de 4 MB (preexistente, no tocado) | Ya registrado en `PLAN.md` |

---

## H. OPEN DECISIONS

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador de resolución |
|----|------------------|---------------------|-----------------|--------------------------|
| **OD-01** | **UX-10, UX-11, UX-12, UX-13 y UX-14 no están en este repositorio** y no hay referencia a su ubicación autoritativa | El prototipo consume reglas de dominio como **dato de escenario**, nunca como lógica de cliente | Reglas BDR, state machine, criterios de Qualification, Opportunity Readiness ni `availableActions` inventados | Incorporar los documentos UX al repo (`docs/ux/`) o referenciar su fuente antes de PM-UX14-04 |
| **OD-02** | Catálogo definitivo de roles y permisos del workspace | Dos actores sintéticos con `roleId: "role-tbd-*"` y etiqueta explícita de pendiente | Nombres de rol, jerarquía ni matriz de permisos | UX-12/UX-14 |
| **OD-03** | Hosting/ruta definitiva del workspace autenticado | Subcarpeta `/workspace/` del mismo origen, sólo para validación | Subdominio o dominio definitivo | Infra + DNS (ligado a **DC-20** en `PLAN.md`) |
| **OD-04** | Si `communications/` y `dashboard/` son superficies con escenario propio | Hoy cubiertas dentro de S-09 y S-01 respectivamente | Que tengan escenario, fixtures o rutas propias | UX-14, antes de PM-UX14-06 |
| **OD-05** | Si `/workspace/` se publica en producción o sólo en previews de Cloudflare Pages | Publicado con `noindex` + `Disallow`, sin control de acceso | Que el prototipo esté protegido en producción | Decisión de deployment antes de exponer PROT-002 a validadores |
| **OD-06** | Consecuencia de `expectedAvailableActions` vacío para los guiones de prueba | Los diez escenarios llevan `specStatus: "PENDING_SOURCE"` | Que los escenarios estén listos para validación end-to-end | Resolver OD-01 |

---

## I. Acceptance Gate PM-UX14-01

| Criterio | Estado |
|----------|--------|
| Landing intacta | ✅ 0 páginas comerciales modificadas |
| `workspace/` y `prototype/` creados | ✅ |
| Mocks / fixtures / scenarios separados | ✅ 4 carpetas con responsabilidad única |
| Prototype mode identificable | ✅ `?prototype=true`, `/workspace/`, `data-prototype` en `<html>`, banner visible |
| Build PASS | ✅ ambos proyectos, 0 errores |
| Scaffold Report generado | ✅ este documento |
| 0 backend productivo introducido | ✅ |

**Estado: COMPLETADO. Detenido antes de PM-UX14-02.**
