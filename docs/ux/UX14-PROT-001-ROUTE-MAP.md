# TX-UX-014-PROT-001 — Route Map

Mapa de rutas del **Public Experience Validation Prototype**. Todas las rutas son
archivos estáticos servidos desde la raíz del repositorio (dominio canónico de
producción: `transformx.app`).

---

## 1. Superficies públicas

| # | Superficie UX-14 | Ruta | Indexable | h1 | CTA primario | Secundarios |
|---|------------------|------|-----------|-----|--------------|-------------|
| 1 | Landing / Public Discovery | `index.html` | Sí | Hero | Hablar con Capio | Explorar BizCaps · Iniciar sesión |
| 2 | Public Capio | `index.html#capio` | Sí (sección) | — (h2 `#capio-title`) | Enviar consulta | 3 prompts sugeridos |
| 3 | BizCap Catalog | `bizcaps.html` | Sí | Catálogo de BizCaps | Hablar con Capio | Ver LAB-001 en detalle · Comenzar adopción |
| 4 | LAB-001 Public Detail / Pre-Adoption | `bizcap-lead-intake-qualification.html` | Sí | LAB-001 Lead Intake & Qualification | Comenzar adopción | Preguntar a Capio · Iniciar sesión |
| 5 | Pricing & Plans | `precios.html` | Sí | Cómo funciona el precio | Hablar con Capio | Explorar BizCaps · Contactar ventas |
| 6 | Company | `empresa.html` | Sí | Propósito | Hablar con Capio | Iniciar sesión |
| 7 | Contact | `contacto.html` | Sí | Contacto | Enviar (form simulado) | Hablar con Capio |
| 8 | Trust / Legal — Privacidad | `privacidad.html` | Sí | Política de privacidad | Hablar con Capio | Iniciar sesión |
| 9 | Trust / Legal — Términos | `terminos.html` | Sí | Términos de servicio | Hablar con Capio | Iniciar sesión |
| 10 | Start Adoption entry | `adopcion.html` | **No** (`noindex`) | Comenzar adopción de BizCap | Solicitar early access | Volver al catálogo · Hablar con Capio |
| 11 | Authentication entry / shell | `acceso.html` | **No** (`noindex`) | Iniciar sesión | (form deshabilitado) | Contacto · Capio |

`playground.html` **no forma parte de PROT-001**: es laboratorio interno de
componentes, fuera del journey comercial (ver `PLAN.md`).

---

## 2. Anclas de navegación de la landing

| Ancla | Sección | Referenciada desde |
|-------|---------|--------------------|
| `#plataforma` | Hero / Plataforma | nav + drawer + footer de las 10 superficies |
| `#como-funciona` | Cómo funciona | nav + drawer de las 10 superficies |
| `#capio` | Public Capio | CTA global de las 10 superficies |
| `#bizcaps` | BizCaps en la landing | navegación interna |
| `#solucion` | Problema / Solución | navegación interna |
| `#contacto-directo` | Contacto directo | `contacto.html` |

---

## 3. Grafo de navegación del journey

```
                        ┌──────────────────────────────┐
                        │  index.html (Discovery)      │
                        │  └─ #capio (Public Capio)    │
                        └───┬──────────────────────┬───┘
                            │                      │
                  Explorar BizCaps          Hablar con Capio
                            ▼                      │
                   ┌──────────────────┐            │
                   │  bizcaps.html    │◄───────────┘
                   │  (Catalog)       │
                   └───┬──────────┬───┘
        Ver LAB-001    │          │   Comenzar adopción
                       ▼          ▼
  ┌────────────────────────────┐ ┌──────────────────────────┐
  │ bizcap-lead-intake-        │ │ adopcion.html            │
  │ qualification.html         │─▶│ (Start Adoption entry)  │
  └────────────────────────────┘ └───┬──────────────────┬───┘
                                     │                  │
                          Solicitar early access   [prototype mode]
                                     ▼                  ▼
                            ┌────────────────┐  ┌─────────────────────┐
                            │ contacto.html  │  │ workspace/index.html│
                            └────────────────┘  │ (PROT-002)          │
                                                └─────────────────────┘
        precios.html · empresa.html · privacidad.html · terminos.html
        alcanzables desde nav, drawer y footer de todas las superficies
                                     │
                             Iniciar sesión
                                     ▼
                            ┌────────────────┐
                            │ acceso.html    │  (Authentication entry)
                            └────────────────┘
```

---

## 4. Chrome compartido

Replicado literalmente (no hay includes) en las **10 superficies** de PROT-001:

- `skip-link` → `#main-content`
- Header con nav de 6 ítems: Plataforma · BizCaps · Cómo funciona · Precios · Empresa · Contacto
- Acciones: theme toggle · **Iniciar sesión** · **Hablar con Capio** · menu toggle
- `<dialog id="mobile-menu">` con la misma nav de 6 ítems + acciones (<1024px)
- Footer con 7 enlaces + aviso de prototipo de validación

`aria-current="page"` lo aplica `resaltarNavActivo()` en `js/animaciones.js`,
no está hardcodeado por página.

---

## 5. Frontera público ↔ prototipo autenticado

| Ruta | Modo normal | Modo prototipo (`?prototype=true`) |
|------|-------------|-----------------------------------|
| `adopcion.html` | CTAs comerciales; acceso al Workspace **oculto** (`hidden`) | Se revela el enlace a `workspace/index.html?prototype=true&scenario=…` |
| `acceso.html` | Formulario ilustrativo deshabilitado | Idem |
| `workspace/**` | Siempre prototipo (`noindex` + `Disallow`) | — |

El comportamiento público por defecto **no cambia**: sin el flag, el DOM del
acceso existe pero permanece `hidden` y ningún mock se ejecuta.

---

## 6. SEO

| Ruta | `canonical` | `robots` | En `sitemap.xml` |
|------|-------------|----------|------------------|
| `index.html` | `https://transformx.app/` | (index por defecto) | Sí |
| `bizcaps.html` | `…/bizcaps.html` | — | Sí |
| `bizcap-lead-intake-qualification.html` | `…/bizcap-lead-intake-qualification.html` | — | Sí |
| `precios.html` | `…/precios.html` | — | Sí |
| `empresa.html` | `…/empresa.html` | — | Sí |
| `contacto.html` | `…/contacto.html` | — | Sí |
| `privacidad.html` | `…/privacidad.html` | — | Sí |
| `terminos.html` | `…/terminos.html` | — | Sí |
| `acceso.html` | `…/acceso.html` | `noindex, nofollow` | No |
| `adopcion.html` | `…/adopcion.html` | `noindex, nofollow` | No |
| `workspace/**` | — | `noindex, nofollow` + `Disallow: /workspace/` | No |
