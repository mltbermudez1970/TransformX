# UX-14 — Riesgos abiertos y decisiones pendientes del prototipo (PM-UX14-07)

**Rama:** `feature/ux14-workspace-prototype`
**Artefactos:** `TX-UX-014-PROT-001` (público) · `TX-UX-014-PROT-002` (workspace)

Este documento existe para que nada severo quede escondido en un reporte de
fase. Recoge: la escala de severidad usada, los hallazgos de esta pasada y su
estado real, los riesgos que **siguen abiertos** y las decisiones que el
prototipo **no puede cerrar por sí mismo**.

---

## 1. Escala de severidad

| Nivel | Significado |
|-------|-------------|
| **Sev-1** | Impide completar un flujo P0, corrompe el estado, o rompe una frontera de arquitectura o de seguridad declarada |
| **Sev-2** | Incumple un requisito UX explícito o un criterio de accesibilidad AA en un flujo P0, sin impedirlo del todo |
| **Sev-3** | Buena práctica incumplida, o incumplimiento AA fuera de P0; degrada la experiencia sin bloquearla |
| **Sev-4** | Pulido, consistencia menor, deuda de documentación |

---

## 2. Hallazgos de PM-UX14-07 — todos cerrados

| # | Hallazgo | Sev | Dónde | Estado |
|---|----------|-----|-------|--------|
| 1 | `protoResolveRoute()` concatenaba un segundo `?` sobre rutas que ya traían query: **toda acción de work item caía en SYS-02** | **1** | `prototype/state/prototype-state.ts` | **Corregido** |
| 2 | Las regiones de feedback recibían `role`/`aria-live` en el mismo instante que el texto, y antes estaban `hidden` (fuera del árbol de accesibilidad) | **2** | MI-01/MI-03, REV-02/03, OPP-02, LEAD-03, QUAL-01, AUTH | **Corregido** |
| 3 | Al confirmar una resolución humana el foco caía al `body` (el botón se deshabilitaba justo después de recibirlo) | **2** | `workspace/reviews/decision-workspace.ts` | **Corregido** |
| 4 | La conversión exitosa navegaba a OPP-03 sin anunciar el desenlace ni mover el foco | **2** | `workspace/opportunity/opportunity.ts` | **Corregido** |
| 5 | El enlace de salto cambiaba el fragmento pero **no movía el foco** (`<main>` no era focalizable) | **3** | 28 páginas HTML | **Corregido** |
| 6 | El detalle de lead abría su esquema de encabezados en `h2` | **3** | `workspace/leads/leads.ts` | **Corregido** |

### 2.1 Barrida total posterior (todas las páginas y estados)

Tras cerrar PM-UX14-07 se ejecutó una verificación exhaustiva sobre **las 58
rutas navegables** del proyecto — no sólo las de los flujos P0: las 11 páginas
públicas (incluido `playground.html`), las 12 pantallas de acceso, los 5 estados
de sistema, los 8 leads y cada vista de cada superficie. Encontró dos defectos
más, ambos corregidos:

| # | Hallazgo | Sev | Dónde | Estado |
|---|----------|-----|-------|--------|
| 7 | El `h1` del panel lateral quedaba navy sobre navy (ratio **1.09**, ilegible): `h1..h6` fijan `--text-primary` en `base.css` y pisan el color heredado del panel oscuro | **2** | `css/playground.css` | **Corregido** con `color: inherit` |
| 8 | `--success` usado como **texto** sobre `--navy-soft` da **4.31** (< 4.5 AA) en tema oscuro | **2** | chips de estado del workspace | **Corregido**: nuevo rol `--success-text` (`#34D399` en oscuro), igual que `--error-text`/`--warning-text`. Bordes y fondos siguen usando `--success` |

**No hay hallazgos abiertos de ninguna severidad.**

### 2.1 Falsos positivos descartados en esta pasada — declarados

Se registran para que no se lean como cobertura silenciada:

| Aparente hallazgo | Diagnóstico real |
|-------------------|------------------|
| "Trampa de teclado en 5 superficies" | Defecto del arnés: contaba como atasco volver a ver un destino ya visitado, y el recorrido da la vuelta a la página. Corregido a "el mismo nodo recibe el foco 3 veces seguidas" |
| "Región live ausente en el chat de Capio" | Selector equivocado en el arnés (`[data-capio-log]`); la región real es `.capio-chat__messages` y ya era correcta |
| "Snapshot incompleto en OPP-03 (18 filas)" | Aserción obsoleta: contaba filas de toda la página y el selector de escenarios de PM-07 aporta otras 10. El snapshot conserva sus 8 condiciones |
| "Los 3 puntos del carrusel no son alcanzables con Tab" | Es un `tablist` con *roving tabindex*: un único punto de tabulación y flechas para moverse — el patrón correcto. El arnés no excluía `tabindex="-1"` |
| "Los grupos de resolución tienen 5 puntos de tabulación" | Un grupo de radios **nativo sin opción marcada** hace tabulables todas sus opciones por especificación del navegador. Al marcar una, colapsa a uno solo — verificado explícitamente |
| "El formulario de contacto no confirma el envío" | Selector del arnés equivocado: leía el primer `[role=alert]` (el error vacío de *nombre*) en vez del `role="status"` de éxito. El formulario valida, confirma, resetea y no hace ninguna petición de red |
| "`workspace/system/` no tiene alternador de navegación móvil" | Correcto por diseño: `system` declara `requiresAuth: false` y el shell no monta la navegación autenticada en superficies de frontera — una pantalla de sesión expirada no debe ofrecer el árbol del workspace |
| "Contraste 2.5 en las etiquetas de navegación (2 rutas)" | Fotograma intermedio de la transición de tema, capturado en una corrida con la máquina cargada. En estado estable son `#10233F` sobre `#F8FAFC` (claro) y `#E2E8F0` sobre `#0B2545` (oscuro). Los auditores ahora desactivan transiciones antes de medir |

---

## 3. Riesgos abiertos

| # | Riesgo | Impacto si se ignora | Sev si se materializa | Dueño sugerido |
|---|--------|----------------------|------------------------|----------------|
| **R-01** | **UX-10…UX-13 no están en este repositorio.** Todas las reglas de dominio del prototipo son dato de escenario, no especificación | Se puede confundir "el prototipo hace X" con "el producto debe hacer X" | 1 | UX + Producto |
| **R-02** | El prototipo **no valida reglas de negocio**: las lee de fixtures | Una sesión con usuarios puede validar una regla que nadie ha aprobado | 1 | Producto |
| **R-03** | El copy comercial del workspace no ha pasado revisión legal/comercial | Promesas implícitas en una demo | 3 | Marketing + Legal |
| **R-04** | **No se ejecutó un lector de pantalla real.** La verificación se hizo contra el árbol de accesibilidad de Chrome | Puede haber diferencias de anuncio en VoiceOver/NVDA que la API no revela | 2 | UX + QA |
| **R-05** | **Un solo motor de navegador** (Chromium 152). Sin Safari ni Firefox | `<dialog>`, `color-mix()` y `:focus-visible` pueden divergir | 2 | Frontend |
| **R-06** | La cobertura automatizada llega a los flujos P0 y 26 rutas; **no** es exhaustiva sobre escenario × ruta × actor | Un cruce no probado puede fallar en la sesión | 3 | QA |
| **R-07** | Tres de los siete roles aprobados **no tienen escenario**: sus permisos existen en `domain.ts` pero nunca se ejercen en pantalla | Los supuestos de permisos de esos roles quedan sin validar | 3 | UX + Seguridad |
| **R-08** | Huecos de numeración de pantallas (MI-02, REV-01) y LEAD-02 como vista guardada, no como ruta | Trazabilidad incompleta frente al material fuente | 4 | UX |
| **R-09** | Dashboard, Configuration y Administration son marcadores de navegación sin contrato de interacción | Un participante puede pedirlos y encontrar una superficie vacía | 3 | UX |
| **R-10** | El prototipo **exige JavaScript**: el chrome del workspace se renderiza desde `shell.ts` | Sin JS no hay navegación en `workspace/` | 3 | Arquitectura (ligado a **OD-14**) |
| **R-11** | `/workspace/` se publica con `noindex` + `Disallow`, **sin control de acceso real** | Cualquiera con la URL entra al prototipo | 2 | Infra (ligado a **OD-05**) |
| **R-12** | El estado simulado vive en `sessionStorage`; una pestaña nueva empieza limpia | Un participante que abra en otra pestaña pierde el escenario | 4 | QA de sesión |

---

## 4. Decisiones abiertas heredadas

Cerradas por el **UX-14 Resolution Package v1.0** y los tres addenda:
**OD-01**, **OD-02**, **OD-06**, **OD-09**.

Siguen **abiertas** y no pueden resolverse desde el prototipo:

| # | Decisión pendiente | Qué asumió el prototipo | Quién decide |
|---|--------------------|--------------------------|--------------|
| **OD-03** | Hosting/ruta definitiva del workspace | Subcarpeta `/workspace/` del mismo origen | Infra + DNS |
| **OD-04** | Si `communications/` y `dashboard/` tienen escenario propio | Cubiertas dentro de S-09 y S-01 | UX |
| **OD-05** | Si el prototipo se publica en producción o sólo en previews | `noindex` + `Disallow`, sin autenticación real | Infra + Seguridad |
| **OD-07** | Uso de marcas reales de terceros en la prueba social | Presentadas con disclaimer visible como referencias de validación | Legal + Marketing |
| **OD-08** | Si `playground.html` pertenece a PROT-001 | Excluido: laboratorio interno de componentes | UX |
| **OD-10** | Estructura definitiva de navegación del workspace | Árbol del prompt maestro, LAB-001 anidado bajo BizCaps | UX |
| **OD-11** | Duración de sesión, caducidad e inactividad | 30 min / 15 min, valores de demostración inventados | Seguridad |
| **OD-12** | Catálogo real de operaciones que exigen step-up | Dos ejemplos sintéticos | Seguridad + UX-12 |
| **OD-13** | Métodos MFA soportados en producción | TOTP representado; SMS declarado pero no construido | Plataforma |
| **OD-14** | Si el workspace puede exigir JavaScript | Sí, el shell se renderiza por JS | Arquitectura |
| **OD-15** | La familia `.c-*` no tiene componente de campo de texto | El workspace usa `.form-input` de la familia pública | Design System |
| **OD-16** | Convención de orden en Comunicaciones | Más recientes primero, declarado en la UI | UX |
| **OD-17** | Alcance propio de REV-04 Exception Review | Reutiliza REV-02 con `reviewType: "EXCEPTION_REVIEW"` | UX-10.4 |

---

## 5. Advertencias para quien conduzca la sesión de validación

1. **Nada de lo que el prototipo "decide" es una regla aprobada.** Cada acción,
   resolución permitida, prioridad y condición de readiness viene de un fixture.
   Si un participante valida una regla, lo que se validó es el fixture.
2. **Capio no ejecuta.** Recomienda; `availableActions` autoriza. Si alguien pide
   una operación al asistente, la declinará: es el comportamiento correcto, no un
   fallo de la demo.
3. **No hay backend.** Ningún formulario envía nada, ningún correo sale, ninguna
   credencial se compara. Los perfiles usan dominios `.test` reservados.
4. **El selector de escenarios reinicia el estado y cambia el actor.** Activar un
   escenario a mitad de una tarea descarta lo que se llevaba hecho.
5. **Un conflicto de negocio no es un error técnico.** SYS-06 aparece en línea y
   conserva el contexto: si un participante lo lee como "se rompió", eso **es**
   un hallazgo de UX que conviene anotar.

---

## 6. Estado de la condición de parada

| Criterio (§F del prompt maestro) | Estado |
|----------------------------------|--------|
| 0 hallazgos Sev-1 abiertos | ✅ |
| 0 hallazgos Sev-2 abiertos en flujos P0 | ✅ (sin excepciones aprobadas: no hizo falta ninguna) |
| Ambos prototipos compilan y navegan | ✅ |
| S-01…S-10 seleccionables y reiniciables | ✅ |
| Los cuatro reportes generados | ✅ |
| **Prueba con usuarios** | ⛔ **No iniciada — fuera del alcance de esta secuencia** |

---

## 7. Cobertura de la verificación (barrida total)

| Suite | Qué comprueba | Resultado |
|-------|---------------|-----------|
| `qa-total` | 58 rutas: carga sin errores JS, renderiza, **131 enlaces internos** resuelven, anclas existen, sin IDs duplicados, referencias ARIA íntegras, roles válidos, encabezados, landmarks, tablas, `alt`, `lang`, objetivos táctiles, responsive en 5 anchos, **todo control visible alcanzable con Tab**, sin trampas, widgets de roving tabindex | **838 / 0** |
| `qa-total2` | Contraste AA en **58 rutas × 2 temas**; cambio de tema con teclado y persistencia; menú móvil en todas las públicas; formulario de contacto (validación, confirmación, cero red); diálogos del playground | **192 / 0** |
| `qa-final` | Cinco bandas declaradas, Row→Card, movimiento reducido, reflow 320, estado no sólo por color, regiones live, frontera de arquitectura | **249 / 0** |
| `qa-ws` | Reflow en 6 viewports + contraste claro/oscuro + ARIA y objetivos táctiles del workspace | **234 / 0** |
| `qa-public` | Ídem para el prototipo público | **100 / 0** |
| `qa-estructura` | Jerarquía de encabezados, landmarks, tablas, landmark `main` en el árbol AX | **195 / 0** |
| `qa-chrome` | Chrome del workspace en 17 superficies: navegación móvil y menú de cuenta sólo con teclado | **34 / 0** |
| `qa-keyboard` | Cinco flujos P0 sólo con teclado + regiones live contra el árbol AX | **23 / 0** |
| `qa-scenarios` | Selector S-01…S-10: activación, actor, ruta, reinicio | **21 / 0** |
| `qa-pm06` | Regresión de readiness, conversión, handoff y SYS-05…08 | **30 / 0** |
| `journey-p0` | Recorrido My Work → Conversión/Handoff | **PASS** |

**1 916 comprobaciones, 0 fallos**, sobre navegador limpio (Chrome 152 headless).
