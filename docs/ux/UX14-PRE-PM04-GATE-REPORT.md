# Pre-PM-UX14-04 Gate — Resolution Package v1.0 aplicado

**Insumo:** TransformX UX-14 Resolution Package v1.0 (OD-01, OD-02, OD-09).
**Alcance:** §16 del paquete. **No** se construyó ninguna superficie de PM-UX14-04.
**Rama:** `feature/ux14-workspace-prototype`

---

## 1. Qué resolvió el paquete

| Decisión | Estado | Dónde vive ahora |
|----------|--------|------------------|
| **OD-01** — QD-01…QD-05, ciclo de vida, `availableActions`, Canonical Fact | **RESUELTA** | `prototype/fixtures/domain.ts`, `fixtures.ts` |
| **OD-02** — catálogo de roles, permisos y ámbitos | **RESUELTA** | `domain.ts`, `auth-fixtures.ts` |
| **OD-09** — familia de componentes operacional | **RESUELTA** | Workspace migrado a `.c-*` |

---

## 2. Checklist §16

| # | Criterio del gate | Estado | Evidencia verificada en navegador |
|---|-------------------|--------|-----------------------------------|
| 1 | QD-01…QD-05 con significados autoritativos | ✅ | 5 criterios, claves `PRODUCT_FIT`…`COMMERCIAL_INTENT`, 5 estados, FAIL ≠ REVIEW |
| 2 | Vocabulario de ciclo de vida normalizado | ✅ | 9 estados en orden, con significado y etiqueta |
| 3 | `availableActions` centralizado y fixtures actualizados | ✅ | 31 acciones canónicas; las 31 requeridas presentes |
| 4 | `role-tbd-*` reemplazado por roles aprobados | ✅ | 0 identificadores `role-tbd-*`; catálogo de 7 roles |
| 5 | Permiso/ámbito separados del rol | ✅ | 6 actores con `role`, `scopes` y `permissions` independientes |
| 6 | Canonical Lead disponible para MI-03 y Qualification | ✅ | 8 leads canónicos versionados con procedencia y estado por campo |
| 7 | MI-03 soporta Canonical / Received / AI por separado | ✅ | Canónico 10 000 vs recibido 25 000, IA con `type: "AI_INTERPRETATION"` |
| 8 | Componentes PM-03 migrados a `.c-*` | ✅ | 0 clases `.btn*` en `workspace/` |
| 9 | Sin tercera familia de componentes | ✅ | 0 coincidencias de `tx-btn` / `workspace-btn` / `ws-btn` |
| 10 | Build PASS | ✅ | exit 0 |
| 11 | TypeScript checks PASS | ✅ | ambos proyectos, 0 errores |
| 12 | Regresión PM-03 PASS | ✅ | 41/41 + recorrido E2E |
| 13 | Regresión Landing pública PASS | ✅ | teclado 49, contraste 22, responsive 77 |
| 14 | Ambigüedad material sin resolver → OPEN DECISION | ✅ | ver §6 |

---

## 3. Frontera de autoridad, hecha explícita en el código

El paquete es tajante: el frontend no calcula el resultado global de
calificación, no infiere transiciones y **no reconstruye `availableActions`**.
Eso está codificado, no sólo documentado:

- `PROTO_FIXTURE_ACTION_BASELINE_BY_STATE` (la tabla §5) existe pero lleva un
  aviso explícito de que es material **para autorar fixtures**, nunca para que
  la UI derive acciones. Ninguna superficie la invoca.
- Cada lead canónico declara su propio array `availableActions`. Los dos leads
  `QUALIFIED` del fixture exponen conjuntos **distintos**: LEAD-00047 no ofrece
  `CONVERT_TO_OPPORTUNITY` y LEAD-00048 sí. Es la demostración de que calificado
  ≠ listo y de que el estado no determina las acciones.
- `protoLeadPermite()` es el único camino: lee el array del fixture.
- `protoActorTienePermiso()` existe para **explicar** por qué una acción provista
  aparece deshabilitada, nunca para decidir si debe existir.
- `overallStatus` de la calificación llega del fixture; no se computa.

`EXCEPTION ≠ PASS` está modelado: LEAD-00048/QD-02 conserva
`originalStatus: "FAIL"` con evidencia, y añade la autorización por separado
(quién, cuándo, con qué justificación).

---

## 4. Migración OD-09 — qué cambió

| Antes (familia pública) | Ahora (familia operacional) |
|-------------------------|-----------------------------|
| `.btn .btn--primary/secondary/ghost` | `.c-btn .c-btn--primary/secondary` |
| Texto sustituido por "Procesando…" | `.c-btn--loading` + `aria-busy`, etiqueta **estable** |
| `.auth-feedback--error/ok/info` propio | `.c-alert--error/success/info` + `role` y `aria-live` |
| Menú de cuenta a medida | `.c-menu-account` con `role="menu"`, `menuitem`, tabindex móvil |
| `.btn-group` (utilidad pública) | `.ws-actions` (utilidad local de disposición) |

El menú de cuenta ganó el patrón ARIA completo que antes no tenía: ↓/↑ navegan,
Home/End saltan a extremos, Tab cierra, Escape cierra y devuelve el foco.

Se eliminaron las reglas CSS de feedback propias: ahora las aporta `.c-alert`.
`.form-input` / `.form-label` / `.form-hint` **siguen** siendo de la familia
pública porque `.c-*` no tiene equivalente de campo de texto — no es una mezcla
accidental sino la ausencia de un componente, y queda registrada en OD-15.

El sitio público **no se tocó**: 0 cambios en `.btn*` fuera de `workspace/`.

---

## 5. Defectos encontrados y corregidos durante el gate

| # | Defecto | Cómo apareció | Corrección |
|---|---------|---------------|-----------|
| 1 | Una sesión que apunta a un usuario inexistente superaba la guarda y dejaba la Home vacía: entrada permitida, pantalla en blanco | Un fixture de test desactualizado (`usr-001` tras renombrar a `USR-001`) lo expuso | `protoGetSession()` invalida la sesión si el `userId` no resuelve contra los fixtures |
| 2 | Tipo obsoleto `ProtoLead` tras introducir la estructura canónica | `tsc` | `ProtoCanonicalLead` |
| 3 | `roleLabel` desaparecido al separar rol/permiso/ámbito | `tsc` | `protoRoleLabelOf()` + ámbito y nº de permisos en la Home |

**Falso positivo descartado:** un supuesto fallo de contraste de
`.c-btn--secondary` (4.23) resultó ser medición **durante la transición de
color** al cambiar de tema — `rgb(58,117,238)` está en la trayectoria de
`#93C5FD` → `#2563EB`. Con espera superior a `--transition-slow` (400 ms):
0 fallos. Es la segunda vez que esta clase de artefacto aparece; el arnés ya
espera el fin de las transiciones en todas las suites.

---

## 6. OPEN DECISIONS

**Cerradas por el paquete:** OD-01, OD-02, OD-09.

**Nueva:**

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador |
|----|------------------|---------------------|-----------------|------------|
| **OD-15** | La familia `.c-*` no tiene componente de campo de texto | El workspace usa `.form-input`/`.form-label`/`.form-hint` de la familia pública para entradas de texto | Que esa mezcla sea la forma definitiva, ni que deba crearse un `.c-input` en UX-14 | Definición del sistema operacional (Stage 17), o una tarea explícita de UX-11 |

**Siguen abiertas y no bloquean PM-UX14-04:** OD-03 (hosting del workspace),
OD-04 (`communications/` y `dashboard/` con escenario propio), OD-05
(publicación de `/workspace/`), OD-06 (cerrada de hecho: los escenarios ya
tienen acciones), OD-07 (marcas de terceros en la prueba social), OD-08
(`playground.html` en PROT-001), OD-10…OD-14 (navegación, sesión, step-up,
métodos MFA, dependencia de JavaScript).

---

## 7. Estado

**§16 superado íntegramente. PM-UX14-04 puede proceder sin inventar reglas de
negocio ni multiplicar familias de componentes.**

Detenido a la espera de autorización explícita para PM-UX14-04, conforme a la
regla STOP-AND-REVIEW.
