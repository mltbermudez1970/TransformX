# TransformX

Landing pública de **TransformX** — **Intelligent Business Capability Adoption Platform** (BCaaS). Producto de Transforming Experiences Inc.

- **Repositorio:** https://github.com/mltbermudez1970/TransformX
- **Producción:** https://transformx.app (Cloudflare Pages, deploy automático desde `main`)

## Descripción

Sitio estático (HTML/CSS/JS) con TypeScript compilado. Es un **prototipo público de validación**: sin backend, auth productiva ni billing real. Capio público es un asesor determinístico de discovery/pre-adopción (`ts/capio.ts`). El formulario de contacto en `contacto.html` está simulado en cliente.

### Modelo (baseline)

- **BizCaps controladas:** LAB-001 Lead Intake & Qualification, LAB-002 Quote & Proposal Management, LAB-003 Order Intake & Validation
- **Comercial:** Platform Subscription + BizCap Adoption + Cap Credit Usage + Optional Professional Services
- **CTA principal:** Hablar con Capio · **Login:** `acceso.html` (prototipo, noindex)

### Páginas

| Archivo | Propósito |
|---------|-----------|
| `index.html` | Landing: hero, BizCaps, Capio discovery, outcomes, CTA |
| `bizcaps.html` | Catálogo controlado de BizCaps |
| `bizcap-lead-intake-qualification.html` | Pre-adopción LAB-001 |
| `precios.html` | Modelo comercial indicativo (sin precios oficiales) |
| `empresa.html` | Propósito, outcome-first, IA responsable |
| `contacto.html` | Formulario comercial simulado |
| `privacidad.html`, `terminos.html` | Legales provisionales |
| `acceso.html`, `adopcion.html` | Prototipos UX (noindex, no en sitemap) |
| `playground.html` | Laboratorio de componentes UI (interno/diseño) |
| `workspace/` | Prototipo del workspace autenticado TX-UX-014-PROT-002 (noindex, datos sintéticos) |

## Requisitos

- [Node.js](https://nodejs.org/) y npm

## Instalación y uso

```bash
git clone https://github.com/mltbermudez1970/TransformX.git
cd TransformX
npm install
npm run build    # compila ts/ + prototype/ + workspace/ → js/
npx serve .      # previsualizar
```

El prototipo autenticado se abre en `workspace/index.html`; desde las páginas
públicas de prototipo (`acceso.html`, `adopcion.html`) se accede con `?prototype=true`.

**No editar `js/*.js` a mano.**

## Estructura

```
├── index.html, bizcaps.html, bizcap-*.html, precios.html, empresa.html, contacto.html
├── acceso.html, adopcion.html, privacidad.html, terminos.html, playground.html
├── css/styles.css         # entry CSS (@import de módulos)
├── ts/capio.ts            # Capio discovery (LAB-001/002/003)
├── ts/contacto.ts         # Formulario .form-contacto
├── ts/animaciones.ts, theme.ts, carousel.ts, validators.ts, forms-demo.ts
├── js/                    # Salida compilada (incluye js/prototype/, js/workspace/)
├── workspace/             # Prototipo autenticado TX-UX-014-PROT-002
├── prototype/             # Fixtures, escenarios S-01…S-10, mock-api, state
├── docs/ux/               # Documentación UX-14 + scaffold report
├── PLAN.md                # Baseline + decisiones deferred
└── CLAUDE.md              # Convenciones para agentes
```

## Documentación

| Archivo | Contenido |
|---------|-----------|
| [CLAUDE.md](CLAUDE.md) | Convenciones técnicas y reglas de negocio congeladas |
| [PLAN.md](PLAN.md) | APPROVED / PENDING / ILLUSTRATIVE + tabla DC-01… |

## Despliegue

Push a `main` → Cloudflare Pages. Dominio canónico: **transformx.app**.
