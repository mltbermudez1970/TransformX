# Guía de medición para las sesiones de validación UX-14

Qué tienen que hacer el moderador y el participante para que las sesiones
generen datos utilizables en Mixpanel — y qué NO hay que esperar de esos datos.

**Aplica a:** `TX-UX-014-PROT-001` (sitio público) y `TX-UX-014-PROT-002`
(prototipo autenticado).

---

## 1. Lo primero: qué esperar de estos datos

Con 8 o 10 participantes **no habrá embudos estadísticamente significativos**.
Nadie debería concluir "el 62 % abandona en el paso 3" con esa muestra.

Lo que sí produce esta medición es un **acta objetiva y con marca de tiempo** de
cada sesión: qué recorrió la persona, cuánto tardó, dónde chocó con la
gobernanza y en qué punto dudó antes de confirmar. Su valor está en
**contrastarla con las notas del moderador**.

El hallazgo suele estar en la discrepancia. Cuando alguien dice *«me pareció
claro»* y los eventos muestran que tardó cuatro minutos y encontró tres
bloqueos, esa contradicción es el dato.

---

## 2. Antes de la sesión — comprobaciones del moderador

Cinco minutos antes, con el equipo que se va a usar:

| # | Comprobación | Por qué |
|---|--------------|---------|
| 1 | **Desactivar el bloqueador de anuncios** en el navegador de la sesión | Casi todos bloquean Mixpanel. La sesión funcionará con normalidad y **no se registrará nada**: es el fallo más común y el más silencioso |
| 2 | **Comprobar que «No rastrear» (DNT) está desactivado** | El SDK respeta DNT por diseño. Con DNT activo no se envía ni un evento, y tampoco avisa |
| 3 | **Usar una ventana nueva, no una pestaña reutilizada** | La etiqueta del participante vive en `sessionStorage`. Reutilizar una pestaña de otro participante mezcla las dos sesiones |
| 4 | **No usar modo incógnito compartido entre participantes** | Cada participante debe partir de un estado limpio. Ventana normal nueva, o incógnito nuevo por persona |
| 5 | **Verificar que llegan datos** con la comprobación del §5 | Diez segundos y evita descubrir al final que la sesión no se registró |

> Si alguna comprobación falla, **la sesión sigue siendo válida** como
> investigación cualitativa: sólo se pierde el registro automático. No se
> interrumpe la sesión por esto ni se le pide nada extra al participante.

---

## 3. Cómo abrir el prototipo — la URL importa

El prototipo **se abre siempre con la etiqueta de sesión**:

```
https://transformx.app/workspace/?participant=P03&session=vj11-2026-09-10
```

| Parámetro | Formato | Ejemplo |
|-----------|---------|---------|
| `participant` | `P` + número de dos dígitos, correlativo y **anónimo** | `P01`, `P02`, `P03` |
| `session` | `<journey>-<fecha ISO>` | `vj11-2026-09-10`, `vj12-2026-09-11` |

**Qué hace esta URL:** marca cada evento de esa sesión con `participant_id`,
`session_id` e `is_moderated_session: true`. Sin ella, los eventos siguen
registrándose pero se mezclan con el tráfico suelto y no se pueden atribuir.

**Sólo hay que ponerla al abrir.** La etiqueta sobrevive a toda la navegación
posterior: el prototipo reescribe la URL en cada salto de página y aun así se
conserva. No hay que volver a escribirla nunca.

### Reglas de la etiqueta

- **`participant` NO puede llevar datos personales.** Ni nombre, ni correo, ni
  iniciales, ni cargo. `P03` y nada más. La correspondencia entre `P03` y la
  persona vive en tu hoja de reclutamiento, fuera de Mixpanel.
- **Un `participant` distinto por persona**, aunque repitan journey.
- **Mismo `session` para toda una tanda** del mismo journey y día, para poder
  comparar entre participantes.

---

## 4. Qué decirle al participante

Antes de empezar, en lenguaje llano:

> «Vamos a registrar de forma anónima qué pantallas visitas y qué botones
> pulsas, para entender dónde la herramienta se pone difícil. **No grabamos la
> pantalla ni el audio con esto**, y no se guarda nada de lo que escribas: si
> tecleas algo en el chat o en un formulario, ese texto no sale de tu
> navegador.»

Es exacto: la instrumentación registra **qué ocurrió y con qué resultado**,
nunca el contenido tecleado. Si además vas a grabar la pantalla o el audio con
otra herramienta, **eso se consiente aparte** — no está cubierto por esto.

Si el participante prefiere que no se registre nada, basta con activar «No
rastrear» en el navegador antes de empezar. La sesión funciona igual.

---

## 5. Verificar en 10 segundos que sí está llegando

Con el prototipo abierto, en la consola del navegador:

```js
mixpanel.get_config("token")     // → "d0ffdebfef6b9d8dde7704fc4f5dd4bb"
mixpanel.has_opted_out_tracking() // → false   (si da true, DNT está activo)
```

Y en Mixpanel, la vista **Events** (el feed en vivo, no los informes, que se
pueblan más lento): debería aparecer un `$mp_web_page_view` con
`participant_id` en sus propiedades en menos de un minuto.

Si no aparece nada: bloqueador de anuncios (causa #1), DNT (causa #2), o estás
mirando otro proyecto.

---

## 6. Durante la sesión

- **No actives escenarios por el participante** salvo que el guion lo pida: cada
  activación emite `scenario_activated` y reinicia el estado, lo que corta el
  recorrido en dos en el análisis.
- **Deja que choque.** Los bloqueos de gobernanza (`governed_block_encountered`)
  son el dato más valioso de UX-14. Si le resuelves el obstáculo antes de que lo
  encuentre, pierdes justo lo que hay que medir.
- **Anota la hora de los momentos clave.** El cruce entre tu nota y la marca de
  tiempo del evento es lo que permite reconstruir qué pasó.
- **No recargues la pestaña** salvo que sea necesario: el reinicio del estado
  simulado se nota en los datos.

---

## 7. Qué queda registrado

### Del prototipo

| Evento | Qué responde |
|--------|--------------|
| `governed_block_encountered` | Cuántas veces la gobernanza dijo «no puedes» y por qué motivo. **El más importante** |
| `material_command_resolved` | Desenlace de cada operación material: éxito, conflicto de negocio, concurrencia — con su latencia |
| `confirmation_abandoned` | Abrió el diálogo de confirmación y no confirmó: duda ante la consecuencia declarada |
| `scenario_activated` | Qué escenario recorrió cada participante |
| `tenant_switched` | Cambios de organización, con origen y destino |
| `page_exit` | Tiempo en cada superficie y profundidad alcanzada |

### Del sitio público

`capio_prompt_used`, `capio_question_answered` (con el desenlace y si la
pregunta fue escrita o de un prompt sugerido), `capio_recommendation_followed`,
`bizcap_card_clicked` (**incluidas las BizCaps *Planned***, que es la única
señal de demanda de capacidades aún no construidas), `section_viewed`,
`faq_opened`, `contact_form_submitted` y `contact_form_rejected`.

---

## 8. Al analizar

Filtros que vas a necesitar en Mixpanel:

| Para ver | Filtro |
|----------|--------|
| Sólo sesiones moderadas | `is_moderated_session = true` |
| Un participante concreto | `participant_id = "P03"` |
| Una tanda | `session_id = "vj11-2026-09-10"` |
| Sólo visitantes reales del sitio comercial | `is_prototype = false` |
| Excluir pruebas de desarrollo | `current_domain ≠ "localhost"` |

**Cuidado con un residuo conocido:** en el proyecto hay eventos de las
verificaciones técnicas previas (`verificacion_de_entrega`,
`prueba_de_superficie`, `comprobacion_de_etiqueta`, `comprobacion_tras_navegar`
y algunos desde `localhost`). No existen en el código del sitio y no volverán a
aparecer; exclúyelos por nombre o por `current_domain`.

---

## 9. Lo que esta medición NO hace

Para que nadie construya una conclusión sobre algo que no se está midiendo:

- **No graba la pantalla ni el audio.** La grabación de sesión está desactivada
  a propósito.
- **No hay captura automática de la página.** Sólo se registran los eventos
  definidos de forma explícita; no se recoge el texto del DOM al pulsar.
- **No se guarda lo que la persona escribe** — ni en Capio ni en formularios.
  De Capio sólo sale a qué capacidad se orientó la consulta y su longitud.
- **No hay perfiles de usuario.** No se llama a `identify()`. `P03` es una
  etiqueta de sesión, no una identidad.
- **No hay datos del prototipo en sí.** Los leads, oportunidades y revisiones
  son sintéticos y sus identificadores no se envían.
