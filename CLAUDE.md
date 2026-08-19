# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

TransformX is a static marketing landing site (no backend, no product behind it yet) for a fictional BCaaS ("Business Capabilities as a Service") SaaS. It's plain HTML/CSS/JS with a small TypeScript layer compiled to JS. Content is Spanish-only. See `PLAN.md` for the current content roadmap (missing pages, weak sections, planned additions).

## Commands

- `npm run build` — compiles `ts/**/*.ts` to `js/` via `tsc` (config in `tsconfig.json`).
- No test suite, linter, or dev server is configured. There is no `npm start`/`npm run dev` — open the HTML files directly in a browser (or serve the directory with any static file server) to preview.

## Architecture

### Two separate JS layers — don't confuse them

1. **`ts/*.ts` → `js/*.js`** (compiled, `rootDir: ts`, `outDir: js`): `animaciones.ts` handles nav-active-link highlighting, scroll fade-in animations (`data-animate` + `IntersectionObserver`), the mobile menu, and header scroll state. `contacto.ts` validates and "submits" the `.form-contacto` element specifically (the simple name/email/message form used in `contacto.html` and duplicated in `index.html`). `global.d.ts` declares cross-file function signatures (`mostrarFeedback`, `esHTMLElement`) since these are loaded as plain `<script>` tags, not ES modules — **always edit the `.ts` source and rebuild, never hand-edit `js/*.js` directly**, since it will be overwritten by the next `npm run build`.
2. **Inline `<script>` at the bottom of `index.html`**: a separate, self-contained IIFE that handles everything else on the homepage — the logo carousel, the hardcoded Capio chatbot (`capioResponses` keyword-matching, no real AI/backend), and the `demo-form`/`newsletter-form` submissions (client-side only, `setTimeout`-simulated, no network call). This duplicates some concerns already in `animaciones.js` (e.g. its own nav-scroll-spy `initNavigation()`) — the two systems coexist rather than share code.

### Pages share a hand-copied header/footer/nav

`index.html`, `empresa.html`, and `contacto.html` each carry their own full copy of the header, mobile-menu markup, and nav links (no templating/includes). When adding or changing nav items, legal links, or the header CTA, **update all HTML pages that exist**, not just one.

### Styling

CSS is split into 6 files under `css/`, loaded via 6 separate `<link>` tags (in this order) on every page — `variables.css` → `base.css` → `components.css` → `layout.css` → `sections.css` → `utilities.css`. The order matters (later files can override earlier ones) and must stay identical across all 3 HTML pages. BEM-style class names (`block__element--modifier`) throughout.

- `variables.css` — design tokens (color, spacing, type scale, gradients) as CSS custom properties on `:root`. Reuse these rather than hardcoding new values.
- `base.css` — reset, typography, `.container`, `.sr-only`, `.skip-link`.
- `components.css` — reusable UI atoms: buttons, badges, cards, form elements, toast, carousel dots, trust badges.
- `layout.css` — chrome shared by all pages: header, mobile menu, footer.
- `sections.css` — homepage-only content sections (hero, BizCaps, Capio chat widget, results, case study, final CTA, etc.) — **only `index.html` actually uses these classes**, but all 3 pages load the file for consistency; don't assume `empresa.html`/`contacto.html` are exempt from needing it if they later reuse a homepage section.
- `utilities.css` — `[data-animate]` scroll-reveal and `.visually-hidden-focusable`.

There is no bundler/build step for CSS — these are plain files loaded directly by the browser, so new pages must copy the same 6 `<link>` tags in the same order.

### Form pattern

All forms are simulated (no backend/API): validate client-side, show inline errors via `.form-error`/`aria-invalid`, then fake success (toast or `.form-feedback` message) after a `setTimeout`. There are two independent implementations of this pattern (the compiled `contacto.ts` for `.form-contacto`, and the inline script for `demo-form`/`newsletter-form`) — match whichever pattern the form you're touching already uses rather than introducing a third.

### SEO/meta

Each page repeats its own `<meta>`/Open Graph block. `sitemap.xml` uses `transformx.com` as the canonical domain, but `og:url`/`og:image` in the HTML still reference `transformingexperiences.com/TransformX/...` (a known inconsistency — see `PLAN.md`), and the referenced `img/og-image.png` doesn't exist in the repo.
