# TX-UX-014-PROT-001 — Public Experience Consolidation Report (PM-UX14-02)

**Artefacto:** `TX-UX-014-PROT-001 — Public Experience Validation Prototype`
**Rama:** `feature/ux14-workspace-prototype`
**Enfoque:** consolidación sobre la baseline aprobada. **No hubo rediseño**: no se
cambió paleta, tipografía, layout, ni se agregaron componentes nuevos.
**Mapa de rutas:** [UX14-PROT-001-ROUTE-MAP.md](UX14-PROT-001-ROUTE-MAP.md)

---

## 1. Resumen ejecutivo

La experiencia pública ya cumplía la mayoría de las reglas de consolidación
(boundary de Capio, BizCaps Planned, pricing con los cuatro componentes y
disclaimers, contenido ilustrativo marcado). El hallazgo material fue de
**navegación**, no de contenido:

> **Sev-2 — 5 de las 11 superficies públicas no tenían navegación alguna por
> debajo de 1024 px.** `.nav` está oculta con `display: none` bajo ese breakpoint y
> esas páginas carecían del `<dialog id="mobile-menu">`. Peor aún,
> `bizcap-lead-intake-qualification.html` tenía el botón de menú apuntando con
> `aria-controls="mobile-menu"` a un elemento inexistente: botón muerto y
> referencia ARIA rota.

Superficies afectadas: `bizcap-lead-intake-qualification.html`, `privacidad.html`,
`terminos.html`, `acceso.html`, `adopcion.html`. Con eso, PROT-001 **no era
navegable end-to-end en móvil ni en tablet**, que es exactamente el criterio del gate.

Corregido. Hoy las 10 superficies del journey comparten el mismo chrome.

---

## 2. Clasificación por superficie

### 2.1 Landing / Public Discovery — `index.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Estructura hero → prueba social → problema/solución → BizCaps → Capio → cómo funciona → outcomes → CTA final. KPIs del dashboard sin cifras inventadas (flechas ↑/↓) y rotulados "(ilustrativo)" / "Indicadores ilustrativos". Testimonios firmados como "Escenario ilustrativo". |
| **FIX** | CTA `Iniciar sesión` se degradaba a `Entrar` bajo 640 px (ver §3.2). |
| **FIX** | La grilla de BizCaps mezclaba Disponible y Planned sin disclaimer (el catálogo sí lo tenía). Agregado el mismo disclaimer. |
| **REFINE** | Subtítulo "Capacidades empresariales listas para adoptar" describía como adoptables también a las Planned → "Capacidades empresariales controladas: disponibles para adopción o en roadmap". |
| **REFINE** | `Capio — Tu Business Advisor` → `Capio — TransformX Business Advisor` (naming canónico; "Tu/Personal Business Advisor" está marcado como copy obsoleto en `PLAN.md`). |
| **REFINE** | Título de prueba social "Organizaciones que **exploran capacidades adoptables**" afirmaba un hecho sobre terceros nombrados → "Organizaciones de referencia usadas en la validación". |
| **DEFER** | Los logos nombran empresas reales (Claro, KFC, Banco de la Vivienda…). Disclaimer visible presente, pero la autorización de uso de marca es decisión legal → **OD-07**. |
| **DEFER** | Trust badges del hero ("Implementación rápida", "Resultados medibles", "Escalable y seguro") son claims cualitativos sin evidencia → revisión de marketing (DC-18). |

### 2.2 Public Capio — `index.html#capio`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Trust boundary correcto y redundante en tres capas: copy de sección ("no accede a KPIs privados, billing ni configuración de tenant"), disclaimer bajo el chat ("Orientación de descubrimiento público…") y rechazo determinístico de contexto privado en `ts/capio.ts` (`CAPIO_PRIVATE_CONTEXT`). |
| **KEEP** | Capio es advisory: recomienda BizCaps y enlaza a detalle/contacto. **No ejecuta** ninguna operación. `aria-live="polite"` en el hilo de mensajes. |
| **REFINE** | Naming del encabezado normalizado (§2.1). |

### 2.3 BizCap Catalog — `bizcaps.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | LAB-001/002/003 como Disponible, LAB-004/005/006 como `Planned` con tratamiento visual propio (`bizcap-card--planned`), sin enlace de detalle y con disclaimer explícito. Planned **no** puede confundirse con disponible. |
| **FIX** | El catálogo no tenía ningún CTA de contenido: `adopcion.html` (Start Adoption entry, superficie obligatoria del punto A) tenía **un solo enlace entrante en todo el sitio**, desde el detalle de LAB-001. Agregado bloque final con los tres CTA diferenciados. |

### 2.4 LAB-001 Public Detail / Pre-Adoption — `bizcap-lead-intake-qualification.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Estructura de pre-adopción, distinción explícita entre el formulario comercial de TransformX y el Public Inquiry Form tenant-branded de LAB-001, CTA `Comenzar adopción`. |
| **FIX** | Sin `<dialog id="mobile-menu">` pese a tener el botón: **sin navegación bajo 1024 px** + `aria-controls` roto. |
| **FIX** | Sin theme toggle, a diferencia del resto de páginas comerciales. |

### 2.5 Pricing & Plans — `precios.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Los cuatro componentes comerciales están explícitos y en orden: Platform Subscription · BizCap Adoption · Cap Credit Usage · Optional Professional Services. |
| **KEEP** | Ningún precio convertido en claim: montos como `Indicativo` / `A medida`, eyebrow "Estructura indicativa de validación", disclaimer "No representa precios finales, Cap Credits incluidos ni términos contractuales", FAQ que remite la definición a unit economics pendientes. Cap Credits descritos sin equivalencias internas. Consistente con DC-01…DC-13. |
| **FIX** | Salto de encabezado h1 → h3 en los cuatro componentes: agregado `<h2 class="sr-only">Los cuatro componentes del modelo comercial</h2>` (sin cambio visual). |
| **FIX** | CTA `Iniciar sesión`/`Entrar` (§3.2). |

### 2.6 Company / Contact / Legal — `empresa.html`, `contacto.html`, `privacidad.html`, `terminos.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Formulario de contacto simulado en cliente vía `ts/contacto.ts` (patrón aprobado, sin tercer patrón nuevo). |
| **FIX** | `privacidad.html` y `terminos.html` tenían nav reducida de 4 ítems, sin theme toggle, **sin menú móvil** y footer compacto de 3–4 enlaces. Normalizadas al chrome canónico. |
| **FIX** | CTA `Iniciar sesión`/`Entrar` en `empresa.html` y `contacto.html` (§3.2). |
| **DEFER** | Contenido legal sigue siendo provisional, pendiente de revisión jurídica (ya registrado en `PLAN.md`). |

### 2.7 Start Adoption entry — `adopcion.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Copy correcto: la adopción ocurre tras el límite de autenticación; no promete cuenta, trial ni producto operativo. `noindex`. Los seis pasos de adopción son consistentes con la baseline. |
| **KEEP** | Entrada a modo prototipo (`[data-prototype-entry]`, `hidden` por defecto) intacta y verificada. |
| **FIX** | Nav de 3 ítems, sin theme toggle, sin menú móvil → chrome canónico. |
| **FIX** | Salto h1 → h3 por footer sin `h2` → agregado `<h2 class="sr-only">`. |

### 2.8 Authentication entry / shell — `acceso.html`

| Cat. | Detalle |
|------|---------|
| **KEEP** | Formulario deshabilitado + aviso `role="alert"`: no promete sesión real. No revela existencia de cuentas. |
| **FIX** | Mismo problema de chrome que §2.7. En el header se omite deliberadamente el CTA `Iniciar sesión` (es la página actual), manteniendo `Hablar con Capio`. |
| **DEFER** | Los flujos AUTH-01…AUTH-12 (recuperación, MFA, step-up) son alcance de **PM-UX14-03**; `acceso.html` sigue siendo la entrada estática. |

---

## 3. Cambios aplicados

### 3.1 Chrome canónico replicado — FIX Sev-2

`bizcap-lead-intake-qualification.html`, `privacidad.html`, `terminos.html`,
`acceso.html`, `adopcion.html` reciben header canónico (nav de 6 ítems + theme
toggle + CTAs + menu toggle) y el `<dialog id="mobile-menu">` completo.
`privacidad.html` y `terminos.html` reciben además el footer completo de 7 enlaces.

El comportamiento del drawer ya estaba resuelto en `initMobileMenu()` y ahora
aplica a todas las superficies: `showModal()` nativo (trap de foco + Escape),
foco al primer elemento al abrir, retorno del foco al toggle al cerrar, cierre
por backdrop y por click en enlace.

### 3.2 Label canónico del CTA de acceso — FIX

El markup traía dos spans simultáneos, `Iniciar sesión` (visible ≥640 px) y
`Entrar` (visible <640 px), intercambiados con `display: none`. Dos problemas:

1. El nombre canónico del CTA cambiaba con el viewport — justo lo que la regla B
   prohíbe. Lo mismo ocurría con `Hablar con Capio` → `Capio`.
2. `display: none` retira el texto del árbol de accesibilidad, de modo que el
   nombre accesible del enlace también cambiaba con el ancho de pantalla.

Solución: un único `.nav__action-label` con el texto canónico. Bajo 640 px se
oculta **visualmente** (técnica `clip`, no `display: none`), el ícono queda como
etiqueta visual y el nombre accesible permanece constante. Se añadió
`min-width`/`min-height` de `var(--size-touch-target)` (44 px) al botón compacto.
Esto además elimina un riesgo de WCAG 2.2 **2.5.3 Label in Name** antes del QA
de PM-UX14-07.

### 3.3 Estado de página actual no sólo visual — FIX

`resaltarNavActivo()` marcaba la página actual únicamente con la clase `.active`
(color + borde inferior). Ahora aplica y retira también `aria-current="page"`,
en el único lugar compartido por las 10 superficies.

### 3.4 Jerarquía de encabezados — FIX

Corregidos los dos saltos de nivel detectados (`precios.html` h1→h3;
`acceso.html` h1→h3). Ambos resueltos con encabezados `sr-only`, sin cambio visual.

### 3.5 Alcanzabilidad de Start Adoption — FIX

Nuevo bloque de CTA al cierre del catálogo con los tres CTA diferenciados
preservados: **Hablar con Capio** (primario) · **Ver LAB-001 en detalle**
(secundario) · **Comenzar adopción** (ghost). No se introdujo un cuarto CTA global
compitiendo con la jerarquía existente.

### 3.6 Ajustes de copy — REFINE

Tres cambios puntuales (§2.1), ninguno sobre precios, allowances ni disponibilidad.

---

## 4. Archivos tocados

| Archivo | Cambio |
|---------|--------|
| `index.html` | Disclaimer Planned, subtítulo BizCaps, naming Capio, título prueba social, label CTA |
| `bizcaps.html` | Bloque de CTA final, label CTA |
| `bizcap-lead-intake-qualification.html` | Chrome canónico + drawer + theme toggle |
| `precios.html` | `h2` sr-only de componentes comerciales, label CTA |
| `empresa.html`, `contacto.html` | Label CTA |
| `privacidad.html`, `terminos.html` | Chrome canónico + drawer + footer completo |
| `acceso.html` | Chrome canónico + drawer + `h2` sr-only en footer |
| `adopcion.html` | Chrome canónico + drawer + `h2` sr-only en footer |
| `css/layout.css` | Label único con ocultamiento visual y touch target de 44 px |
| `ts/animaciones.ts` → `js/animaciones.js` | `aria-current="page"` |

**Archivos creados:** los dos entregables en `docs/ux/`.
**No se tocó:** `PLAN.md` (ninguna decisión comercial cambió), `capio.ts`,
`contacto.ts`, `sitemap.xml`, la capa `prototype/` ni `workspace/`.

---

## 5. Validación ejecutada

| Verificación | Resultado |
|--------------|-----------|
| `npm run build` (sitio + prototipo) | **PASS**, exit 0 |
| Enlaces internos y assets de los 12 HTML | **0 rotos** |
| Chrome en las 10 superficies (nav / drawer / toggle / theme / skip-link / footer) | **10/10 completas** |
| `aria-controls` sin destino | **0** (antes: 1) |
| `id` duplicados por página | **0** |
| Un solo `h1` y sin saltos de nivel | **10/10** |
| Labels `Entrar` / `Capio` residuales | **0** |
| Navegación bajo 1024 px | **10/10** (antes: 5/10) |
| Modo prototipo sin flag | Acceso a `workspace/` permanece `hidden`; 0 mocks ejecutados |
| Reduced motion | Global en `variables.css` + `[data-animate]` en `utilities.css`; `initFadeInScroll` revela todo sin animar |
| `focus-visible` | Regla global en `base.css` para `a`, `button`, `input`, `select`, `textarea` |
| Tokens | 0 valores hardcodeados nuevos |

### Alcance de la validación

Las verificaciones de esta tabla son **estáticas** (build, parsing de DOM,
análisis de CSS y de enlaces).

> **Actualización:** la validación en navegador real (Chrome headless vía CDP)
> **ya se ejecutó** y está documentada en
> [UX14-PROT-001-BROWSER-QA-REPORT.md](UX14-PROT-001-BROWSER-QA-REPORT.md):
> teclado, ARIA, responsive en 7 viewports, reflow a 320 px, contraste en ambos
> temas, reduced motion y touch targets. Resultado: **0 defectos abiertos**, tras
> corregir 7 reales — entre ellos una **regresión introducida por este prompt**
> (`aria-current` múltiple, D-04) y dos defectos preexistentes de sistema de
> diseño en modo oscuro (D-01, D-02).
>
> Siguen fuera de alcance y pendientes para PM-UX14-07: lector de pantalla real,
> navegadores no-Chromium, dispositivo táctil físico y texto sobre gradientes.

---

## 6. OPEN DECISIONS nuevas

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador |
|----|------------------|---------------------|-----------------|------------|
| **OD-07** | Uso de marcas reales de terceros en la prueba social (Claro, KFC, Banco de la Vivienda, La Española…) | Título y disclaimer visibles las presentan como referencias de validación, no como clientes | Que exista autorización de uso de marca o relación comercial verificada | Revisión legal/marketing (ligado a DC-18). Alternativa inmediata si no hay autorización: sustituir por descriptores de industria |
| **OD-08** | Si `playground.html` pertenece a PROT-001 | Excluido: laboratorio interno de componentes, sin chrome comercial | Que se valide con usuarios en las sesiones UX-14 | Definición de alcance de las sesiones |
| **OD-09** | Trato de las dos familias de componentes coexistentes (`.btn*` heredada y `.c-*` del playground) | PROT-001 usa exclusivamente `.btn*`; `.c-*` vive sólo en el playground | Que haya una estrategia de migración aprobada | UX-11 (no disponible en el repo, ver OD-01) — decidir antes de PM-UX14-03, que construirá UI nueva |

Siguen abiertas **OD-01…OD-06** del scaffold report. **OD-01 (ausencia de
UX-10…UX-14 en el repositorio) sigue siendo bloqueante para PM-UX14-04**; las
reglas B de este prompt se aplicaron contra la baseline controlada de
`PLAN.md`/`CLAUDE.md`, que es la única fuente de verdad disponible aquí.

---

## 7. Acceptance Gate PM-UX14-02

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| PROT-001 navegable end-to-end | ✅ | 0 enlaces rotos; navegación en las 10 superficies en todos los breakpoints (antes fallaba en 5 bajo 1024 px) |
| CTA hierarchy consistente | ✅ | `Hablar con Capio` primario, `Explorar BizCaps` secundario, `Comenzar adopción` diferenciado; `Iniciar sesión` canónico y estable en todo viewport; 0 residuos de `Entrar` |
| Public Capio boundary correcto | ✅ | Boundary en copy, disclaimer y lógica determinística; Capio no ejecuta operaciones |
| Pricing/deferred no convertidos en claims | ✅ | Cuatro componentes explícitos; `Indicativo`/`A medida`; disclaimers intactos; 0 precios nuevos |
| Responsive/accessibility smoke test | ✅ (estático) | Chrome 10/10, headings 10/10, ARIA 0 roto, touch target 44 px, focus-visible y reduced motion presentes. Verificación en navegador real: pendiente en PM-UX14-07 (§5) |
| Build PASS | ✅ | exit 0 |
| Reporte generado | ✅ | este documento + route map |

**Estado: COMPLETADO. Detenido antes de PM-UX14-03.**
