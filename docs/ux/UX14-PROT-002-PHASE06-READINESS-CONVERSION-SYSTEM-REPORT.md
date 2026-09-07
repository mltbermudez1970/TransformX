# TX-UX-014-PROT-002 — Fase 06: Readiness, conversión, handoff y estados de sistema (PM-UX14-06)

**Insumos autoritativos:** UX-14 Resolution Package v1.0 · Addenda PM-04, PM-05 y PM-06 (TX-UX-014-AMD-PM06-001)
**Rama:** `feature/ux14-workspace-prototype`
**Condición de parada alcanzada:** journey P0 completo, de My Work a Conversión/Handoff, demostrado con fixtures en navegador real.

---

## 1. Superficies construidas

| Código | Superficie | Ruta |
|--------|-----------|------|
| OPP-01 | Opportunity Readiness | `workspace/opportunity/?leadId=…` |
| OPP-02 | Convert Confirmation | `workspace/opportunity/?leadId=…&view=convert` |
| OPP-03 | Conversion / Handoff Result | `workspace/opportunity/?leadId=…&view=handoff` |
| SYS-05 | Critical Error | `workspace/system/?state=critical-error` (página completa) |
| SYS-06 | Business Conflict | en línea, dentro de OPP-02 |
| SYS-07 | Connectivity Lost | banner global (`?offline=1`) |
| SYS-08 | Resolved WorkItem | reemplazo en línea en la ruta del WorkItem |

`?revalidate=<código>` fuerza cada rama de revalidación; `?offline=1` el estado
sin conexión. Ambos deterministas para la sesión de validación.

---

## 2. Gate §13 del Addendum

| # | Criterio | Estado | Evidencia verificada en navegador |
|---|----------|--------|-----------------------------------|
| 1 | RC-01…RC-08 centralizado | ✅ | Catálogo en `domain.ts`; las ocho renderizan en orden |
| 2 | Los cinco estados de condición soportados | ✅ | `SATISFIED / NOT_SATISFIED / BLOCKING / PENDING / NOT_APPLICABLE` |
| 3 | LEAD-00047 NOT_READY con bloqueador y sin convertir | ✅ | RC-07 BLOCKING, sin CTA, con ruta a Reviews |
| 4 | LEAD-00048 READY con CTA | ✅ | 8/8 satisfechas y `CONVERT_TO_OPPORTUNITY` presente |
| 5 | `OpportunityReferenceSummary` compartido con REV-03 | ✅ | Un solo modelo; RC-08 y REV-03 lo consumen |
| 6 | `OPP-YYYY-NNNNN` y estado `OPEN` únicamente | ✅ | `OPP-2026-00048` |
| 7 | Sin valor monetario, probabilidad ni etapas | ✅ | Declarado en pantalla y ausente del modelo |
| 8 | Snapshot inmutable completo al convertir | ✅ | 8 condiciones congeladas, incluidas satisfechas y no aplicables |
| 9 | SYS-05 como frontera de página | ✅ | Sin reintento ciego, con referencia de soporte |
| 10 | SYS-06 en línea/contextual | ✅ | Aparece donde se lanzó el comando; conserva el contexto |
| 11 | SYS-07 global con envíos materiales deshabilitados | ✅ | Banner + botones bloqueados |
| 12 | SYS-08 sin 404 y sin reactivar la acción | ✅ | Reemplazo en línea con rutas de vuelta |
| 13 | Revalidación autoritativa en la conversión | ✅ | No es sólo latencia: siete desenlaces |
| 14 | `READINESS_CHANGED` devuelve conflicto y estado refrescado | ✅ | RC-07 pasa a BLOCKING; no se crea oportunidad |
| 15 | S-09 deja LEAD-00048 en CONVERTED por otro actor | ✅ | Sofía Andrade; conflicto de concurrencia |
| 16 | `availableActions` post-refresco = §9.3 | ✅ | Seis acciones, sin `CONVERT_TO_OPPORTUNITY` |
| 17 | WorkItem original resuelto / ya no activo | ✅ | SYS-08 sobre la ruta obsoleta |
| 18 | Misma clave de idempotencia devuelve la misma oportunidad | ✅ | Reintento no crea una segunda |
| 19–22 | Build · TypeScript · regresión PM-05 · regresión pública | ✅ | Ver §5 |

---

## 3. Decisiones de implementación que conviene conocer

**`NOT_SATISFIED` no se usa en el núcleo.** El addendum lo reserva para
condiciones informativas o comprobaciones asesoras futuras: una condición
obligatoria incumplida se devuelve como `BLOCKING`. El modelo lo soporta y la UI
lo sabe pintar, pero ningún fixture del núcleo RC-01…RC-08 lo emplea. Queda
documentado en el propio fixture para que no se lea como un olvido.

**`PENDING` bloquea.** LEAD-00045 lo demuestra: la calificación sigue en
revisión, el readiness global es `PENDING` y la conversión no se ofrece.

**RC-08 con el modelo compartido.** LEAD-00044 comparte necesidad con
LEAD-00041, que ya tiene `OPP-2026-00041` abierta: RC-08 bloquea y muestra la
referencia. Es el mismo `OpportunityReferenceSummary` que consume REV-03 para
`ASSOCIATE_WITH_EXISTING_OPPORTUNITY`, no una segunda representación.

**Conflicto de negocio ≠ error técnico.** SYS-06 aparece en línea, con el texto
«No es una falla del sistema», el estado refrescado y su bloqueador. El error
recuperable ofrece reintento; el crítico lleva a SYS-05 sin reintento ciego.

**El snapshot congela todo.** No sólo los bloqueadores: las 8 condiciones con su
estado, más versiones de política, configuración, lead y necesidad. La pantalla
declara que la evaluación viva puede diferir después.

---

## 4. Defectos encontrados y corregidos

| # | Defecto | Cómo apareció | Corrección |
|---|---------|---------------|-----------|
| 1 | **La oportunidad creada se perdía al navegar de OPP-02 a OPP-03.** `PROTO_CREATED_OPPORTUNITIES` vivía sólo en memoria y el prototipo es multipágina: cada navegación destruye el contexto JS | El handoff renderizaba vacío | Persistencia en `sessionStorage`, como la sesión y el registro de comandos |
| 2 | SYS-07 no deshabilitaba los envíos: `connectivity.js` corre en su `DOMContentLoaded` **antes** de que las superficies pinten sus botones | El botón de conversión seguía activo sin conexión | `MutationObserver` sobre `#main-content` que reaplica el bloqueo cuando aparecen |

Ambos son de arquitectura del prototipo, no de reglas de negocio: la lógica de
readiness y conversión pasó la suite a la primera.

**Nota sobre la verificación:** el entorno de pruebas se perdió a mitad de la
fase y hubo que recrearlo. Al reconstruir el arnés introduje dos errores
—borrar el almacenamiento en cada navegación y probar el bloqueo offline sobre
un lead no convertible— que produjeron fallos aparentes del producto. Se
corrigieron en el arnés, no en el código, y la suite quedó en verde. Se registra
aquí porque distinguir un fallo del arnés de uno del producto es parte del
resultado.

---

## 5. Validación ejecutada (Chrome headless vía CDP)

| Suite | Verificaciones | Resultado |
|-------|----------------|-----------|
| Aceptación PM-UX14-06 | 30 | **PASS** |
| Journey P0 completo (My Work → Handoff) | 8 pasos | **PASS** |
| Workspace: reflow (6 viewports × 26 superficies), contraste (2 temas), ARIA, touch, errores JS | 234 | **PASS** |
| Sitio público: responsive (6 × 10), teclado, contraste (2 temas) | 100 | **PASS** |
| Build · TypeScript | — | **PASS**, exit 0 |

---

## 6. OPEN DECISIONS

Ninguna nueva. El addendum cerró los seis huecos identificados y respondió la
pregunta de alcance sobre la revalidación.

**Siguen abiertas:** OD-03 (hosting del workspace), OD-05 (publicación de
`/workspace/`), OD-07 (marcas de terceros en la prueba social), OD-08
(`playground.html` en PROT-001), OD-10…OD-17.

---

## 7. Acceptance Gate PM-UX14-06

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| Qualified vs Ready inequívoco | ✅ | LEAD-00047 calificado y NO listo, sin CTA; texto explícito en pantalla |
| Bloqueadores comprensibles | ✅ | Cada condición muestra pregunta, resumen, significado, evidencia y ruta de resolución |
| Consecuencia de la conversión clara | ✅ | OPP-02 enuncia qué se creará y que no podrá reconvertirse |
| Idempotencia / stale / conflicto distinguidos | ✅ | Siete desenlaces; conflicto de negocio en `warning`, error técnico en `error`, crítico en SYS-05 |
| Frontera de handoff LAB-001 respetada | ✅ | `HANDOFF_ONLY` sin ruta a LAB-002; declarado fuera de alcance |
| Estados de recuperación interactivos | ✅ | SYS-05 a SYS-08 verificados |
| Build PASS | ✅ | exit 0 |

**Estado: COMPLETADO. Detenido antes de PM-UX14-07.**
