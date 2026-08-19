# TransformX

Landing page de **TransformX**, plataforma SaaS de adopción de capacidades de negocio (Business Capabilities as a Service — BCaaS) impulsada por IA. Producto de Transforming Experiences Inc.

Repositorio: https://github.com/mltbermudez1970/TransformX

## Descripción

Sitio estático (HTML/CSS/JS) con una capa TypeScript compilada a JS. Actualmente es una landing de validación: no tiene backend ni autenticación real; los formularios (demo, newsletter, contacto) están simulados en el cliente.

Páginas:
- `index.html` — landing principal
- `empresa.html` — sobre la empresa
- `contacto.html` — contacto

## Requisitos

- [Node.js](https://nodejs.org/) y npm (solo se usan para compilar TypeScript)

## Instalación

```bash
git clone https://github.com/mltbermudez1970/TransformX.git
cd TransformX
npm install
```

## Uso

### Compilar TypeScript a JavaScript

Los archivos fuente en `ts/` se compilan a `js/` (usado por las páginas HTML):

```bash
npm run build
```

### Previsualizar el sitio

No hay servidor de desarrollo configurado. Puedes abrir los archivos HTML directamente en el navegador, o servir el directorio con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

## Estructura del proyecto

```
├── index.html          # Landing principal
├── empresa.html        # Página de empresa
├── contacto.html        # Página de contacto
├── css/                 # Estilos (módulos: variables, base, components, layout, sections, utilities)
├── ts/                  # Fuente TypeScript (editar aquí)
├── js/                  # JS compilado (generado, no editar a mano)
├── icon/, favicon.*     # Íconos del sitio
├── sitemap.xml, robots.txt
├── CLAUDE.md            # Guía para trabajar en el repo con Claude Code
└── PLAN.md              # Roadmap de contenido (páginas y secciones pendientes)
```

Para más detalle sobre la arquitectura del código, ver [CLAUDE.md](CLAUDE.md). Para el plan de contenido pendiente, ver [PLAN.md](PLAN.md).
