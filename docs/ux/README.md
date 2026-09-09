# docs/ux/

Documentación de la línea de trabajo **UX-14 — Authenticated Workspace
Validation Prototype** dentro del repositorio TransformX.

## Artefactos

| Artefacto | Qué es | Dónde se construye |
|-----------|--------|--------------------|
| `TX-UX-014-PROT-001` | Public Experience Prototype (landing y páginas comerciales ya existentes) | PM-UX14-02 |
| `TX-UX-014-PROT-002` | Authenticated Workspace Validation Prototype (`workspace/` + `prototype/`) | PM-UX14-03 → PM-UX14-07 |

## Documentos

| Archivo | Contenido |
|---------|-----------|
| [UX14-PROT-002-SCAFFOLD-REPORT.md](UX14-PROT-002-SCAFFOLD-REPORT.md) | PM-UX14-01 — scaffold: auditoría base, archivos creados, riesgos y open decisions |
| [UX14-PROT-001-PUBLIC-CONSOLIDATION-REPORT.md](UX14-PROT-001-PUBLIC-CONSOLIDATION-REPORT.md) | PM-UX14-02 — consolidación pública: KEEP/REFINE/FIX/DEFER por superficie |
| [UX14-PROT-001-ROUTE-MAP.md](UX14-PROT-001-ROUTE-MAP.md) | PM-UX14-02 — mapa de rutas, CTAs, chrome y frontera público ↔ prototipo |
| [UX14-PROT-001-BROWSER-QA-REPORT.md](UX14-PROT-001-BROWSER-QA-REPORT.md) | QA en navegador real: teclado, ARIA, responsive, contraste, reflow |
| [UX14-PROT-002-PHASE03-AUTH-WORKSPACE-REPORT.md](UX14-PROT-002-PHASE03-AUTH-WORKSPACE-REPORT.md) | PM-UX14-03 — App Shell autenticado, AUTH-01…12, SYS-01…04, Capio contextual |
| [UX14-PRE-PM04-GATE-REPORT.md](UX14-PRE-PM04-GATE-REPORT.md) | Resolution Package v1.0 aplicado: OD-01/02/09 cerradas, migración a `.c-*` |
| [UX14-PROT-002-PHASE04-CORE-LEAD-OPS-REPORT.md](UX14-PROT-002-PHASE04-CORE-LEAD-OPS-REPORT.md) | PM-UX14-04 — My Work, Work Queue, Leads, Lead Detail, MI-01/03, QUAL-01/02 |
| [UX14-PROT-002-PHASE05-DECISION-ASSIGNMENT-REPORT.md](UX14-PROT-002-PHASE05-DECISION-ASSIGNMENT-REPORT.md) | PM-UX14-05 — REV-02/03/04 y ASN-01/02: decisión humana y asignación |
| [UX14-PROT-002-PHASE06-READINESS-CONVERSION-SYSTEM-REPORT.md](UX14-PROT-002-PHASE06-READINESS-CONVERSION-SYSTEM-REPORT.md) | PM-UX14-06 — OPP-01/02/03, revalidación de conversión y SYS-05…08 |
| [UX14-PROT-001-FINAL-QA-REPORT.md](UX14-PROT-001-FINAL-QA-REPORT.md) | PM-UX14-07 — QA final del prototipo público |
| [UX14-PROT-002-FINAL-QA-REPORT.md](UX14-PROT-002-FINAL-QA-REPORT.md) | PM-UX14-07 — QA final del workspace: escenarios S-01…S-10, teclado, regiones live, frontera |
| [UX14-PROTOTYPE-TRACEABILITY-MATRIX.md](UX14-PROTOTYPE-TRACEABILITY-MATRIX.md) | PM-UX14-07 — Persona → Job → Journey → Task Flow → Pantalla → Contrato → Requisito → Ruta/escenario |
| [UX14-PROTOTYPE-OPEN-RISKS.md](UX14-PROTOTYPE-OPEN-RISKS.md) | PM-UX14-07 — severidades, hallazgos cerrados, riesgos abiertos y decisiones pendientes |
| [UX14-GUIA-DE-MEDICION-EN-SESIONES.md](UX14-GUIA-DE-MEDICION-EN-SESIONES.md) | Analítica en las sesiones: qué debe hacer el moderador, qué se le dice al participante y qué NO mide |
| [UX14-CATALOGO-DE-EVENTOS-MIXPANEL.md](UX14-CATALOGO-DE-EVENTOS-MIXPANEL.md) | Catálogo de eventos y propiedades: objetivo de cada uno y qué se puede analizar |

## Fuentes de verdad UX

UX-10, UX-11, UX-12, UX-13 y UX-14 son la fuente de verdad para journeys,
roles/permisos, reglas BDR, state machines, Qualification, Opportunity Readiness
y `availableActions`.

> **Estado actual:** esos documentos **no están presentes en este repositorio**.
> Mientras no se incorporen aquí (o se referencie su ubicación autoritativa),
> los valores que dependen de ellos quedan registrados como `OPEN DECISION` en
> el reporte de scaffold y **no se inventan** en el prototipo. Ver **OD-01**.

## Relación con la documentación existente

- [`../../PLAN.md`](../../PLAN.md) — baseline comercial APPROVED/PENDING (DC-01…DC-21)
- [`../../CLAUDE.md`](../../CLAUDE.md) — convenciones técnicas y reglas de "no hacer"
- [`../../prototype/README.md`](../../prototype/README.md) — contrato de la capa de simulación
