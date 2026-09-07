# TX-UX-014-PROT-001 — QA en navegador real (teclado · ARIA · responsive)

**Alcance:** las 10 superficies públicas de PROT-001 + `workspace/index.html`.
**Método:** Chrome 152 headless pilotado por CDP (sin dependencias añadidas al
repositorio: driver WebSocket propio sobre el `WebSocket` nativo de Node 24).
Servidor estático local, caché desactivada en cada corrida.
**No es** una auditoría estática: se disparan eventos de teclado reales
(`Input.dispatchKeyEvent`), se emulan viewports y `prefers-reduced-motion`, y se
miden estilos computados y geometría sobre el DOM renderizado.

> Complementa a [UX14-PROT-001-PUBLIC-CONSOLIDATION-REPORT.md](UX14-PROT-001-PUBLIC-CONSOLIDATION-REPORT.md),
> cuya §5 declaraba esta verificación como pendiente. Ya no lo está.

---

## 1. Resultado

| Suite | Verificaciones | Estado |
|-------|----------------|--------|
| Teclado e interacción | 49 | **PASS** — 0 fallos |
| ARIA / semántica | 11 páginas | **PASS** — 0 fallos reales |
| Responsive (7 viewports × 11 páginas) | 77 | **PASS** — 0 fallos |
| Reflow 320 / 360 / 375 px | 33 | **PASS** |
| Contraste WCAG (11 páginas × 2 temas) | 22 | **PASS** — 0 combinaciones por debajo del mínimo |
| Reduced motion | 11 | **PASS** |
| Touch targets (2.5.8) | 11 | **PASS** |
| Recursos / consola | 11 | **PASS** — 0 recursos 4xx |
| `npm run build` + enlaces | — | **PASS** |

**7 defectos reales corregidos. 4 falsos positivos descartados** (documentados
en §4 para que no se re-reporten).

---

## 2. Qué se probó por teclado

En **cada una** de las 10 superficies, con eventos de teclado reales:

- **Skip link**: es el primer `Tab`, se hace visible al recibir foco (`top: 16px`,
  medido tras su transición de 150 ms), tiene indicador de foco y `Enter` lleva
  a `#main-content`.
- **Drawer móvil**: `Enter` sobre el toggle abre el `<dialog>`; `aria-expanded`
  pasa a `true`; el `aria-label` cambia a "Cerrar menú"; el foco entra al panel.
- **Confinamiento del modal**: 30 pulsaciones de `Tab` por página — **ningún**
  elemento del contenido de fondo recibe foco en ninguna superficie.
- **Escape**: cierra, `aria-expanded` vuelve a `false`, el `aria-label` se
  restaura, el foco **retorna al toggle** y el scroll del `body` se libera.
- **Theme toggle**: responde a `Enter`, cambia `data-theme` y actualiza `aria-pressed`.
- **Carrusel**: `ArrowRight` cambia la pestaña seleccionada y el foco sigue a la selección.
- **FAQ `<details>`**: abre con `Enter` desde el `summary`.
- **Capio**: el chat responde y publica en la región `aria-live="polite"`; se
  verificó además que **rechaza contexto privado** (consulta sobre KPIs y factura
  del tenant → respuesta de frontera, no datos simulados).
- **Formulario de contacto**: al enviar vacío marca `aria-invalid` y expone el
  feedback en región live.
- **Modo prototipo**: sin flag el acceso al Workspace está `hidden` y no se
  ejecuta ningún mock; con `?prototype=true` se revela y propaga el flag.

---

## 3. Defectos reales encontrados y corregidos

### D-01 · Sev-2 — Logo y títulos del footer invisibles en modo oscuro

`:root[data-theme="dark"]` redefinía `--white: var(--navy)`. El token hacía
**doble función**: superficie blanca (que sí debe invertirse) y texto
literalmente blanco sobre superficies *siempre* oscuras (footer, Capio, CTAs).
En oscuro, el wordmark del footer y cada título de columna quedaban en navy
sobre deep-navy: **ratio 1.11**, texto efectivamente invisible.

La sonda enumeró **32 elementos** afectados en todo el sitio, incluidos los
botones primarios ("Enviar", "Explorar BizCaps", "Comenzar adopción").

**Corrección:** se separan los dos roles. `--white` vuelve a ser blanco literal y
nace `--surface-card` para el rol superficie (15 declaraciones `background:
var(--white)` migradas). Defecto **preexistente**, no introducido por PM-UX14-02.

### D-02 · Sev-2 — Azul de marca ilegible como texto en superficies oscuras

`--transform-blue` (#2563EB) se usaba como color de texto sobre superficies navy:
ratios de **2.5 a 3.2** en `.section__eyebrow`, `.btn--secondary`,
`.bizcap-card__link`, `.dashboard__advisor-title`, enlaces y nav activa.

**Corrección:** nuevo token `--accent-text` — en claro es el azul de marca
(render idéntico), en oscuro `#93C5FD`. Migradas 26 declaraciones de `color:`;
`border-color` y `accent-color` se dejan intactas porque ahí el azul sí es correcto.

### D-03 · Sev-2 — Texto gris sobre el footer navy

`base.css` declara `p { color: var(--text-secondary) }`, lo que **pisa la
herencia** dentro del footer y dejaba el copyright en gris sobre navy
(**2.82**, en las 10 páginas). Corregido con `.footer p { color: inherit }`.

### D-04 · Sev-2 — `aria-current` múltiple (regresión de PM-UX14-02)

`resaltarNavActivo()` recorría `nav a`, lo que incluía el footer, y trataba los
enlaces sólo-ancla (`#plataforma`) como si apuntaran a la página actual. En
`index.html` marcaba **dos** ítems de nav más enlaces del footer. Al haberle
añadido yo `aria-current="page"` en PM-UX14-02, un lector de pantalla pasaba a
anunciar varias veces "página actual".

**Corrección:** la función se limita a la nav de cabecera y al drawer, ignora los
enlaces sólo-ancla y marca **como máximo uno** por lista. Como efecto secundario
desaparece el resaltado azul del footer, que además no contrastaba (3.31).

### D-05 · Sev-2 — Desbordamiento horizontal a 320 px (WCAG 1.4.10)

`.btn { white-space: nowrap }` con la etiqueta "Solicitar demo / Hablar con
ventas" producía un botón de 333 px que empujaba el documento a 357 px.
Corregido con `max-width: 100%` y ajuste de línea por debajo de 640 px.
También se reduce la cabecera al sello "TX" por debajo de 400 px.

### D-06 · Sev-2 — Botón "Enviar" de Capio fuera del panel en móvil

Caso clásico de `min-width: auto` en flexbox: el campo no podía encogerse y
expulsaba el botón fuera del panel (recortado por `overflow: hidden`).
Corregido con `min-width: 0` en `.capio-chat__input`.

### D-07 · Sev-3 — Touch target por debajo de 24 px (WCAG 2.5.8)

`.bizcap-card__link` medía 21 px de alto. Corregido con `min-height: 24px`.

**Ajustes menores de token para alcanzar AA:** `--text-muted` #64748B → #5F6F84
(claro, 4.36 → AA) y `--text-secondary` oscuro #94A3B8 → #9AA9BD (4.41 → AA).

---

## 4. Falsos positivos descartados (no son defectos)

Se documentan para que no vuelvan a reportarse:

1. **"El skip link no se hace visible"** — el arnés medía a los 45 ms y el enlace
   tiene `transition: top 150ms`. Con espera correcta: `top: 16px` en las 10 páginas.
2. **"El foco escapa del drawer"** — es el paso de *wrap* nativo de `<dialog>`:
   tras el último elemento el foco pasa por el documento/UI del navegador y
   vuelve **dentro** del diálogo. Verificado con 30 tabulaciones por página: el
   contenido de fondo nunca recibe foco.
3. **"Reduced motion deja contenido invisible"** — el arnés comparaba
   `transform` contra `"none"`, pero el valor computado de la identidad es
   `matrix(1, 0, 0, 1, 0, 0)`. El scroll-reveal sí revela todo correctamente.
4. **"44 fallos de contraste"** — la primera medición incluía elementos con un
   ancestro en `opacity: 0` (bloques `[data-animate]` aún no revelados) y no
   componía las capas semitransparentes. Con compositing correcto y estado de
   lectura real: 18 reales → 0 tras las correcciones.

Un hallazgo Sev-3 más se descartó como no aplicable: el formulario de
`acceso.html` no tiene región de estado, pero todos sus campos están
`disabled` y no hay envío posible. Será exigible cuando PM-UX14-03 construya
AUTH-01.

---

## 5. Límites de esta validación

- Motor **Chromium únicamente**. No se probó WebKit/Safari ni Gecko/Firefox.
- El contraste se calcula sobre colores computados; los textos sobre
  **gradientes** (`.hero__title em`, botones primarios sobre `--gradient-primary`)
  quedan fuera del cálculo automático y requieren revisión visual.
- Sin lector de pantalla real: se verificó la semántica expuesta (nombres
  accesibles, roles, `aria-live`, `aria-current`, landmarks, orden de
  encabezados), no la locución de VoiceOver/NVDA.
- Sin dispositivo táctil físico: los touch targets se miden por geometría.
- El zoom se valida por equivalencia de reflow a 320 px CSS, no con zoom real al 400 %.

---

## 6. Estado

**PROT-001 queda verificado funcionalmente en navegador real para navegación por
teclado, semántica ARIA y comportamiento responsive, con 0 defectos abiertos.**

Las correcciones D-01, D-02 y D-03 son de sistema de diseño y benefician también
a `workspace/` (PROT-002), que ya consume los tokens corregidos.
