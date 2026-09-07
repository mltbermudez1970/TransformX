# TX-UX-014-PROT-002 — Reporte final de QA (PM-UX14-07)

**Artefacto:** Authenticated Workspace Validation Prototype
**Rama:** `feature/ux14-workspace-prototype`
**Alcance de esta pasada:** selector de escenarios S-01…S-10, responsive en las
cinco bandas declaradas, accesibilidad (teclado, regiones live, estructura,
contraste), frontera de arquitectura y regresión completa de PM-03…PM-06.
**Método:** navegador real (Chrome 152 headless) conducido por CDP. Ningún
resultado proviene de inspección estática.

---

## 1. Selector de escenarios (§A del prompt)

Chip permanente en la cabecera del workspace (`[data-scenario-open]`) que abre un
`<dialog>` con los diez escenarios. Cada fila expone los seis campos exigidos:
**ID · Título · Actor · Ruta inicial · Acciones esperadas · Resultado esperado**,
más el origen de especificación (`UX-14 Resolution Package §6`).

- **Activar** fija el escenario, reinicia el estado simulado, **cambia el actor
  de la sesión** al declarado por el escenario y navega a `initialRoute`.
- **Reiniciar** limpia comandos, oportunidades creadas y estado de vista **sin
  cerrar la sesión**.
- Disponible en las 13 superficies protegidas; operable con teclado (Enter abre,
  el foco entra, Escape cierra y lo devuelve al chip).

| Escenario | Actor | Rol | Ruta inicial | Resultado esperado (resumen) |
|-----------|-------|-----|--------------|------------------------------|
| S-01 Complete inquiry | Ana Ruiz | Sales Representative | `workspace/my-work/` | Captura completa: se puede iniciar calificación |
| S-02 Missing information | Ana Ruiz | Sales Representative | `workspace/missing-information/` | Requeridos ausentes vs enriquecimiento; se solicita lo faltante |
| S-03 Conflicting update | Ana Ruiz | Sales Representative | `workspace/missing-information/` | MI-03 separa hecho canónico, información recibida e interpretación de IA |
| S-04 Probable duplicate | Hugo Reyes | Human Reviewer | `workspace/reviews/` | Misma necesidad comercial ≠ misma empresa; la IA sólo propone |
| S-05 Human review required | Hugo Reyes | Human Reviewer | `workspace/reviews/` | QD-03 en REVIEW, no FAIL; exige resolución y justificación |
| S-06 Assignment exception | Elena Mora | Sales Manager | `workspace/assignment/` | Sin responsable elegible = resultado de negocio, no error técnico |
| S-07 Qualified not ready | Ana Ruiz | Sales Representative | `workspace/opportunity/` | Calificado ≠ listo: sin `CONVERT_TO_OPPORTUNITY` |
| S-08 Ready for conversion | Elena Mora | Sales Manager | `workspace/opportunity/` | Readiness satisfecho + permiso: conversión con confirmación y envío único |
| S-09 Stale / concurrent change | Ana Ruiz | Sales Representative | `workspace/leads/` | `CONCURRENCY_CONFLICT`; tras refrescar, nuevo conjunto de acciones |
| S-10 Auth / MFA recovery | Ana Ruiz | Sales Representative | `workspace/system/` | Sin nivel de aseguramiento no hay acciones de negocio; MFA no es acción del Lead |

Los diez tienen `specStatus: DEFINED`. Ninguno es inventado: todos citan su
fuente.

---

## 2. Resultado agregado

| Suite | Qué comprueba | Resultado |
|-------|---------------|-----------|
| `qa-scenarios` | Selector completo, activación de los 10, actor, ruta, reinicio | **21 / 0** |
| `qa-final` | Cinco bandas, Row→Card, reduce motion, reflow 320, no-sólo-color, live, frontera | **249 / 0** |
| `qa-ws` | Reflow en 6 viewports, contraste claro/oscuro, ARIA, objetivos táctiles | **234 / 0** |
| `qa-keyboard` | Cinco flujos P0 sólo con teclado + regiones live contra el árbol AX | **23 / 0** |
| `qa-estructura` | Encabezados, landmarks, tablas, landmark `main` | **195 / 0** |
| `qa-pm06` | Regresión de readiness, conversión, handoff y SYS-05…08 | **30 / 0** |
| `journey-p0` | Recorrido My Work → Conversión/Handoff | **PASS** |

**0 hallazgos abiertos Sev-1 y Sev-2. 0 hallazgos abiertos de cualquier
severidad.**

---

## 3. Accesibilidad verificada

### 3.1 Los cinco flujos P0 sólo con teclado

Ningún paso de esta suite usa `click()`: si un control no es alcanzable con Tab o
no responde a Enter/Espacio, el flujo falla.

**F2 · Sign In + MFA**
- Zona de feedback ya es región live en el primer render.
- Credenciales inválidas: el error se anuncia **en la región existente**,
  escalada a `role="alert"` / `aria-live="assertive"`, y **no revela si la cuenta
  existe**.
- AUTH-01 → AUTH-09 → workspace completado sólo con teclado.

**F3 · My Work → lead**
- La acción del work item lleva al `targetRoute` que declara el fixture (ver
  §4.1: aquí se encontró un defecto Sev-1).
- El detalle del lead se alcanza por teclado y su feedback ya es región live.

**F4 · Revisión humana (REV-03)**
- El grupo de resoluciones es un único punto de tabulación recorrido con flechas.
- Espacio selecciona; las resoluciones no permitidas se muestran **con su motivo
  accesible**, nunca ocultas.
- El diálogo de confirmación abre con Enter, enuncia la consecuencia material,
  Escape cierra y devuelve el foco al disparador.
- Al confirmar, la resolución se anuncia en la región preexistente **y el foco va
  al resultado** (ver §4.2).

**F5 · Conversión (OPP-02 → OPP-03)**
- La región live existe antes del envío.
- La conversión por teclado llega a OPP-03, **el foco aterriza en el encabezado
  del resultado** y la referencia de la oportunidad queda anunciada (§4.3).

**Transversal:** sin trampas de teclado (23–25 destinos distintos por superficie)
y sin `tabindex` positivo en ninguna página.

### 3.2 Regiones live

Se verificó contra el árbol de accesibilidad del navegador, no por atributo. El
defecto encontrado y corregido está en §4.4.

### 3.3 Contraste

Tema claro y tema oscuro, 26 rutas de workspace: **0 elementos por debajo del
umbral AA**.

### 3.4 Responsive

- Cinco bandas declaradas + 320 px: sin desbordamiento horizontal en 26 rutas.
- **Row → Card en móvil sin perder el contrato de información**: obligación,
  estado, prioridad, lead y acción siguen presentes en la tarjeta; la cola no
  depende de una tabla horizontal.
- La comparación de duplicados conmuta a tarjetas por campo (10 campos) en móvil.
- La acción primaria de conversión sigue alcanzable sin ocultar el contexto
  autoritativo (≥8 pares de contexto visibles).

### 3.5 Estado, autoridad y riesgo nunca sólo por color

Verificado en calificación, condiciones de readiness, elegibilidad de asignación
y prioridad: cada indicador lleva texto además del color.

### 3.6 La generación asistida por IA no inunda la tecnología de apoyo

El borrador generado en MI-01 **no** está dentro de una región live y es
editable: regenerar no dispara un anuncio del texto completo.

---

## 4. Defectos encontrados y corregidos en esta fase

### 4.1 Toda acción de work item caía en SYS-02 — **Sev-1**, corregido

`protoResolveRoute()` concatenaba `?prototype=true&scenario=…` sin mirar si la
ruta ya traía query. Como **todos** los `targetRoute` de los fixtures tienen la
forma `workspace/qualification/?leadId=LEAD-00045`, el resultado era

```
/workspace/opportunity/?leadId=LEAD-00047?prototype=true&scenario=S-01
```

con dos `?`. El valor de `leadId` absorbía el resto, el lead no resolvía y la
navegación terminaba en SYS-02 "no encontramos ese elemento".

No se había detectado antes porque las suites anteriores navegaban a esas
superficies **por URL directa**; sólo conducir el prototipo con teclado desde My
Work atravesó el enlace real. La función ahora fusiona los parámetros de la ruta
con los del prototipo y preserva el fragmento.

### 4.2 El foco se perdía al confirmar una resolución — Sev-2, corregido

`dialog.close()` devolvía el foco al botón de envío y, acto seguido, ese botón
quedaba deshabilitado (el envío es único) — el foco caía al `body`. Quien navega
con teclado o lector de pantalla perdía el hilo justo después de aplicar una
operación material. Ahora el foco se lleva al encabezado del resultado, que es
el contexto nuevo.

### 4.3 La conversión no anunciaba su desenlace — Sev-2, corregido

El éxito navega a OPP-03; en la página nueva el foco quedaba en `body` y el
resultado de una operación material no se anunciaba. La redirección ahora marca
`converted=1` y OPP-03 mueve el foco a su `h1` **sólo** cuando se llega desde la
operación, no al abrir el handoff por enlace.

### 4.4 Las regiones de feedback se creaban junto con el mensaje — Sev-2, corregido

Los contenedores de MI-01/MI-03, REV-03, OPP-02, el detalle de lead, la
calificación y la pantalla de acceso se renderizaban como `<div class="c-alert"
hidden>` y sólo recibían `role`/`aria-live` **en el mismo instante** en que se
inyectaba el texto. Un lector de pantalla no anuncia de forma fiable una región
que aparece y se llena a la vez, ni una que estaba `hidden` (fuera del árbol de
accesibilidad).

Ahora se pintan vacíos, presentes y con `role="status"` / `aria-live="polite"`
desde el primer render; `protoRenderFeedback()` sólo escala a
`alert`/`assertive` para error y advertencia, y `protoClearFeedback()` vacía sin
sacar la región del árbol. `.ws-feedback:empty` elimina la caja **sin** usar
`display:none`, precisamente para no reintroducir el problema.

### 4.5 El detalle de lead abría su esquema en `h2` — Sev-3, corregido

La identidad del lead (referencia + nombre de empresa) vivía dentro de la
sección 1, cuyo `h2` "Encabezado" la precedía: el primer encabezado del documento
no era el `h1`. La identidad se promovió a título de página. **Las diez secciones
obligatorias y su orden no cambian.**

### 4.6 El enlace de salto no movía el foco — Sev-3, corregido

Ver §4.1 del reporte de PROT-001: la corrección (`tabindex="-1"` en `<main>`) se
aplicó también a las 17 páginas de `workspace/`.

---

## 5. Frontera de arquitectura (§D del prompt)

| Regla | Verificación en navegador | Resultado |
|-------|---------------------------|-----------|
| Sin llamadas de red externas | Inventario de recursos cargados | ✅ 0 |
| Sin reconstrucción de `availableActions` | La UI lee del fixture (`protoLeadPermite`) | ✅ |
| `PROTO_FIXTURE_ACTION_BASELINE_BY_STATE` no gobierna la UI | Sigue siendo material de autoría | ✅ |
| Familia de componentes única en workspace | `.c-*`; sin `.btn--primary` heredado ni tercera familia | ✅ |
| Capio del workspace nunca ejecuta | Se le pidió convertir y asignar | ✅ declina |
| Capio nunca registra secretos | Se le envió una contraseña simulada | ✅ no aparece |
| Sin credenciales en fixtures | `PROTO_AUTH_USERS` sin `password`/`hash` | ✅ |
| Dominios reservados | Todos `.test` | ✅ |
| Sin backend, IdP, MFA real ni bus de eventos | Toda operación pasa por `protoMockRequest` | ✅ |

---

## 6. Lo que este reporte **no** afirma

- **No se ejecutó un lector de pantalla real.** La verificación se hizo contra el
  árbol de accesibilidad de Chrome, que es la fuente que consumen los lectores,
  pero no sustituye una pasada manual con VoiceOver o NVDA. Riesgo **R-04**.
- **Un solo motor de navegador** (Chromium 152). Riesgo **R-05**.
- Las suites cubren los flujos P0 y las 26 rutas listadas; **no** son una
  cobertura exhaustiva de toda combinación de escenario × ruta × actor.
  Riesgo **R-06**.
- El prototipo **no** valida reglas de negocio: las lee de fixtures. Que un
  escenario se comporte como se espera aquí no significa que la regla real esté
  especificada. Ver `UX14-PROTOTYPE-OPEN-RISKS.md`.

---

## 7. Condición de parada (§F del prompt)

| Criterio | Estado |
|----------|--------|
| 0 hallazgos Sev-1 abiertos | ✅ |
| 0 hallazgos Sev-2 abiertos en flujos P0 | ✅ |
| Ambos prototipos compilan y navegan | ✅ `npm run build` limpio |
| S-01…S-10 seleccionables y reiniciables | ✅ 21/21 |
| Reportes generados | ✅ los cuatro de PM-UX14-07 |

**Este reporte cierra PM-UX14-07 para PROT-002. La prueba con usuarios no se
inicia: queda fuera del alcance de esta secuencia.**
