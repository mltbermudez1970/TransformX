# TX-UX-014-PROT-001 — Reporte final de QA (PM-UX14-07)

**Artefacto:** Public Experience Validation Prototype
**Rama:** `feature/ux14-workspace-prototype`
**Alcance de esta pasada:** consistencia, accesibilidad, responsive y frontera de
arquitectura sobre las diez superficies públicas, con el prototipo ya completo.
**Método:** navegador real (Chrome 152 headless) conducido por CDP. Ningún
resultado de este reporte proviene de inspección estática del código.

---

## 1. Superficies cubiertas

| Ruta | Superficie |
|------|-----------|
| `index.html` | Home — hero, plataforma, BizCaps, Capio, resultados, CTA final |
| `bizcaps.html` | Catálogo de BizCaps |
| `bizcap-lead-intake-qualification.html` | Detalle LAB-001 |
| `precios.html` | Modelo comercial |
| `empresa.html` | Empresa |
| `contacto.html` | Contacto |
| `privacidad.html` | Privacidad |
| `terminos.html` | Términos |
| `acceso.html` | Prototipo de acceso (noindex) |
| `adopcion.html` | Prototipo de adopción (noindex) |

---

## 2. Resultado

| Suite | Qué comprueba | Resultado |
|-------|---------------|-----------|
| `qa-public` | Reflow, contraste claro/oscuro, ARIA, objetivos táctiles, errores JS | **100 / 0 fallos** |
| `qa-final` (parte pública) | Cinco bandas declaradas, reduced motion, reflow 320 px, frontera de arquitectura | incluido en **249 / 0** |
| `qa-estructura` (parte pública) | Jerarquía de encabezados, landmarks, tablas | incluido en **195 / 0** |
| `qa-keyboard` F1 | Public Discovery sólo con teclado | **5 / 5** |

**0 hallazgos abiertos de cualquier severidad en PROT-001.**

---

## 3. Verificación de accesibilidad

### 3.1 Sólo con teclado (flujo P0 · Public Discovery)

Conducido con eventos de teclado reales; ningún paso usa `click()`.

| Comprobación | Resultado |
|--------------|-----------|
| El enlace de salto es el primer punto de tabulación y muestra indicador de foco | ✅ |
| Enter en el enlace de salto **mueve el foco** al contenido principal | ✅ (corregido, ver §4.1) |
| Capio: el registro ya es región live antes de recibir la respuesta | ✅ |
| Consulta a Capio escrita y enviada sólo con teclado; responde en la misma región | ✅ |
| Menú móvil: abre con Enter, contiene el foco, Escape cierra y lo devuelve al disparador | ✅ |
| `aria-expanded` sincronizado en ambas direcciones | ✅ |
| Sin trampas de teclado (32 destinos distintos recorridos en `index.html`) | ✅ |
| Sin `tabindex` positivo en ninguna superficie | ✅ |

### 3.2 Contraste

Auditor con composición alfa correcta (mezcla la cadena de fondos y descarta lo
que no es legible: ancestros con `opacity`, `sr-only`, diálogos cerrados).
Umbrales AA: 4.5 texto normal, 3.0 texto grande o negrita ≥18.66 px.

- **Tema claro:** 0 elementos por debajo del umbral.
- **Tema oscuro:** 0 elementos por debajo del umbral.

Las tres reglas de rol de token que hicieron esto posible (`--white` literal vs
`--surface-card`, `--accent-text` vs `--transform-blue`, `--error-text` /
`--warning-text` vs `--error` / `--warning`) están documentadas en `CLAUDE.md`.

### 3.3 Responsive y reflow

- Cinco bandas declaradas (375 / 700 / 900 / 1100 / 1400 px): sin desbordamiento
  horizontal del documento en ninguna superficie.
- Reflow a **320 px** (equivalente a zoom 400 %): sin desbordamiento.
- Objetivos táctiles ≥24 px (WCAG 2.5.8), excluyendo enlaces en línea dentro de
  párrafos, según la excepción de la propia norma.

### 3.4 Movimiento reducido

Con `prefers-reduced-motion: reduce`, los elementos `[data-animate]` quedan
visibles y sin transformación pendiente en las diez superficies: nada queda
oculto esperando un scroll que no va a animarse.

### 3.5 Estructura percibida por tecnología de apoyo

- Todas las superficies abren su esquema en `h1`, sin saltos de nivel.
- Landmarks repetidos (varios `nav`) desambiguados por nombre accesible.
- Tablas con nombre y `scope` en sus cabeceras.
- `#main-content` se expone como landmark `main` en el árbol de accesibilidad.

---

## 4. Correcciones aplicadas en esta fase

### 4.1 El enlace de salto no movía el foco — Sev-3, corregido

`<main id="main-content">` no era focalizable, así que activar el enlace de salto
cambiaba el fragmento de la URL pero dejaba el foco en el propio enlace. El
lector de pantalla no movía su cursor al contenido.

Corregido con `tabindex="-1"` en el `<main>` de **las 28 páginas** (públicas y de
workspace) más una regla en `css/base.css` para que un destino de foco
programático no dibuje anillo cuando el navegador no lo considera necesario:

```css
[tabindex="-1"]:focus:not(:focus-visible) { outline: none; }
```

### 4.2 Regiones live

El registro de Capio (`.capio-chat__messages`) ya declaraba `aria-live="polite"`
y `aria-relevant="additions"` en el HTML, antes de recibir mensajes: es el patrón
correcto y se conserva sin cambios. Se verificó contra el árbol de accesibilidad
—no sólo por atributo— que la región existe y no está ignorada antes del primer
envío, y que el nodo **no se sustituye** al llegar la respuesta.

---

## 5. Frontera de arquitectura

| Regla | Verificación | Resultado |
|-------|--------------|-----------|
| Sin llamadas de red externas (salvo Google Fonts declarado) | `performance.getEntriesByType("resource")` | ✅ 0 |
| Capio público no ejecuta operaciones | Se le pidió convertir y asignar un lead | ✅ declina |
| Capio nunca registra secretos | Se le envió una contraseña simulada | ✅ no aparece en el registro |
| Sin credenciales reales en fixtures | Inspección de `PROTO_AUTH_USERS` | ✅ sin `password`/`hash` |
| Dominios de correo reservados | Todos `.test` | ✅ |
| Sin tercera familia de componentes | El sitio público mantiene `.btn*` | ✅ |

---

## 6. Lo que este reporte **no** afirma

- **No se ejecutó un lector de pantalla real.** Toda la verificación de
  accesibilidad asistida se hizo contra el árbol de accesibilidad de Chrome
  (`Accessibility.getPartialAXTree`), que es lo que consumen los lectores, pero
  no equivale a una pasada manual con VoiceOver o NVDA. Registrado como riesgo
  abierto **R-04** en `UX14-PROTOTYPE-OPEN-RISKS.md`.
- **No se validó en Safari ni Firefox.** Un único motor (Chromium 152).
  Riesgo **R-05**.
- El contraste se midió sobre color computado; no cubre texto embebido en
  imágenes (el sitio no usa texto en imágenes en las superficies auditadas).

---

## 7. Condición de parada

PROT-001 queda **listo para la sesión de validación con usuarios**: navega
completo, sin errores JS, sin hallazgos Sev-1 ni Sev-2 abiertos, con los flujos
P0 operables sólo con teclado y con la frontera público ↔ prototipo intacta.

**Este reporte cierra PM-UX14-07 para PROT-001. No se inicia la prueba con
usuarios.**
