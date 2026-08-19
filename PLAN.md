# Plan de contenido — TransformX

## Contexto

TransformX es hoy una **landing de validación** (sin backend/producto real detrás) que promueve una plataforma BCaaS ("Business Capabilities as a Service") con un asesor de IA ficticio, Capio. El sitio tiene 3 páginas (`index.html`, `empresa.html`, `contacto.html`) en HTML/CSS/JS estático, con formularios simulados (`setTimeout`, sin envío real a ningún backend).

Tras revisar todo el contenido existente, el journey actual tiene vacíos que debilitan la percepción de producto serio: falta pricing, no hay páginas legales pese a pedir consentimiento de datos, "Iniciar sesión" es un enlace muerto, las BizCaps no tienen página de detalle, y `empresa.html`/`contacto.html` están subdesarrolladas o duplicadas.

**Decisiones que enmarcan este plan:**
- **Etapa:** landing de validación, sin producto/backend real todavía.
- **Alcance:** solo contenido y páginas nuevas — nada de backend, auth real, ni envío real de formularios. Cualquier formulario nuevo debe seguir el mismo patrón simulado que ya usa `js/contacto.js` / el script inline de `index.html` (validación cliente + confirmación visual, sin persistencia real).
- **Prioridad de negocio:** comunicar un modelo self-serve con **pricing visible** (el "signup" seguirá siendo simulado por ahora, no una cuenta real).
- **Dominio canónico:** `transformx.com` (ya usado en `sitemap.xml`; hay que alinear `og:url`/`og:image` en las 3 páginas, que hoy apuntan a `transformingexperiences.com/TransformX/...`).

---

## Diagnóstico

### Páginas/flujos que faltan para un journey completo

1. **Pricing** — no existe página de precios. Bloqueador de conversión típico en SaaS.
2. **Login/Signup real** — "Iniciar sesión" apunta a un `<div class="sr-only">` vacío (`#iniciar-sesion`). No hay registro.
3. **Detalle de BizCaps** — las 5 tarjetas ("Ver detalles →") solo hacen scroll al chat de Capio, no profundizan en la capacidad.
4. **Legales** — no hay Política de Privacidad ni Términos de Servicio, pese a pedir "aceptar tratamiento de datos" en el formulario de demo.
5. **FAQ** — ausente; clave para resolver objeciones en venta B2B/IA.
6. **Casos de éxito / contenido de credibilidad** — solo un testimonio hardcodeado (Innova Foods).
7. **Página 404** — no existe.

### Secciones existentes débiles o incompletas

- **`empresa.html`** es un stub: un solo párrafo genérico, sin equipo, misión/visión, valores ni historia.
- **`contacto.html` duplica** exactamente la sección `#contacto-directo` de `index.html` — mismo formulario en dos lugares sin razón clara.
- **Formularios simulados** (`demo-form`, `newsletter-form`, `form-contacto`): no envían datos a ningún backend real — es una maqueta de captación de leads.
- **Chat de Capio** es 100% hardcodeado (`if/else` por palabra clave en el script inline), no IA real.
- **Footer minimalista**: solo 2 columnas de enlaces, sin legales ni redes sociales.
- **Inconsistencia de dominio**: sitemap usa `transformx.com`, pero `og:url`/`og:image` usan `transformingexperiences.com/TransformX/...`; además la carpeta `img/` referenciada no existe (imagen social rota).
- **`favicon.ico` pesa 4MB** — mal generado/exportado (nota técnica, fuera de alcance de este plan de contenido).
- **Locales declarados sin contenido real**: `<meta>` declara `en_US`/`en_ES`/`en_MX` como alternates, pero todo el sitio está solo en español.

---

## Páginas nuevas a crear (mismo patrón HTML/CSS/JS estático existente)

| # | Página | Descripción | Prioridad |
|---|--------|-------------|-----------|
| 1 | `precios.html` | Planes/tiers (Starter / Business / Enterprise) con CTA "Comenzar gratis" hacia el registro simulado. Gap más directo respecto a la prioridad de negocio (self-serve). | Alta |
| 2 | `registro.html` | Formulario de signup simulado, reutilizando el patrón de validación (`isValidEmail`/`isCorporate`) ya usado en `index.html`. Reemplaza el enlace muerto `#iniciar-sesion`. Copy explícito de "acceso anticipado" dado que no hay backend aún. | Alta |
| 3 | `bizcaps.html` | Detalle ampliado de las 5 BizCaps (Inventario, Ventas, Servicio al Cliente, Finanzas, Operaciones): descripción, beneficios, impacto estimado. Los links "Ver detalles →" de `index.html` (líneas ~215-219) deben apuntar aquí. | Media-alta |
| 4 | `preguntas-frecuentes.html` | FAQ para objeciones típicas (seguridad de datos, tiempo de implementación, precisión de estimaciones, etc.). | Media |
| 5 | `privacidad.html` y `terminos.html` | Legales mínimos, necesarios porque el formulario de demo ya pide aceptar tratamiento de datos sin política enlazada. | Media (requisito de cumplimiento) |

## Secciones existentes a mejorar

- **`empresa.html`**: ampliar con misión/visión, valores y opcionalmente timeline/equipo — reforzar la narrativa "personas primero, IA responsable" ya prometida en el `<meta description>`.
- **Duplicación `contacto.html` vs. `index.html#contacto-directo`**: mantener `contacto.html` como página dedicada y eliminar (o convertir en CTA corto hacia `contacto.html`) la sección duplicada de `index.html`.
- **Footer**: agregar enlaces a `privacidad.html`, `terminos.html`, `precios.html`, `preguntas-frecuentes.html`.
- **Consistencia de dominio/OG tags**: actualizar `og:url`/`og:image` en las 3 páginas a `transformx.com`; resolver la imagen social rota (`TransformX/img/og-image.png` no existe).
- **Header/nav**: agregar enlace a Precios y conectar "Iniciar sesión" a `registro.html` en las 3 páginas (comparten el mismo bloque de nav).

## Explícitamente fuera de alcance

- Backend real, autenticación real, envío real de emails/leads.
- IA real para Capio (sigue siendo chat hardcodeado).
- Internacionalización real (los `og:locale` alternates se dejan como están).
- Corrección del `favicon.ico` de 4MB (nota técnica, no de contenido).

## Orden sugerido de ejecución

1. Precios (`precios.html`)
2. Registro / Iniciar sesión (`registro.html`)
3. Detalle de BizCaps (`bizcaps.html`)
4. Legales (`privacidad.html`, `terminos.html`)
5. Empresa ampliada (`empresa.html`)
6. Limpieza: eliminar duplicación de contacto, actualizar footer y OG tags/dominio

## Verificación

- Cada página nueva debe compartir el mismo header/footer/nav y los mismos 6 `<link>` de `css/` (`variables.css`, `base.css`, `components.css`, `layout.css`, `sections.css`, `utilities.css`, en ese orden) que las páginas existentes.
- Confirmar que todos los enlaces nuevos (nav, footer, tarjetas de BizCaps, botón "Iniciar sesión") apuntan a destinos reales, sin anchors muertos.
- Revisar en navegador (desktop y mobile) que el menú móvil incluya los nuevos enlaces.
- Confirmar que `sitemap.xml` se actualiza para incluir las páginas nuevas una vez creadas.
