# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del proyecto

TransformX es la landing comercial (en español) de la **Intelligent Business Capability Adoption Platform** (BCaaS): ayuda a empresas a descubrir, adoptar y mejorar capacidades de negocio (**BizCaps**) guiadas por **Capio — TransformX Business Advisor**. Es un producto de Transforming Experiences Inc.

**Etapa actual: prototipo público de validación, sin backend ni producto autenticado real.** Formularios simulados en cliente. Capio público es discovery determinístico (`ts/capio.ts`) — mapea problemas de negocio a LAB-001/002/003; no simula KPIs privados, billing ni tenant. Capio autenticado es capacidad futura, no implementada aquí.

**BizCaps controladas:** LAB-001 Lead Intake & Qualification, LAB-002 Quote & Proposal Management, LAB-003 Order Intake & Validation. Futuras solo Planned: Inventory Availability, Production Order Visibility, Customer Order Fulfillment.

**Modelo comercial (concepto):** Platform Subscription + BizCap Adoption + Cap Credit Usage + Optional Professional Services. No inventar precios ($49/$149), Cap Credits incluidos ni consultas Capio por plan.

Para baseline, decisiones deferred y roadmap ver `PLAN.md`. Para instalación ver `README.md`.

## Stack y convenciones técnicas

- **HTML/CSS/JS estático**, sin framework ni bundler (no hay React/Vite/webpack/etc.) — esto refleja el estado actual de una landing pre-lanzamiento, no es necesariamente una restricción permanente; si el proyecto adquiere backend real más adelante, esto puede revisarse.
- **TypeScript** (`ts/*.ts`) se compila a JS plano (`js/*.js`) vía `tsc`, cargado con `<script defer>` normal (no son módulos ES, son scripts globales — por eso `ts/global.d.ts` declara funciones cross-file como `declare function`).
- No hay linter, formatter, ni test suite configurados. No hay dev server (`npm start`) — se abre el HTML directo en el navegador o se sirve el directorio con cualquier servidor estático (ej. `npx serve .`).
- Fuentes vía Google Fonts (`<link>` a fonts.googleapis.com), sin self-hosting de fuentes.

### Comandos

```bash
npm install            # instala typescript (única dependencia)
npm run build          # sitio (ts/ -> js/) + prototipo (prototype/, workspace/ -> js/prototype/, js/workspace/)
npm run build:site     # solo tsconfig.json
npm run build:prototype # solo tsconfig.prototype.json
npx serve .            # previsualizar el sitio (no hay script npm dedicado para esto)
```

## Estructura de carpetas y archivos

```
├── index.html, bizcaps.html, bizcap-lead-intake-qualification.html
├── precios.html, empresa.html, contacto.html, privacidad.html, terminos.html
├── acceso.html, adopcion.html   # prototipos UX, noindex
├── playground.html              # laboratorio componentes UI
├── css/
│   ├── styles.css        # entry (@import variables → … → bizcaps.css)
│   ├── variables.css, base.css, components.css, layout.css
│   ├── sections.css, pricing.css, bizcaps.css, utilities.css
│   └── … (playground: alerts, botones, dialogs, etc.)
├── ts/
│   ├── animaciones.ts, theme.ts, contacto.ts, validators.ts
│   ├── carousel.ts, capio.ts, forms-demo.ts, playground.ts
│   └── global.d.ts
├── js/                     # SALIDA compilada — NO editar a mano (incluye js/prototype/, js/workspace/)
├── workspace/              # TX-UX-014-PROT-002 — prototipo autenticado (noindex)
├── prototype/              # capa de simulación: fixtures, scenarios, mock-api, state
├── docs/ux/                # documentación UX-14 + scaffold report
├── icon/TransformX.png, favicon.ico, favicon.svg   # íconos del sitio (favicon.ico pesa 4MB — mal exportado, issue conocido)
├── Landing Page TransformX.png   # captura/mockup de referencia visual, no se usa en el código
├── sitemap.xml, robots.txt        # SEO
├── package.json, tsconfig.json    # toolchain de TypeScript únicamente
├── CLAUDE.md, README.md, PLAN.md  # documentación del repo
```

Cada página HTML es autocontenida: repite su propio `<head>` (meta/OG tags) y su propia copia literal del header, menú móvil y footer — no hay includes ni componentes compartidos a nivel de build.

## Convenciones de nombres que ya se usan

- **Archivos de página**: nombre en español, minúsculas, sin guiones (`empresa.html`, `contacto.html`, `precios.html`); `index.html` es la excepción (nombre técnico estándar).
- **CSS — BEM en inglés**: `bloque__elemento--modificador` (ej. `.pricing-card__price-amount`, `.btn--primary`). Todas las clases y custom properties son en inglés, salvo un grupo aislado de alias en español dentro de `variables.css` (`--color-primario`, `--color-borde`, `--color-texto`, `--transicion-normal`, `--radius-input`, bajo el comentario "Bloque 6 — alias semánticos") usado únicamente por `.form-contacto`. Es una inconsistencia heredada, no un patrón a replicar — para código nuevo, usar los tokens en inglés (`--transform-blue`, `--border`, `--text-primary`, etc.), no agregar más alias en español.
- **IDs de sección**: en español cuando son anclas de navegación visibles/URLs (`#plataforma`, `#bizcaps`, `#como-funciona`, `#contacto-directo`), en inglés cuando son técnicos/estructurales (`#hero-title`, `#cta-final`, `#demo-form`, `#newsletter-form`). Los ids de página nueva siguen el patrón `#<seccion>-<elemento>` (ej. `precios-intro-title`, `precios-faq-title`).
- **Campos de formulario**: `name`/`id` en español y en minúsculas cuando el campo es genérico (`nombre`, `mensaje`), en inglés cuando es un término ya estandarizado (`email`).
- **Funciones JS/TS**: el prefijo `init*` (inicialización de un comportamiento de UI) es siempre en inglés y consistente en todo el código (`initFadeInScroll`, `initMobileMenu`, `initHeaderScroll`, `initNavigation`, `initCarousel`, `initCapio`, `initForms`). Para funciones de validación/utilidad, el idioma varía **por archivo**: `ts/contacto.ts` y `ts/animaciones.ts` usan verbos en español (`validarFormulario`, `esEmailValido`, `mostrarFeedback`, `resaltarNavActivo`), mientras que el `<script>` inline al final de `index.html` usa inglés (`isValidEmail`, `isCorporate`). Al tocar un archivo, sigue el idioma que ya usa ese archivo, no mezcles.
- **Atributos `data-*`**: kebab-case en inglés (`data-animate`, `data-scroll-capio`, `data-capio-prompt`).

## Decisiones de diseño (CSS)

Todo vive como custom properties en `css/variables.css` — reusar estos tokens, no hardcodear valores nuevos.

**Color** (marca = azul→cian, superficies neutras claras):
- Primario: `--transform-blue: #2563EB` · `--intelligence-blue: #123B7A` · `--transformation-cyan: #06B6D4`
- Oscuros/dark sections: `--deep-navy: #071B3A` · `--navy: #0B2545` · `--navy-soft: #173B67` (usados en `.capio`, `.case-study`, `.footer`)
- Superficies: `--surface-card` (blanco en claro, navy en oscuro — **este es el token de fondo**), `--surface-primary: #F8FAFC`, `--surface-secondary: #F1F5F9`, `--surface-blue: #EFF6FF`, `--surface-cyan: #ECFEFF`
- **`--white` es blanco literal y NO se invierte**: úsalo sólo para texto/bordes sobre superficies *siempre* oscuras (footer, Capio, case study, CTAs con fondo de marca). Para fondos que deben invertirse por tema, usar `--surface-card`.
- **`--accent-text`** es el azul de marca en rol *texto/ícono* (se aclara a `#93C5FD` en oscuro para conservar contraste AA). `--transform-blue` se reserva para fondos y bordes con texto blanco encima.
- Lo mismo aplica a los estados: **`--error-text`**, **`--warning-text`** y **`--success-text`** son el rol *texto* (invierten por tema); `--error`, `--warning` y `--success` son fondo/borde. Usar los primeros para texto — los segundos no alcanzan AA como texto (`--success` sobre `--navy-soft` da 4.31).
- Un `color:` explícito en una regla de elemento (p. ej. `h1..h6 { color: var(--text-primary) }` en `base.css`) **pisa el color heredado** de un contenedor oscuro. Todo bloque sobre superficie oscura que dependa de la herencia necesita `color: inherit` — ya pasó con `.footer p` y con `.playground-aside h1` (navy sobre navy, ratio 1.09).
- En `color-mix(...)` que construyen superficies, mezclar contra **`--surface-card`**, nunca contra `--white`: si no, la superficie se queda clara en modo oscuro.
- Texto: `--text-primary: #10233F` · `--text-secondary: #52647A` · `--text-muted: #718096`
- Estado: `--success: #12B76A` · `--warning: #F79009` · `--error: #D92D20` · `--border: #DCE5F0`
- Gradiente de marca: `--gradient-primary` (135deg, azul → cian) — usado en CTAs primarios, íconos destacados y texto con `background-clip: text`. `--gradient-dark` para secciones oscuras (Capio, case study).

**Tipografía**: `--font-body` = Inter (texto), `--font-heading` = Manrope (títulos, 600–800), `--font-mono` = JetBrains Mono (números/métricas destacadas — precios, KPIs, stats). Escala modular `--text-xs` (0.75rem) → `--text-5xl` (3rem); `h1`/`h2`/`h3` usan `clamp()` para tamaño fluido en vez de breakpoints fijos.

**Espaciado**: escala de 8px, `--space-1` (0.25rem) a `--space-24` (6rem) — siempre usar la escala, no valores arbitrarios en px/rem.

**Breakpoints** (mobile-first, `min-width`): `640px`, `768px`, `992px`, `1024px`, `1200px`. El más usado para pasar de 1 a varias columnas en grids de contenido es `992px` (ej. `.pricing__grid`, `.problem-solution__grid`); `1024px` es específicamente el breakpoint donde aparece el nav de escritorio y desaparece el botón de menú móvil.

**Radios y sombras**: `--radius-sm` (8px) a `--radius-xl` (24px) + `--radius-pill` (999px) para badges/botones redondeados. Sombras `--shadow-xs` → `--shadow-xl`, todas con el mismo tinte azul-marino (`rgba(7, 27, 58, alpha)`), nunca gris neutro.

**Animación**: `--transition-fast` (150ms), `--transition-base` (250ms), `--transition-slow` (400ms) — se anulan globalmente a `0ms` bajo `prefers-reduced-motion: reduce` (definido una sola vez en `variables.css`, no hace falta repetir el media query en cada componente salvo para *transform*/*opacity* estructurales como `[data-animate]`).

## Reglas de "no hacer"

**Técnicas:**
- No editar `js/*.js` a mano — son compilados desde `ts/`, `npm run build` los sobreescribe. Editar siempre el `.ts`.
- No introducir un tercer patrón de validación/envío de formularios. Patrones existentes: `contacto.ts` (`.form-contacto` en `contacto.html`) y `forms-demo.ts` (solo si se reintroducen formularios demo/newsletter).
- No hardcodear colores, espaciados, radios o sombras — usar las custom properties de `variables.css`.
- Páginas cargan `css/styles.css` como entry único (importa módulos en orden de cascada). Excepción documentada: las páginas bajo `workspace/` enlazan además `css/workspace.css` **después** de `styles.css`, para no meter la capa de prototipo en el bundle público.
- Capa `prototype/`: todo símbolo global lleva prefijo `PROTO_`/`proto*` (los scripts son globales, no módulos ES). **Nunca** reconstruir en el cliente reglas BDR, transiciones de estado, resultado global de calificación, permisos ni `availableActions`: cada lead trae su propio array `availableActions` desde el fixture y la UI lo consume tal cual (`protoLeadPermite()`). `PROTO_FIXTURE_ACTION_BASELINE_BY_STATE` es material para autorar fixtures, **no** para derivar acciones en la UI.
- Vocabulario de dominio autoritativo en `prototype/fixtures/domain.ts` (QD-01…QD-05, 9 estados de ciclo de vida, 31 acciones canónicas, 7 roles, permisos y ámbitos). Fuente: UX-14 Resolution Package v1.0. `FAIL ≠ REVIEW`, `EXCEPTION ≠ PASS`, y calificado ≠ listo para conversión.
- **Familia de componentes**: `workspace/**` usa exclusivamente la familia operacional `.c-*` (`.c-btn`, `.c-btn--loading`, `.c-btn--destructive`, `.c-dialog`, `.c-alert`, `.c-radio-group`, `.c-menu-account`). El sitio público mantiene `.btn*`. No crear una tercera familia. Excepción registrada (OD-15): los campos de texto siguen usando `.form-input` porque `.c-*` no tiene equivalente.
- **Globales compartidos entre páginas**: los scripts son globales pero cada página carga un subconjunto distinto, y `tsc` NO detecta la referencia rota. Una función usada por más de una superficie debe vivir en un archivo que todas carguen (p. ej. `prototype/state/session.ts`), nunca en uno específico como `workspace/auth/auth.ts`.
- El chrome de `workspace/` se renderiza por JS desde `workspace/shell/shell.ts` (13 superficies) — a diferencia de las páginas comerciales, que lo repiten literalmente. Cambios de navegación del workspace se hacen en `workspace/shell/routes.ts`, no página por página.
- En layouts flex/grid, fijar `min-width: 0` en los contenedores que albergan tablas o texto largo: el `min-width:auto` por defecto desborda el documento (causa recurrente ya corregida en `.ws-main` y `.ws-header__*`).
- El atributo `hidden` sólo gana gracias a `[hidden]{display:none!important}` en `base.css`: cualquier componente con `display:flex/grid` lo pisaría.
- **El prototipo es multipágina**: cada navegación destruye el contexto JS. Cualquier estado que deba sobrevivir a un salto de página va a `sessionStorage` (sesión, comandos aplicados, oportunidades creadas, estado de vista), nunca a un array en memoria.
- Los scripts de superficie corren en su propio `DOMContentLoaded`, **después** del shell: lo que dependa del DOM ya pintado (p. ej. deshabilitar botones al perder conexión) necesita `MutationObserver`, no basta con ejecutar al cargar.
- **Nunca deducir qué acción ofrecer.** Leer `availableActions` del fixture y elegir entre candidatas (`candidatas.find(a => lead.availableActions.includes(a))`). Asumir un código de acción concreto ya causó un fallo real en PM-UX14-04.
- Las **resoluciones permitidas** (`allowedResolutions`) se pintan tal cual llegan del fixture: no se construyen, ordenan ni filtran localmente. Una opción con `enabled:false` se muestra **con su motivo**, nunca se oculta: esconderla ocultaría información de gobernanza.
- **Elegibilidad ≠ sugerencia de IA ≠ permiso.** Son tres objetos separados y jamás se fusionan en una insignia o score único. Un candidato puede estar recomendado por IA y ser NO ELEGIBLE por política; la UI debe enunciar el conflicto. Tener el permiso habilita la acción, no vuelve elegible al candidato.
- `<fieldset>` arrastra un `min-width` intrínseco: fijar `min-width: 0`. Los identificadores largos en `<code>` necesitan `overflow-wrap: anywhere` o desbordan a 320px.
- **Una región live tiene que existir antes que su mensaje.** Los contenedores de feedback se pintan vacíos, visibles y con `role="status"`/`aria-live="polite"` desde el primer render; `protoRenderFeedback()` sólo escala a `alert`/`assertive` para error y advertencia, y `protoClearFeedback()` vacía sin sacar la región del árbol de accesibilidad. Nunca `hidden` ni `display:none` sobre una región live: se oculta con `.ws-feedback:empty { padding:0; border:0 }`. Poner `aria-live` y el texto en el mismo instante no se anuncia de forma fiable.
- **Tras una operación material, el foco debe aterrizar en el resultado.** Si el botón que lo recibe queda deshabilitado (envío único) o la operación navega a otra página, el foco cae al `body` y el desenlace no se anuncia. Los destinos de foco programático llevan `tabindex="-1"` (`<main id="main-content">`, encabezados de resultado) y no dibujan anillo gracias a `[tabindex="-1"]:focus:not(:focus-visible){outline:none}` en `base.css`.
- **`protoResolveRoute()` fusiona query strings, no las concatena.** Los `targetRoute` de los fixtures ya traen `?leadId=…`; añadir un segundo `?` dejaba `leadId=LEAD-00047?prototype=true` y toda acción de work item caía en SYS-02. Cualquier constructor de URL nuevo debe usar `URLSearchParams` sobre la query existente.
- Newsletter eliminado del footer — no replicar formularios sin handler en todas las páginas.
- Al agregar/cambiar header/footer/nav, replicar en **todas** las páginas HTML comerciales.

**De negocio / alcance** (ver `PLAN.md` para el detalle completo):
- No implementar backend real, autenticación real, ni envío real de emails/leads — todo formulario nuevo debe seguir el patrón simulado existente (validación cliente + confirmación falsa con `setTimeout`).
- No conectar Capio público a un LLM productivo — discovery determinístico en `ts/capio.ts` (LAB-001/002/003 + rechazo de contexto privado).
- No publicar precios definitivos ($49/$149), Cap Credits incluidos, consultas Capio por plan, BizCaps “incluidas” en suscripción, SLA 99.9% ni integraciones como disponibles sin evidencia.
- No escribir copy que prometa cuentas, trials o adopción productiva real — CTAs van a Capio, catálogo, contacto o prototipos `acceso.html`/`adopcion.html`.
- No agregar contenido en otros idiomas — el sitio es 100% español. Los `og:locale:alternate` (en_US, en_ES, etc.) están declarados en el `<head>` pero no tienen contenido real detrás; no agregar más alternates sin traducir la página completa.
- Dominio canónico de producción: `transformx.app` — mantener alineado en HTML (`canonical`, `og:url`, `og:image`), `sitemap.xml` y `robots.txt`.

## Modelo de acceso multi-Tenant (TX-UX-MTAC-AMD-001)

**Regla maestra:** `Identidad ──< Membresía de Tenant ──< Asignación de BizCap ──< roles[]`.

- **El rol NO pertenece a la identidad.** `ProtoAuthUser` es identidad pura (quién es, cómo se autentica, bajo qué política). Rol, ámbito y permisos viven en `prototype/fixtures/tenants.ts`, colgando de la asignación de BizCap. `protoActorTienePermiso()` y `protoRoleLabelOf()` delegan en el Tenant activo: son azúcar de compatibilidad, no una segunda fuente de verdad.
- **Un rol es una función dentro de un BizCap**, no un cargo. `TENANT_ADMINISTRATOR` es la excepción y por eso vive en `membership.tenantRoles`, fuera de todo BizCap: administrar el acceso de la organización no responde a "¿qué hace esta persona dentro de esta capacidad?".
- Varios roles simultáneos en el mismo BizCap son lo normal. **Nunca** se pide al usuario elegir un rol.
- **El Tenant activo se guarda en la sesión** (`ProtoSession.tenantId`) y se resuelve después de MFA: 0 membresías → estado gobernado, 1 → automática, >1 → AUTH-13.
- **Cambiar de Tenant es un cambio de contexto de seguridad**, no un filtro. `protoSwitchTenant()` vacía las claves de `PROTO_TENANT_SCOPED_KEYS` (comandos aplicados, oportunidades creadas, hilo de Capio) y el prefijo de estado de vista **antes** de establecer el nuevo contexto. Sobreviven identidad y nivel de aseguramiento.
- **La navegación se genera** con `protoBuildNav(userId, tenantId)`: un BizCap sin asignación no está en el árbol, no es que esté oculto. Editar `PROTO_BIZCAP_NAV` en `routes.ts`, no la página.
- LAB-002 y LAB-003 son **asignables pero sin superficie operativa**: aparecen en el catálogo con su estado declarado, nunca abren un workspace falso.
- Toda página de `workspace/` carga, en este orden: `tenants.js` (tras `domain.js`), `access-admin.js` y `tenant-context.js` (tras `session.js`), y `tenant-switcher.js` (antes de `shell.js`).

## Analítica (Mixpanel)

- `ts/mixpanel-loader.ts` es **código del proveedor, no modificar** (`@ts-nocheck`). Hace falta: la librería del CDN no se auto-registra, espera el stub con la cola `_i`. Sin él, el script carga con 200 y `mixpanel` queda `undefined`.
- **Los dos scripts van primero en el `<head>`, justo tras `theme.js`.** Los listeners de `DOMContentLoaded` corren en orden de registro: si `analytics.js` se carga al final, cualquier evento disparado durante el render inicial de una superficie (p. ej. `governed_block_encountered`) se pierde porque Mixpanel aún no se ha inicializado.
- **Nunca enviar contenido tecleado por el usuario.** El texto de Capio y los campos de contacto no salen del navegador: se envía qué pasó y con qué resultado. Los **prompts sugeridos sí** viajan literales — son texto nuestro, no del visitante.
- `autocapture: false` y sin grabación de sesión, a propósito: hay campos de texto libre en el sitio.
- Para medir un CTA nuevo **no hace falta tocar TypeScript**: basta `data-track="nombre_evento"` en el HTML; los `data-track-*` restantes viajan como propiedades.
- `is_prototype` / `surface` separan el prototipo del sitio público; `participant_id` / `session_id` / `is_moderated_session` etiquetan las sesiones de validación. La etiqueta se persiste en `sessionStorage` porque `protoResolveRoute()` reescribe la query en cada salto y los parámetros de URL no sobreviven.
- El pageview se emite **a mano tras `register()`**, no con `track_pageview: true`: el automático se dispara dentro de `init()` y llegaría sin super propiedades.
- La conversión **no** pasa por `protoRunCommand`: tiene su propia revalidación y por eso se instrumenta aparte en `opportunity.ts`.
- Mixpanel agrupa eventos por lotes y los persiste: eso es lo que permite que un evento disparado justo antes de `location.assign()` sobreviva a la navegación. No desactivar el batching en producción.
