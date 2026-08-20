---
description: Agrega o revisa soporte de modo oscuro en la sección indicada, usando variables CSS del proyecto.
argument-hint: [sección — ej. hero, footer, .capio, #contacto-directo]
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npm run build:*)
---

Agrega o revisa el soporte de **modo oscuro** de la sección que te indique el usuario: **$ARGUMENTS**

## Objetivo

Implementar o corregir estilos de modo oscuro para la sección indicada, manteniendo coherencia con el design system de TransformX y sin romper el modo claro existente.

## Reglas obligatorias

1. **HTML semántico** — Sigue la estructura HTML semántica ya usada en el proyecto (secciones con `<section>`, encabezados con `<header>`, BEM en inglés para clases).

2. **CSS en `css/`** — Los estilos van en la carpeta `css/` como reglas nuevas o ajustes en el archivo que corresponda (`sections.css`, `layout.css`, `components.css`, etc.). **Nunca** uses estilos inline ni bloques `<style>` en HTML.

3. **TypeScript en `ts/`** — Si la sección necesita interactividad (p. ej. toggle manual de tema, persistencia en `localStorage`, detectar preferencia del sistema), el código va en `ts/` y se compila con `npm run build`. **Nunca** edites `js/` a mano.

4. **Variables CSS existentes** — Respeta y reutiliza los tokens definidos en `css/variables.css`:
   - Colores de marca: `--transform-blue`, `--transformation-cyan`, `--deep-navy`, `--navy`, etc.
   - Superficies y texto: `--surface-*`, `--text-primary`, `--text-secondary`, `--border`
   - Espaciado: `--space-*`
   - Breakpoints del proyecto: `640px`, `768px`, `992px`, `1024px`, `1200px`
   - Transiciones: `--transition-fast`, `--transition-base`, `--transition-slow`
   - No hardcodees colores, espaciados ni sombras nuevos si ya existe un token aplicable.

5. **Mobile-first** — Escribe primero el estilo base (mobile), luego los `@media (min-width: …)` para pantallas más grandes.

## Enfoque de implementación

### Preferencia del sistema (por defecto)
Usa `@media (prefers-color-scheme: dark)` para aplicar overrides de la sección sin cambiar HTML.

### Toggle manual (solo si el usuario lo pide o la sección lo requiere)
- Añade un control accesible (`button` con `aria-pressed` o `aria-checked`).
- Usa `data-theme="dark"` en `<html>` o una clase en el contenedor de la sección.
- Lógica en un archivo `.ts` nuevo o en `ts/animaciones.ts` si encaja con animaciones/UI global.
- Declara funciones cross-file en `ts/global.d.ts` si hace falta.
- Ejecuta `npm run build` al terminar.

### Variables para modo oscuro
- Si faltan tokens para dark mode, **añádelos primero en `css/variables.css`** dentro de `@media (prefers-color-scheme: dark) { :root { … } }` o bajo `[data-theme="dark"]`.
- Reutiliza la paleta oscura ya documentada en el proyecto (`--deep-navy`, `--navy`, `--navy-soft`, `--gradient-dark`) antes de inventar valores nuevos.

## Archivos a revisar antes de editar

1. `css/variables.css` — tokens disponibles
2. El HTML de la página donde vive la sección (`index.html`, `empresa.html`, `contacto.html`, `precios.html`)
3. El CSS que ya estiliza esa sección (`sections.css`, `layout.css`, etc.)
4. `CLAUDE.md` — convenciones del repo

## Checklist antes de terminar

- [ ] La sección indicada se ve correcta en **modo claro** (sin regresiones)
- [ ] La sección indicada se ve correcta en **modo oscuro** (`prefers-color-scheme: dark` y/o toggle, según aplique)
- [ ] Solo se usan variables CSS del proyecto (sin hex/rgba sueltos salvo dentro de `:root`)
- [ ] CSS mobile-first con `@media` progresivos
- [ ] Sin estilos inline ni `<style>` en HTML
- [ ] Si hubo cambios en `ts/`, `npm run build` compila sin errores con `strict: true`
- [ ] Contraste legible en textos, bordes y CTAs de la sección

## Entrega

Resume qué sección tocaste, qué archivo CSS (o TS) modificaste, qué variables usaste o añadiste, y cómo probar el resultado en el navegador.
