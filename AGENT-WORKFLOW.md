# Flujo de trabajo con herramientas agénticas — TransformX

Este documento consolida **cómo se usaron las herramientas de programación agéntica** en TransformX, diferenciando etapas de planificación vs. implementación, y registrando la evidencia de iteración durante la preparación de sustentación (Puntos 1–5).

---

## 1. Herramientas utilizadas

| Herramienta | Rol | Cuándo se usó |
|-------------|-----|---------------|
| **Claude Code** | Desarrollo inicial, refactor, comandos slash reutilizables | Construcción base del sitio (CSS modular, `precios.html`, modo oscuro, `CLAUDE.md`) |
| **Cursor Agent** | Auditoría de sustentación + implementación guiada por criterios | Sesión de preparación: Puntos 1–4 (HTML, ARIA, CSS, TypeScript) |
| **Comandos slash** (`.claude/commands/`) | Automatizar revisiones y tareas repetibles | Accesibilidad, responsive, SEO, commits, formularios |
| **Artefactos de contexto** | Memoria persistente para agentes | `CLAUDE.md`, `PLAN.md`, este archivo |

---

## 2. Metodología por etapas

### Etapa A — Pensar / planificar (sin editar código)

1. El **usuario** comparte los criterios de aceptación oficiales de cada punto de sustentación.
2. El **agente audita** el repositorio (HTML, CSS, TS, convenciones) y entrega un **informe** con:
   - Porcentaje de cumplimiento estimado
   - Brechas concretas
   - Plan de adecuaciones en **Fases 1–3** (crítico → medio → refinamiento)
3. El agente formula **preguntas de decisión** cuando hay trade-offs (p. ej. ¿migrar menú a `<dialog>`? ¿tabs completos en carrusel?).
4. El **usuario aprueba** opciones antes de que el agente programe.

**Artefactos de planificación:** `PLAN.md` (roadmap de contenido), informes en chat, preguntas/resuestas documentadas en la sesión.

### Etapa B — Programar (generación de código)

Solo después de la aprobación explícita:

- Edición de HTML, CSS, TypeScript (`ts/` → `npm run build` → `js/`)
- Replicación manual de chrome compartido (header/footer) en las 4 páginas HTML
- Compilación TypeScript obligatoria tras cambios en `ts/`

**Regla del proyecto:** no editar `js/*.js` a mano; siempre compilar desde `ts/`.

### Etapa C — Revisar / iterar (crítica del output)

| Verificación | Comando / acción |
|--------------|------------------|
| Compilación TS | `npm run build` |
| Cumplimiento CSS | Scripts de auditoría + revisión de breakpoints/tokens |
| Servidor local | `npx serve .` o `python3 -m http.server` |
| Revisión humana | Usuario valida decisiones y pide ajustes por fase |

Si el compilador o la auditoría detectan errores, se **itera en el mismo punto** antes de avanzar al siguiente.

---

## 3. Diferencia: planificar vs. programar

| Planificar | Programar |
|------------|-----------|
| Leer `PLAN.md`, `CLAUDE.md` | Escribir/editar `.html`, `.css`, `.ts` |
| Informes de auditoría con % | Implementar fases aprobadas |
| Preguntas al usuario | `StrReplace`, nuevos archivos TS |
| Comandos `/check-*` (solo reporte) | Comandos `/nueva-*` (generan código) |
| Priorizar Fases 1–3 | `npm run build` + verificación |

---

## 4. Evidencia de iteración (sustentación)

Flujo repetido **por cada punto** (1–4):

```
Criterios → Auditoría (~X %) → Preguntas → Respuestas usuario → Fases 1–3 → Verificación (~Y %)
```

| Punto | Cumplimiento inicial | Decisiones clave del usuario | Cumplimiento final |
|-------|---------------------|------------------------------|-------------------|
| **1 HTML semántico** | ~75 % | Footer en todas las páginas; `<dialog>`; `<dl>` métricas; `<h3>` en FAQ | Fases 1–3 completas |
| **2 Accesibilidad / ARIA** | ~70 % | Tabs + teclado carrusel; quitar `role="list"`; unificar `contacto.ts` | 3 fases completas |
| **3 CSS responsive** | ~78 % | Header iconos; tokens EN; pricing 2-col @768px | ~94 % verificado |
| **4 TypeScript** | ~72 % | Dividir inline en 3 TS; `validators.ts` compartido; `strict` + `noUncheckedIndexedAccess` | ~96 % verificado |

### Ejemplos de revisión crítica post-generación

- **Menú móvil:** `div` simulado → `<dialog>` nativo + actualización de `ts/animaciones.ts`.
- **Carrusel:** patrón ARIA incompleto → `tablist`/`tab`/`tabpanel` + flechas ←→ Home End.
- **Tema:** eliminado fallback `prefers-color-scheme` en CSS; `data-theme` siempre presente vía script inline + `theme.ts`.
- **TypeScript:** ~205 LOC inline en `index.html` → `carousel.ts`, `capio.ts`, `forms-demo.ts`, `validators.ts`; corrección de 10 errores `tsc` por narrowing estricto.
- **Artefacto descartado:** `.claude/commands/Meta.md` (contenido de otro proyecto) excluido del repositorio.

---

## 5. Comandos slash disponibles

| Comando | Etapa | Propósito |
|---------|-------|-----------|
| `/check-accesibilidad` | Revisar | Alt, labels, contraste, headings |
| `/check-responsive` | Revisar | Mobile-first, breakpoints, overflow |
| `/check-seo` | Revisar | Meta tags, OG, sitemap |
| `/generar-commit` | Revisar | Propone mensajes Conventional Commits |
| `/resumen-proyecto` | Planificar | Estado vs. `PLAN.md` |
| `/nueva-pagina`, `/nueva-seccion` | Programar | Generar contenido nuevo |
| `/modo-oscuro`, `/limpiar-css` | Programar | Tareas de refactor |

---

## 6. Trazabilidad git

Los commits de sustentación consolidan las mejoras de los Puntos 1–4 en un solo changeset trazable. Para revisar:

```bash
git log --oneline -5
git show HEAD --stat
```

Convención de mensajes: **Conventional Commits** en español (`feat`, `fix`, `refactor`, `docs`).

---

## 7. Referencias

- Criterios y convenciones técnicas: `CLAUDE.md`
- Roadmap de contenido: `PLAN.md`
- Instalación y build: `README.md`
