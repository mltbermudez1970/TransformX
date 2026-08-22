# TransformX

Landing page de **TransformX**, plataforma SaaS de adopción de capacidades de negocio (Business Capabilities as a Service — BCaaS) impulsada por IA. Producto de Transforming Experiences Inc.

- **Repositorio:** https://github.com/mltbermudez1970/TransformX
- **Producción:** https://transformx.app (Cloudflare Pages, deploy automático desde `main`)

## Descripción

Sitio estático (HTML/CSS/JS) con capa TypeScript compilada a JavaScript. Es una **landing de validación**: no tiene backend ni autenticación real; los formularios (demo, newsletter, contacto) están simulados en el cliente. El chat de Capio usa respuestas hardcodeadas por palabra clave.

### Páginas

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Landing principal (hero, BizCaps, Capio, demo, CTA) |
| `precios.html` | Planes y FAQ de pricing |
| `empresa.html` | Sobre la empresa |
| `contacto.html` | Formulario de contacto dedicado |

## Requisitos

- [Node.js](https://nodejs.org/) y npm (solo para compilar TypeScript)

## Instalación

```bash
git clone https://github.com/mltbermudez1970/TransformX.git
cd TransformX
npm install
```

## Uso

### Compilar TypeScript

Los archivos fuente en `ts/` se compilan a `js/` (cargados con `<script defer>` en las páginas HTML):

```bash
npm run build
```

**No editar `js/*.js` a mano** — se sobreescriben al compilar.

### Previsualizar el sitio

```bash
npx serve .
```

## Estructura del proyecto

```
├── index.html, precios.html, empresa.html, contacto.html
├── css/
│   ├── variables.css      # Design tokens (:root), breakpoints, dark mode
│   ├── base.css           # Reset, tipografía, .container
│   ├── components.css     # Botones, forms, cards, toast
│   ├── layout.css         # Header, menú móvil (<dialog>), footer
│   ├── sections.css       # Secciones del home
│   ├── pricing.css        # Estilos de precios.html
│   └── utilities.css      # Scroll-reveal, utilidades
├── ts/                    # Fuente TypeScript (editar aquí)
│   ├── animaciones.ts     # Nav, fade-in, menú, header scroll
│   ├── theme.ts           # Toggle modo claro/oscuro
│   ├── contacto.ts        # Formulario .form-contacto
│   ├── validators.ts      # esEmailValido, esEmailCorporativo
│   ├── carousel.ts        # Carrusel logos (solo index)
│   ├── capio.ts           # Chat Capio (solo index)
│   ├── forms-demo.ts      # Demo + newsletter (solo index)
│   └── global.d.ts        # Declaraciones globales compartidas
├── js/                    # Salida compilada (generada, no editar)
├── sitemap.xml, robots.txt
├── CLAUDE.md              # Guía técnica para agentes/desarrolladores
├── PLAN.md                # Roadmap de contenido pendiente
├── AGENT-WORKFLOW.md      # Uso de herramientas agénticas (Punto 5)
└── SUSTENTACION.md        # Guía para sustentación oral (Punto 6)
```

## TypeScript

- `strict: true` y `noUncheckedIndexedAccess: true` en `tsconfig.json`
- Scripts globales (sin bundler ni módulos ES)
- `index.html` carga scripts adicionales: `carousel.js`, `capio.js`, `forms-demo.js`
- Todas las páginas cargan: `theme.js`, `validators.js`, `animaciones.js`, `contacto.js`

## Despliegue

Push a la rama `main` en GitHub dispara deploy automático en **Cloudflare Pages**.

Dominio canónico: **transformx.app** (alineado en HTML, `sitemap.xml` y `robots.txt`).

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [CLAUDE.md](CLAUDE.md) | Convenciones, stack, reglas del repo |
| [PLAN.md](PLAN.md) | Páginas y contenido pendiente |
| [AGENT-WORKFLOW.md](AGENT-WORKFLOW.md) | Flujo agéntico: planificar vs. programar |
| [SUSTENTACION.md](SUSTENTACION.md) | Guión y Q&A para presentación al panel |
