# Plan — TransformX

## Contexto

TransformX es una **landing de validación pública** (HTML/CSS/TS estático, sin backend productivo) para la **Intelligent Business Capability Adoption Platform** (BCaaS). Dominio canónico: `transformx.app`.

Este documento distingue decisiones **APPROVED / FROZEN**, **PENDING / DEFERRED** e **ILLUSTRATIVE / VALIDATION ONLY**. No reintroducir supuestos obsoletos (BizCaps genéricas de inventario/ventas, pricing $49/$149, consultas Capio por plan, login muerto, demo como único path).

---

## APPROVED / FROZEN (baseline controlada)

| Área | Decisión aprobada |
|------|-------------------|
| Categoría | BCaaS — Business Capabilities as a Service |
| Unidad adoptable | BizCap |
| Capio público | TransformX Business Advisor — discovery/pre-adopción determinístico; sin datos privados/KPIs/billing |
| BizCaps iniciales | LAB-001 Lead Intake & Qualification, LAB-002 Quote & Proposal Management, LAB-003 Order Intake & Validation |
| BizCaps futuras | LAB-004 Inventory Availability, LAB-005 Production Order Visibility, LAB-006 Customer Order Fulfillment — solo Planned/Coming Soon |
| Modelo comercial (concepto) | Platform Subscription + BizCap Adoption + Cap Credit Usage + Optional Professional Services |
| Cap Credits | Unidad customer-facing de consumo gobernado; NO expone tokens IA/compute/storage/APIs internos |
| Configuration | Configuration over Customization |
| Journey | Public Discovery → Public Pre-Adoption → Authentication Boundary → Authenticated Adoption & Operation → Measurement & Improvement → Expansion |
| CTAs globales | Hablar con Capio (primario), Iniciar sesión → `acceso.html`, Explorar BizCaps → `bizcaps.html` |
| Páginas públicas | `index.html`, `bizcaps.html`, `bizcap-lead-intake-qualification.html`, `precios.html`, `empresa.html`, `contacto.html`, `privacidad.html`, `terminos.html` |
| Prototipos UX (noindex) | `acceso.html`, `adopcion.html` — no en sitemap |
| Formularios | Simulados en cliente; contacto humano en `contacto.html` |

---

## ILLUSTRATIVE / VALIDATION ONLY

- KPIs del dashboard hero, carrusel de logos, escenarios de testimonios
- Estructura Starter/Business/Enterprise en `precios.html` (sin precios ni cantidades oficiales)
- Integraciones con etiquetas Planned / Via API / Custom
- `playground.html` — laboratorio de componentes UI (fuera del journey comercial principal)

---

## Decisiones Comerciales y de Producto Pendientes / Deferred Decisions

| ID | Pending Decision | Current Approved Constraint | Do Not Assume | Resolution Trigger/Stage | Status |
|----|------------------|----------------------------|---------------|--------------------------|--------|
| DC-01 | Precios definitivos de Platform Subscription | Concepto de suscripción separada de adopción y Cap Credits | $49, $149 u otros montos fijos | Unit economics + aprobación comercial | PENDING |
| DC-02 | Nombres definitivos de planes/tiers | Starter/Business/Enterprise solo como estructura indicativa de validación | Que esos nombres sean finales | Branding + packaging comercial | PENDING |
| DC-03 | Cap Credits incluidos por plan | Planes superiores *pueden* incluir más; sin cantidades | 100 consultas, ilimitado, 2/5 BizCaps incluidas | Unit economics + simulación de consumo | PENDING |
| DC-04 | Precio marginal de Cap Credits adicionales por plan | Mayor tier → menor costo marginal (concepto) | Rates publicados | Pricing model + finance | PENDING |
| DC-05 | Reglas y tarifas de overage | Consumo gobernado vía Cap Credits | Política de overage publicada | Billing design | PENDING |
| DC-06 | Rollover/caducidad/acumulación de Cap Credits | — | Rollover automático | Policy workshop | PENDING |
| DC-07 | Hard/soft limits, budget thresholds, auto-purchase | — | Límites numéricos en UI pública | Product + billing spec | PENDING |
| DC-08 | Adoption Fee definitivo por BizCap y fórmula | Adopción separada de suscripción | Fee fijo por LAB-00x | Per-BizCap economics | PENDING |
| DC-09 | Alcance adopción estándar vs Professional Services | PS opcionales, no requisito estándar | Qué está incluido sin PS | Scope definition por BizCap | PENDING |
| DC-10 | Precios de Optional Professional Services | Lista de categorías en precios.html | Tarifas publicadas | PS rate card | PENDING |
| DC-11 | Unit economics: actividad ↔ costo técnico ↔ Cap Credit | Cap Credit abstrae costos internos | Equivalencias 1:1 expuestas al cliente | Finance + platform architecture | PENDING |
| DC-12 | Regla de consumo de Cap Credits por BizCap/operación | Consumo por actividad de instancia | Tabla de consumo fija | Metering spec | PENDING |
| DC-13 | Ponderación STANDARD/ENHANCED/ADVANCED u otro modelo | — | Modelo final en copy | AI governance + pricing | PENDING |
| DC-14 | Política trial/free tier | Sin trial productivo en landing actual | Trial gratuito activo | GTM decision | PENDING |
| DC-15 | Cambios de plan, cancelación, refunds, retención/export/delete | — | Políticas contractuales definitivas | Legal + finance | PENDING |
| DC-16 | SLA/availability contractual | Sin 99.9% garantizado en sitio público | SLA numérico en marketing | Ops + legal | PENDING |
| DC-17 | Integraciones soportadas en producción y readiness | Etiquetas Supported/Planned/Via API/Custom | Logos como “disponibles hoy” | Integration roadmap + QA | PENDING |
| DC-18 | Evidencia para ROI, casos, logos, testimonios | Solo contenido ilustrativo marcado | Clientes/métricas como verificados | Marketing + legal approval | PENDING |
| DC-19 | Proveedor/auth, billing, metering productivo | `acceso.html`/`adopcion.html` son prototipos estáticos | Auth/billing funcional | Platform build phase | PENDING |
| DC-20 | Hostname definitivo del Workspace autenticado | Separación conceptual público/autenticado aprobada | Subdominio final en docs | Infra + DNS decision | PENDING |
| DC-21 | Páginas de detalle LAB-002 y LAB-003 | Catálogo + Capio discovery; LAB-001 tiene template completo | Detalle completo para todas las BizCaps | Content + product readiness | PENDING |

---

## Pendientes técnicos de contenido (no comerciales)

| Item | Prioridad | Notas |
|------|-----------|-------|
| Revisión legal de `privacidad.html` y `terminos.html` | Media | Documentos provisionales |
| `favicon.ico` 4MB | Baja | Re-exportar |
| FAQ dedicada (`preguntas-frecuentes.html`) | Baja | FAQ parcial en precios.html |
| Página 404 | Baja | — |
| Templating header/footer | Baja | Copy-paste manual en cada HTML hoy |

---

## Fuera de alcance (landing de validación)

- Backend, auth productiva, billing, metering, LLM productivo
- Capio autenticado operando sobre datos del tenant
- Internacionalización real (sitio 100% español)

---

## Verificación

```bash
npm install
npm run build
npx serve .
```

Buscar copy obsoleto: `Personal Business Advisor`, `100 consultas`, `Consultas ilimitadas`, `Hasta 2 BizCaps`, `Hasta 5 BizCaps`, `$49`, `$149`, `99.9% disponibilidad`, `Probar gratis` (en páginas comerciales principales).
