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
npm install       # instala typescript (única dependencia)
npm run build     # compila ts/**/*.ts -> js/ (tsc, ver tsconfig.json)
npx serve .       # previsualizar el sitio (no hay script npm dedicado para esto)
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
├── js/                     # SALIDA compilada — NO editar a mano
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
- Superficies: `--white`, `--surface-primary: #F8FAFC`, `--surface-secondary: #F1F5F9`, `--surface-blue: #EFF6FF`, `--surface-cyan: #ECFEFF`
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
- Páginas cargan `css/styles.css` como entry único (importa módulos en orden de cascada).
- Newsletter eliminado del footer — no replicar formularios sin handler en todas las páginas.
- Al agregar/cambiar header/footer/nav, replicar en **todas** las páginas HTML comerciales.

**De negocio / alcance** (ver `PLAN.md` para el detalle completo):
- No implementar backend real, autenticación real, ni envío real de emails/leads — todo formulario nuevo debe seguir el patrón simulado existente (validación cliente + confirmación falsa con `setTimeout`).
- No conectar Capio público a un LLM productivo — discovery determinístico en `ts/capio.ts` (LAB-001/002/003 + rechazo de contexto privado).
- No publicar precios definitivos ($49/$149), Cap Credits incluidos, consultas Capio por plan, BizCaps “incluidas” en suscripción, SLA 99.9% ni integraciones como disponibles sin evidencia.
- No escribir copy que prometa cuentas, trials o adopción productiva real — CTAs van a Capio, catálogo, contacto o prototipos `acceso.html`/`adopcion.html`.
- No agregar contenido en otros idiomas — el sitio es 100% español. Los `og:locale:alternate` (en_US, en_ES, etc.) están declarados en el `<head>` pero no tienen contenido real detrás; no agregar más alternates sin traducir la página completa.
- Dominio canónico de producción: `transformx.app` — mantener alineado en HTML (`canonical`, `og:url`, `og:image`), `sitemap.xml` y `robots.txt`.
