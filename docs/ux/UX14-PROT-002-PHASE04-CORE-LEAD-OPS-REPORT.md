# TX-UX-014-PROT-002 — Fase 04: Core Lead Operations (PM-UX14-04)

**Insumos autoritativos:** UX-14 Resolution Package v1.0 + Addendum TX-UX-014-AMD-PM04-001 v1.0
**Rama:** `feature/ux14-workspace-prototype`
**Condición de parada alcanzada:** recorrido My Work → Lead Detail → Missing Information → Received Info Review → Qualification demostrado en navegador real.

---

## 1. Superficies construidas

| Código | Superficie | Ruta |
|--------|-----------|------|
| APP-02 | My Work | `workspace/my-work/` |
| WORK-01 | Work Queue | `workspace/work-queue/` |
| LEAD-01 | Leads List | `workspace/leads/?view=LEADS_ALL` |
| LEAD-02 | My Leads (vista guardada) | `workspace/leads/?view=LEADS_MY_OWNED` |
| LEAD-03 | Lead Detail | `workspace/leads/?leadId=…` |
| MI-01 | Missing Information | `workspace/missing-information/?leadId=…` |
| MI-03 | Received Information Review | `workspace/missing-information/?leadId=…&view=received` |
| QUAL-01 | Qualification Summary | `workspace/qualification/?leadId=…` |
| QUAL-02 | Qualification Criterion Detail | `workspace/qualification/?leadId=…&criterion=QD-0x` |

`?mock=<desenlace>` fuerza cualquiera de los seis desenlaces de comando en
cualquier superficie. `?incoming=1` revela el trabajo entrante en la cola de
forma determinística.

---

## 2. Gate §13 del Addendum

| # | Criterio | Estado | Evidencia verificada en navegador |
|---|----------|--------|-----------------------------------|
| 1 | Contrato de Priority en tipos/fixtures | ✅ | `HIGH/MEDIUM/LOW/NOT_SET`, con origen, versión de política y anulación humana |
| 2 | NBA separado de la autoridad de `availableActions` | ✅ | LEAD-00045 recomienda `REQUEST_HUMAN_REVIEW`, que **no** está autorizada: se muestra como orientación, sin CTA |
| 3 | WorkItem centralizado para My Work y Work Queue | ✅ | Un solo `PROTO_WORK_ITEMS`; Open Work reutiliza el mismo conjunto |
| 4 | WorkItemRow y WorkItemCard con un modelo semántico | ✅ | Misma función de render; en 375 px conserva obligación, estado, prioridad, contexto y acción |
| 5 | Vista guardada `LEADS_MY_OWNED` | ✅ | 4 leads, todos con dueño comercial = actor; `LEADS_ALL` devuelve 8 |
| 6 | My Leads preserva filtros/orden/scroll al volver | ✅ | Orden `updatedAt` y `scrollY=300` restaurados; foco vuelve a la fila de origen |
| 7 | Open Work deriva del mismo fixture de WorkItem | ✅ | WI-0040 (RESOLVED) excluido de Open Work y presente en Historial/Evidencia |
| 8 | Vocabularios de comunicación centralizados | ✅ | Dirección, canal, estado y tipo de actor en `domain.ts` |
| 9 | Fixtures de S-01, S-02, S-03 y S-05 completos | ✅ | 8 leads canónicos + 7 WorkItems + 9 comunicaciones |
| 10 | Orden fijo de 10 secciones en Lead Detail | ✅ | Verificado por ids, en orden |
| 11 | Sin motor de reglas en el frontend | ✅ | Ver §4 |
| 12–15 | Build · TypeScript · regresión pública · regresión PM-03 | ✅ | Ver §6 |

---

## 3. Composición obligatoria — cómo se resolvió cada punto

**Lead Detail** respeta el orden exacto: Encabezado → Situación actual →
Necesidad comercial → Calificación → Prioridad/NBA → Asignación → Opportunity
Readiness → Trabajo abierto → Comunicaciones → Historial/Evidencia.

**My Work vs My Leads.** My Work lista obligaciones asignadas al actor
(WorkItem-céntrico) y avisa cuando alguna corresponde a un lead cuyo dueño
comercial es otra persona. My Leads filtra por propiedad comercial
(ownership-céntrico). Son consultas distintas sobre datos distintos.

**Row ↔ Card.** Una sola función `protoRenderWorkItem()` produce ambas; el
cambio es puramente CSS (grid de 3 columnas ≥992 px, apilado debajo). Ninguna
de las dos oculta obligación, estado, vencimiento, prioridad, contexto del lead
ni acción principal.

**MI-01** separa 2 campos requeridos (`quantity`, `unit`) de 4 de
enriquecimiento, con tratamiento visual distinto. El borrador es editable,
regenerable y descartable, y se indica que la espera del cliente empieza al
enviarse, no al redactarse.

**MI-03** presenta tres columnas tipadas —Canonical / Received / AI— con la
interpretación de IA marcada `AI_INTERPRETATION` y su confianza, y cuatro
resoluciones en un `c-radio-group`.

**Qualification** muestra QD-01…QD-05 con los cinco resultados y, junto a cada
uno, **qué significa**: la distinción FAIL ≠ REVIEW es texto explícito, no sólo
color. QUAL-02 añade valor observado, regla configurada, evidencia, excepción y
trazabilidad. En LEAD-00048/QD-02 la excepción conserva visible el `FAIL`
original con su evidencia y muestra la autorización aparte.

**Colas.** El orden llega resuelto del fixture. El trabajo nuevo se anuncia con
banner y sólo entra tras un refresco explícito, que además mueve el foco al
encabezado de la lista. Verificado: 5 elementos antes, 5 tras la llegada, 6 tras
el refresco.

**Comandos materiales.** Envío único con `.c-btn--loading` + `aria-busy` y
etiqueta estable. Repetir un comando ya aplicado no lo reejecuta: informa la
solicitud existente. Conflicto de negocio y dato desactualizado se presentan
como `c-alert--warning` con explicación de que no son fallas del sistema;
el error técnico usa `c-alert--error`. Los dos tratamientos son distintos.

---

## 4. Frontera de autoridad — dónde está codificada

| Regla | Implementación |
|-------|----------------|
| La UI no reconstruye `availableActions` | Cada lead y cada WorkItem trae su array; se lee con `protoLeadPermite()` / `protoPrimaryAction()` |
| Prioridad ≠ Score ≠ Calificación | `PROTO_LEAD_OPERATIONS` vive **separado** de `PROTO_CANONICAL_LEADS`: prioridad y NBA no son Canonical Facts |
| NBA recomienda, no autoriza | `protoNbaEsEjecutable()` compara con `availableActions`; sin coincidencia se renderiza orientación sin CTA |
| Recomendación de IA ≠ decisión | `source: AI_RECOMMENDATION` se etiqueta y sólo entonces se muestra confianza |
| Orden de cola provisto | El fixture entrega el orden; no hay ordenación autoritativa en cliente |
| Vencimiento y SLA provistos | `isOverdue` y `sla.status` vienen del fixture; no se calculan |
| Propiedad comercial provista | No se infiere del responsable del WorkItem |
| Resultado global de calificación provisto | `overallStatus` se muestra tal cual |
| Comunicaciones no actualizan datos canónicos | La aceptación pasa por MI-03, con aviso explícito |
| `DISPATCHED` es la única evidencia de primera respuesta | `protoEsPrimeraRespuestaValida()`; DRAFT y FAILED no cuentan |

---

## 5. Defectos encontrados y corregidos durante la fase

| # | Defecto | Cómo apareció | Corrección |
|---|---------|---------------|-----------|
| 1 | **Mi código asumía `REQUEST_HUMAN_REVIEW`** como entrada a revisión, pero el fixture de S-05 autoriza `OPEN_HUMAN_REVIEW` | El botón no se renderizaba | La entrada se toma de `availableActions` entre acciones candidatas. Era exactamente el error que la regla prohíbe: deducir la acción en vez de leerla |
| 2 | `protoWireWorkListNavigation` definido en `my-work.ts`, usado por Work Queue, que no lo carga | `ReferenceError` capturado por la suite; abortaba el resto del render y por eso no aparecía el banner | Movido al módulo compartido `work-item-view.ts`. Es la **segunda vez** que aparece esta clase de fallo (la primera fue Capio en PM-03) |
| 3 | Elementos con `hidden` se seguían pintando: `.c-alert` tiene `display:flex` y ganaba | Caja vacía visible en la captura del Lead Detail | `[hidden] { display: none !important }` en `base.css` |
| 4 | `--error` y `--warning` usados como **texto**: 2.19–3.54 de contraste | Batería de contraste | Nuevos `--error-text` / `--warning-text` por tema, igual que se hizo con `--accent-text` |
| 5 | Superficies de `.c-alert`, `.c-toast`, `.c-dialog` y `.c-menu` seguían claras en modo oscuro | Contraste en oscuro | Los `color-mix` usaban `var(--white)`; mi migración anterior por regex sólo alcanzó `background: var(--white)`. Ahora usan `--surface-card` |
| 6 | El banner de cola dependía de un temporizador que el navegador estrangula en pestañas no visibles | La cola no anunciaba trabajo nuevo en headless | `?incoming=1` como disparador determinístico, además del temporizador |

**Falsos positivos descartados:** objetivo táctil de los radios medido sobre el
`<input>` de 20 px cuando el objetivo real es el `<label>` de 309×55; y dos
medidas de contraste tomadas durante la transición de tema. Ambas suites se
corrigieron.

---

## 6. Validación ejecutada (Chrome headless vía CDP)

| Suite | Verificaciones | Resultado |
|-------|----------------|-----------|
| Aceptación PM-UX14-04 | 36 | **PASS** |
| Recorrido E2E My Work → … → Qualification | 8 pasos | **PASS** |
| Workspace: reflow (6 viewports × 18 superficies), contraste (2 temas), ARIA, touch, errores JS | 162 | **PASS** |
| Gate pre-PM-04 (OD-01/02/09) | 18 | **PASS** |
| Regresión PM-03 + E2E | 41 + 6 | **PASS** |
| Regresión pública: teclado 49 · contraste 22 · responsive 77 | 148 | **PASS** |
| Build · TypeScript · enlaces · fuga al sitio público | — | **PASS** · 0 rotos · 0 fugas |

---

## 7. OPEN DECISIONS

**Nueva:**

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador |
|----|------------------|---------------------|-----------------|------------|
| **OD-16** | Convención de orden en Comunicaciones | Se eligió **más recientes primero**, aplicada de forma consistente y declarada en la UI | Que sea la convención definitiva del producto | UX-11 / decisión de diseño de contenido |

**Cerradas de hecho en esta fase:** OD-04 queda parcialmente resuelta —
`communications/` no es superficie propia sino la sección 9 de Lead Detail,
conforme al Addendum §8; la carpeta del scaffold sigue sin página.

**Siguen abiertas:** OD-03, OD-05, OD-07, OD-08, OD-10…OD-15.

---

## 8. Acceptance Gate PM-UX14-04

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Core Lead journey interactivo | ✅ | Recorrido de 8 pasos completo, 0 errores JS |
| Canonical / Received / AI distinguibles | ✅ | Tres columnas tipadas: 10 000 vs 25 000 vs IA 25 000 con confianza |
| FAIL / REVIEW / EXCEPTION distintos | ✅ | Significado en texto por criterio; excepción conserva el FAIL original |
| Semántica de colas correcta | ✅ | Orden del fixture, banner de trabajo nuevo, sin reordenar bajo el usuario |
| Camino móvil viable | ✅ | Card conserva el contrato completo a 375 px, sin desbordamiento |
| Build PASS | ✅ | exit 0 |

**Estado: COMPLETADO. Detenido antes de PM-UX14-05.**
