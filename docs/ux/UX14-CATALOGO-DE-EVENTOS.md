# Catálogo de eventos — TransformX

Qué está instrumentado, para qué sirve cada evento y qué se puede analizar.
Extraído del código, no de un diseño previo: si algo no aparece aquí, no se está
midiendo.

**Destinos:** los eventos de este catálogo llegan **íntegros a los dos**
proveedores. `trackEvent()` es el único punto de salida del sitio y alimenta a
ambos en la misma llamada, así que no pueden divergir.

| | Identificador | Qué responde |
|---|---|---|
| **Mixpanel** | token `d0ffdebfef6b9d8dde7704fc4f5dd4bb` | Recorrido de producto: qué hizo esta persona, en qué orden, dónde chocó |
| **Google Analytics 4** | Measurement ID `G-G5S34PK365` (propiedad `552760833`) | Audiencia y adquisición: de dónde viene el tráfico del sitio comercial |

Ambos identificadores son claves **públicas** de cliente: viajan en el JS del
navegador, sólo permiten escribir, y no son secretos.

**Cobertura:** 10 páginas públicas + 18 superficies de `workspace/`.
`playground.html` queda fuera a propósito — es laboratorio interno.

---

## 1. Contexto de sesión — acompaña a **todos** los eventos

Es lo que permite segmentar sin tocar cada evento uno por uno. En Mixpanel son
*super propiedades* (`register`); en GA4, que no tiene equivalente, viajan como
parámetros de `config` y además se adjuntan a cada evento.

> **`is_prototype` y `surface` son dimensiones personalizadas de ámbito
> *evento*** en la propiedad de GA4. Sin ese registro previo en la interfaz de
> GA4, el parámetro llega pero no se puede usar en informes — y **no es
> retroactivo**: sólo aplica a lo recibido desde su creación.

| Propiedad | Valores | Para qué sirve |
|-----------|---------|----------------|
| `is_prototype` | `true` / `false` | **El filtro más importante.** Separa la actividad del prototipo de la de visitantes reales del sitio comercial. Sin él, los datos de validación contaminan el embudo comercial |
| `surface` | `public` / `workspace` | Lo mismo en forma legible, para agrupar en informes |
| `site_version` | `ux-14` | Permite comparar contra futuras iteraciones del prototipo |
| `is_moderated_session` | `true` / `false` | Distingue una sesión de validación conducida por un moderador de la navegación suelta. **Es `false` en los recorridos automatizados**, aunque lleven etiqueta: no hay persona detrás |
| `is_synthetic` | `true` / `false` | Recorrido automatizado (ensayo, humo, carga). Se activa con `&synthetic=true` en la URL de entrada. **Excluye siempre `is_synthetic = true` de cualquier conclusión de UX** |
| `participant_id` | `P01`, `P02`… o `null` | Etiqueta anónima del participante. **No es un dato personal**: la correspondencia con la persona vive fuera de Mixpanel |
| `session_id` | `vj11-2026-09-10` o `null` | Tanda de sesiones: journey + fecha. Permite comparar participantes entre sí |

Mixpanel añade además las suyas: `$current_url`, `$browser`, `$os`,
`$screen_width`, `current_domain`, `$device_id`, etc. GA4 añade las suyas:
`page_location`, `page_title`, `page_referrer`, origen de tráfico, dispositivo y
geografía aproximada.

### Diferencias de formato entre los dos proveedores

No son decisiones de diseño, son límites de GA4, y conviene conocerlos porque
**GA4 descarta en silencio** lo que no encaja:

| | Mixpanel | GA4 |
|---|---|---|
| Booleanos | `true` / `false` | texto `"true"` / `"false"` — GA4 no tiene tipo booleano |
| Propiedades vacías | `null` se envía (es un dato: "sin etiqueta") | se omite — `null` no es un valor válido |
| Texto largo | completo | truncado a 100 caracteres |
| Límite por evento | sin límite práctico | 25 parámetros |

---

## 2. Sitio público — señal de demanda

**Objetivo: saber qué problema tiene la gente y qué capacidad les atrae.**

### `capio_prompt_used`
Alguien usó uno de los tres prompts sugeridos en lugar de escribir.

| Propiedad | Ejemplo |
|-----------|---------|
| `prompt_text` | `"Respondemos tarde a los prospectos y perdemos oportunidades."` |
| `prompt_index` | `1`, `2`, `3` |

**Qué responde:** ¿se reconocen en los problemas que planteamos? El texto viaja
literal porque **es nuestro**, no del visitante.

### `capio_question_answered`
Capio respondió a una consulta. Se emite siempre, venga de prompt o escrita.

| Propiedad | Valores |
|-----------|---------|
| `outcome` | `bizcap_recommended` · `private_context_declined` · `no_match` |
| `bizcap_id` | `LAB-001` / `LAB-002` / `LAB-003` / `null` |
| `source` | `suggested_prompt` · `typed` |
| `question_length` | número de caracteres |
| `question_number` | 1, 2, 3… dentro de la misma visita |

**Qué responde:**
- `source = typed` dominante → su problema **no está** en tu lista de prompts; el
  copy no habla del dolor real.
- `outcome = no_match` alto → Capio no cubre lo que la gente pregunta.
- `question_number ≥ 3` → interés real, no curiosidad.
- `outcome = private_context_declined` → cuánta gente espera un producto
  autenticado que todavía no existe.

> `question_length` es la longitud, **nunca el texto**. Lo que la persona
> escribe no sale del navegador.

### `capio_recommendation_followed`
Pulsó «Explorar esta BizCap» tras la recomendación.

| Propiedad | |
|-----------|--|
| `bizcap_id` | la capacidad recomendada |
| `question_number` | en qué pregunta de la conversación ocurrió |

**Qué responde:** la tasa de acierto del discovery. Es el momento de valor de
Capio: recomendaste y te siguieron.

### `bizcap_card_clicked`
Clic en una tarjeta del catálogo. **Incluye las tarjetas `Planned`, que no
tienen enlace.**

| Propiedad | Valores |
|-----------|---------|
| `bizcap` | `LAB-001` … `LAB-006` |
| `status` | `disponible` · `planned` |
| `position` | 1–6, orden en la página |

**Qué responde:** el evento de mayor valor para roadmap. Si LAB-004
(*Inventory Availability*, no construida) recibe más clics que LAB-002, eso es
evidencia directa de demanda. Antes de esto, ese interés era invisible: nadie
podía expresarlo porque la tarjeta no lleva a ninguna parte.

### `contact_form_submitted` / `contact_form_rejected`

| Evento | Propiedades |
|--------|-------------|
| `contact_form_submitted` | `is_simulated: true` |
| `contact_form_rejected` | `invalid_fields` (p. ej. `"email,mensaje,nombre"`), `invalid_field_count` |

**Qué responde:** intención de contacto y **fricción del formulario** — qué
campos se atascan. Ni nombre, ni correo, ni mensaje salen del navegador.

### CTAs del embudo
`capio_opened` · `bizcap_catalog_opened` · `bizcap_detail_opened` (con `bizcap`)
· `adoption_started` (con `bizcap`) · `contact_intent_clicked` ·
`sign_in_started`.

**Qué responden:** el recorrido comercial completo, descubrimiento → Capio →
catálogo → detalle → adopción → contacto o acceso autenticado.

---

## 3. Profundidad de lectura

**Objetivo: saber hasta dónde llegan y qué convence.**

### `section_viewed`
Una sección entró de verdad en pantalla (50 % visible), una sola vez por sección.

| Propiedad | |
|-----------|--|
| `section_id` | `plataforma`, `capio`, `resultados`, `cta-final`… |
| `section_order` | orden en que la vio esta persona |
| `page` | ruta |

**Qué responde:** vale más que el scroll bruto. Dice si abandonan en *Problema
de negocio* o llegan hasta *Modelo comercial* — es lo que permite decidir el
**orden** de la página, no sólo su contenido.

### `page_exit`
Un único evento al salir. Usa `visibilitychange`, el único fiable en móvil.

| Propiedad | |
|-----------|--|
| `max_scroll_percent` | 0–100 |
| `seconds_on_page` | segundos |
| `sections_seen` | cuántas secciones llegó a ver |
| `page` | ruta |

**Qué responde:** resume la visita sin generar el volumen del scroll continuo.

### `faq_opened`

| Propiedad | |
|-----------|--|
| `question` | el texto de la pregunta abierta |
| `page` | ruta |

**Qué responde:** las **objeciones comerciales reales**. Qué pregunta abre
alguien en precios es información que si no, sólo tendrías preguntándole.

---

## 4. Prototipo autenticado — fricción con la gobernanza

**Objetivo: medir dónde la gobernanza confunde en vez de guiar.** Aquí lo
valioso no son clics, es dónde la gente choca.

### `governed_block_encountered` — el más importante para UX-14
La interfaz le dijo al usuario «no puedes».

| Propiedad | Valores |
|-----------|---------|
| `reason` | `permission-denied` · `not-found` · `session-expired` · `no-tenant-access` · `tenant-access-revoked` · `tenant-context-stale` · `recoverable-error` · `critical-error` |
| `sys_code` | `SYS-01` … `SYS-11` |
| `route` | superficie donde ocurrió |
| `scenario_id` | escenario activo |

**Qué responde:** cuántas veces una persona se topa con una frontera y si la
entiende. Un participante que choca tres veces con lo mismo está señalando un
problema de diseño, no de comprensión.

### `material_command_resolved`
Desenlace de una operación material. Cubre conversión, resoluciones de revisión,
asignación y cambios de acceso.

| Propiedad | Valores |
|-----------|---------|
| `action` | `CONVERT_TO_OPPORTUNITY`, `RESOLVE_HUMAN_REVIEW`, … |
| `outcome` | `success` · `business_conflict` · `stale` · `validation_error` · `permission_denied` · `recoverable_error` — y en conversión: `SUCCESS` · `IDEMPOTENT_SUCCESS` · `BUSINESS_CONFLICT` · `CONCURRENCY_CONFLICT` |
| `is_success` | booleano |
| `latency_ms` | duración simulada |
| `conflict_code` | sólo en conversión: `READINESS_CHANGED`, `ALREADY_CONVERTED_BY_OTHER`… |
| `surface_route` | superficie |

**Qué responde:** si el participante consiguió lo que intentaba, y cuando no,
**por qué** — distinguiendo conflicto de negocio de error técnico, que es una de
las fronteras que UX-14 debe validar.

### `confirmation_abandoned`
Abrió el diálogo de confirmación de una operación material y lo cerró sin
confirmar.

| Propiedad | |
|-----------|--|
| `surface` | `REV-02` |
| `resolution` | la resolución que tenía seleccionada, o `null` |

**Qué responde:** duda ante la consecuencia declarada. En validación esto vale
más que el éxito: significa que la pantalla enunció algo que le hizo parar.

### `scenario_activated`

| Propiedad | |
|-----------|--|
| `scenario_id` | `S-01` … `S-12` |
| `scenario_title` | nombre legible |
| `actor` | `act-001` … `act-004` |
| `tenant_id` | organización del escenario |

**Qué responde:** qué recorrió cada participante. Es la columna vertebral para
reconstruir una sesión.

### `tenant_switched`

| Propiedad | |
|-----------|--|
| `from_tenant` / `to_tenant` | organizaciones |
| `from_route` | desde dónde conmutó |

**Qué responde:** si conmutan mucho o se pierden al hacerlo, el contexto de
organización no está claro.

---

## 5. Análisis: filtros que vas a necesitar

| Para ver | Filtro en Mixpanel | Filtro en GA4 |
|----------|--------------------|---------------|
| Sólo visitantes reales del sitio comercial | `is_prototype = false` | dimensión `is_prototype` = `false` |
| Sólo sesiones de validación | `is_moderated_session = true` | — (no registrada como dimensión) |
| Excluir recorridos automatizados | `is_synthetic ≠ true` | — |
| Un participante | `participant_id = "P03"` | — |
| Una tanda | `session_id = "vj11-2026-09-10"` | — |
| Excluir pruebas de desarrollo | `current_domain ≠ "localhost"` | filtro de datos por `hostname` |

> **Para el análisis de las sesiones de validación, usa Mixpanel.** GA4 sólo
> tiene registradas `is_prototype` y `surface` como dimensiones personalizadas;
> `participant_id`, `session_id` y `is_moderated_session` se envían igualmente y
> se ven en DebugView y en BigQuery, pero no son filtrables en los informes
> estándar mientras no se creen también como dimensiones. No hace falta
> crearlas: ése es el trabajo de Mixpanel, y GA4 está para otra pregunta.

**Residuo conocido:** el proyecto contiene eventos de las verificaciones
técnicas (`verificacion_de_entrega`, `prueba_de_superficie`,
`comprobacion_de_etiqueta`, `comprobacion_tras_navegar`) y navegación desde
`localhost`. No existen en el código del sitio y no volverán a generarse.

---

## 6. Lo que NO se mide, y por qué

Para que nadie construya una conclusión sobre algo que no se está midiendo:

| No se mide | Motivo |
|------------|--------|
| El texto que la persona escribe a Capio | Puede traer su empresa, sus volúmenes, su problema concreto |
| Nombre, correo y mensaje del formulario | Datos personales; sólo se mide que hubo envío |
| Grabación de pantalla o sesión | Desactivada a propósito: hay campos de texto libre |
| Captura automática del DOM (`autocapture`) | Viene activa por defecto en el SDK y registra clics con el texto del elemento. Desactivada |
| Perfiles de usuario (`identify`, `people.set`) | No hay cuentas reales; `P03` es una etiqueta de sesión, no una identidad |
| Identificadores de lead, oportunidad o revisión | Son sintéticos y no aportan nada fuera del prototipo |
| Ingresos, cohortes, A/B testing, feature flags | No aplican en esta etapa |

### Consentimiento y «No rastrear»

Nada de esto se envía hasta que la persona acepta en el banner. Una sola
decisión gobierna a los dos proveedores, pero cada uno la cumple a su manera:

| | Antes de aceptar | «No rastrear» (DNT) |
|---|---|---|
| **Mixpanel** | SDK cargado pero en *opt-out*: `track()` se descarta en el cliente | Lo respeta: no envía ningún evento |
| **GA4** | **`gtag.js` ni siquiera se descarga** | No lo respeta — Google no implementa DNT |

La descarga diferida de `gtag.js` no es lo que hace la mayoría de los sitios.
Se hizo así porque Consent Mode en `denied` **no impide el envío**: GA4 sigue
mandando pings sin identificadores, y la política de privacidad de este sitio
promete que no sale ninguna petición hasta aceptar. Verificado en navegador.

---

## 7. Dónde vive cada cosa

| Archivo | Responsabilidad |
|---------|-----------------|
| `ts/mixpanel-loader.ts` | Snippet oficial del proveedor. **No modificar** |
| `ts/ga4-loader.ts` | Measurement ID, Consent Mode v2 y descarga diferida de `gtag.js` |
| `ts/analytics.ts` | Inicialización de ambos, contexto de sesión, consentimiento, `data-track`, profundidad de lectura |
| `ts/capio.ts`, `ts/contacto.ts` | Eventos del sitio público con lógica |
| `workspace/**` | Eventos del prototipo |
| `docs/ux/UX14-GUIA-DE-MEDICION-EN-SESIONES.md` | Cómo conducir una sesión para que los datos sirvan |

### Cambiar el Measurement ID de GA4

Está en una sola línea, `ts/ga4-loader.ts`. Tiene que empezar por `G-`: si se
pega el ID de propiedad (`552760833`) o el de flujo, `gtag.js` responde 404 y no
se envía nada **sin ningún error visible**. Por eso el código valida el formato
y, en `localhost`, avisa por consola en vez de fallar en silencio.

Para medir un CTA nuevo **no hace falta tocar TypeScript**:

```html
<a href="…" data-track="nombre_del_evento" data-track-bizcap="LAB-002">
```
