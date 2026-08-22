# Guía de sustentación — TransformX

Documento de apoyo para la **presentación oral al panel** (Punto 6). Complementa el código y la documentación técnica del repositorio.

**Producción:** https://transformx.app  
**Repositorio:** https://github.com/mltbermudez1970/TransformX

---

## 1. Elevator pitch (30 segundos)

> TransformX es la landing comercial de una plataforma BCaaS — Business Capabilities as a Service. Ayuda a empresas a descubrir, adoptar y mejorar capacidades de negocio llamadas BizCaps — inventario, ventas, finanzas, operaciones — guiadas por Capio, un asesor simulado.
>
> Técnicamente es un sitio estático en HTML, CSS y TypeScript, desplegado en Cloudflare Pages. Está en etapa de **validación de mercado**: los formularios y el chat están simulados en el cliente, sin backend real todavía.

---

## 2. Guión sugerido (5–8 minutos)

### Bloque A — Producto y contexto (1 min)

- **Qué resuelve:** adopción modular de capacidades empresariales vs. ERP monolítico.
- **Quién es Capio:** asesor de IA *simulado* (respuestas por palabra clave).
- **Etapa actual:** landing de validación, no producto SaaS funcional.

### Bloque B — Arquitectura (1–2 min)

```
4 páginas HTML autocontenidas
       ↓
CSS modular mobile-first (7 archivos, tokens en :root)
       ↓
TypeScript (7 fuentes) → tsc → js/ (scripts globales)
       ↓
GitHub push → Cloudflare Pages → transformx.app
```

**Cifras para mencionar:**
- 4 HTML · 7 CSS · 7 TS
- `strict: true` + `noUncheckedIndexedAccess`
- Dominio canónico unificado: `transformx.app`

### Bloque C — Decisiones técnicas justificadas (2 min)

| Decisión | Justificación |
|----------|---------------|
| Estático sin framework | Costo cero, deploy simple, adecuado para pre-lanzamiento |
| TypeScript sin bundler | Tipado en compile-time; `<script defer>` suficiente |
| Design tokens CSS | Consistencia, dark mode con `[data-theme]`, sin Sass |
| Mobile-first | Breakpoints documentados (640/768/992/1024/1200) |
| `<dialog>` en menú móvil | Semántica nativa + accesibilidad |
| Carrusel patrón tabs ARIA | Teclado + lectores de pantalla |
| Formularios simulados | Validar interés sin invertir en backend aún |
| Herramientas agénticas | Auditoría por criterios → implementación por fases |

### Bloque D — Proceso de calidad (1 min)

Flujo aplicado en la preparación:

```
Criterios → Auditoría (% cumplimiento) → Preguntas → Aprobación → Fases 1–3 → Verificación
```

Documentado en `AGENT-WORKFLOW.md`. Verificación: `npm run build`, revisión en producción.

### Bloque E — Demo en vivo (1–2 min)

Abrir https://transformx.app y mostrar:

1. **Responsive:** redimensionar → header compacto (Entrar / Capio).
2. **Menú móvil:** `<dialog>` nativo.
3. **Tema:** toggle claro/oscuro persistente.
4. **Accesibilidad:** formulario contacto con errores por campo (`aria-invalid`).
5. **Precios:** grid 2 columnas en tablet → 3 en desktop.

---

## 3. Resumen de cumplimiento (6 puntos)

| # | Criterio | Estado |
|---|----------|--------|
| 1 | HTML semántico y estructura | ✅ Implementado (dialog, dl, article, nav landmarks) |
| 2 | Accesibilidad y ARIA | ✅ Tabs carrusel, teclado, formularios unificados |
| 3 | CSS responsive y design system | ~94 % (tokens, mobile-first, breakpoints) |
| 4 | TypeScript | ~96 % (strict, 7 archivos, sin any) |
| 5 | Herramientas agénticas | ~95 % (`AGENT-WORKFLOW.md`, iteración documentada) |
| 6 | Comunicación técnica | Esta guía |

---

## 4. Preguntas del panel — respuestas preparadas

### Producto

**¿Es un producto funcional?**  
No. Es landing de validación. Formularios simulan envío; Capio no es IA real.

**¿Por qué BCaaS?**  
Permite adoptar capacidades modulares (BizCaps) con bajo riesgo, en lugar de un sistema monolítico.

**¿Qué falta para producción real?**  
Backend, auth, envío real de leads, IA real en Capio, páginas legales — ver `PLAN.md`.

### HTML / semántica

**¿Por qué `<dialog>` y no un div?**  
Landmark nativo con `showModal()`, backdrop y mejor soporte de foco.

**¿Por qué `<dl>` en métricas?**  
Semántica correcta para pares etiqueta-valor; el diseño se mantiene con CSS flex + `order`.

**¿Por qué el header/footer se repite en cada HTML?**  
Sin templating en esta etapa; copy-paste manual documentado. Migración futura posible.

### Accesibilidad

**¿Cuándo usaron ARIA?**  
Solo donde HTML no alcanza: carrusel (tabs), estados dinámicos (`aria-invalid`, `aria-current`).

**¿Por qué quitaron `role="list"` en `<ul>`?**  
Redundante; `<ul>` ya comunica lista.

**¿Cómo navega el carrusel con teclado?**  
Flechas ← →, Home y End en los tabs del carrusel.

### CSS

**¿Qué es mobile-first aquí?**  
Estilos base para móvil; media queries `min-width` para pantallas mayores.

**¿Por qué custom properties y no Sass?**  
Sin build step para CSS; tokens en `:root` cubren design system y dark mode.

**¿Cómo funciona el dark mode?**  
`data-theme="light|dark"` en `<html>`, seteado por script inline + `theme.ts`; tokens se sobreescriben en `[data-theme="dark"]`.

### TypeScript

**¿Por qué scripts globales?**  
Coherente con sitio estático sin bundler; `global.d.ts` declara funciones compartidas.

**¿Qué aporta `strict`?**  
Errores en compile-time; ejemplo: narrowing tras `querySelector` nullable.

**¿Por qué separaron carousel, capio y forms-demo?**  
Eran ~205 LOC inline en `index.html`; modularización mejora tipado y mantenimiento.

### Infraestructura

**¿Dónde está desplegado?**  
Cloudflare Pages, integrado con GitHub; push a `main` → deploy automático.

**¿Por qué transformx.app y no .com?**  
`.app` es el dominio de producción activo; sitemap y robots alineados.

### Herramientas agénticas

**¿Cómo usó Claude Code vs. Cursor?**  
Claude Code: construcción inicial y comandos slash. Cursor: auditoría de sustentación e implementación por criterios.

**¿Cómo demuestra iteración?**  
Informes con % antes/después; correcciones post-`tsc`; decisiones del usuario documentadas en `AGENT-WORKFLOW.md`.

---

## 5. Limitaciones conocidas (decir con honestidad)

| Limitación | Respuesta preparada |
|------------|---------------------|
| Formularios no envían datos | Intencional en etapa de validación |
| Capio no es IA real | Bot por keywords; conectar LLM es roadmap |
| Chrome HTML duplicado | Sin templating; aceptable en pre-lanzamiento |
| `favicon.ico` pesa ~4MB | Issue conocido; exportación incorrecta |
| Newsletter en footer secundario | Handler solo en home; pendiente unificar |

---

## 6. Checklist pre-presentación

- [ ] Ensayar elevator pitch (30 s) y arquitectura (2 min)
- [ ] Tener abierto https://transformx.app para demo
- [ ] Conocer ubicación de `ts/contacto.ts`, `variables.css`, `carousel.ts`
- [ ] Recordar: **validación, no producto final**
- [ ] Revisar commits recientes: `git log --oneline -5`

---

## 7. Referencias rápidas

| Tema | Archivo |
|------|---------|
| Convenciones código | `CLAUDE.md` |
| Roadmap pendiente | `PLAN.md` |
| Flujo agéntico | `AGENT-WORKFLOW.md` |
| Instalación / build | `README.md` |
