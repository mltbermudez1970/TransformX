# prototype/ — capa de simulación de TX-UX-014-PROT-002

Capa **exclusiva del prototipo autenticado**. Nada de lo que vive aquí es código
de dominio ni de runtime productivo, y nada de aquí se carga en las páginas
comerciales públicas (`index.html`, `bizcaps.html`, `precios.html`, `empresa.html`,
`contacto.html`, `privacidad.html`, `terminos.html`).

## Contenido

| Carpeta | Qué contiene | Qué NO contiene |
|---------|--------------|-----------------|
| `fixtures/` | Datos sintéticos reutilizables (organización, actores, leads, fixture sets) | Estados de dominio, `availableActions`, resultados de Qualification/Readiness |
| `scenarios/` | Catálogo determinístico S-01…S-10 | Reglas que deriven acciones o transiciones |
| `mock-api/` | Simulación de la *forma* de la respuesta y su latencia | Motor de reglas, BDR, state machine, permisos |
| `state/` | Modo prototipo + coordinación escenario/fixture/navegación | Réplica de la state machine productiva |

## Frontera prototipo ≠ producción

El prototipo **no reconstruye** reglas BDR, state machines, Qualification,
Opportunity Readiness, permisos ni `availableActions`. Esos valores se consumen
como **dato precargado por escenario**, cuya fuente de verdad son UX-10…UX-14.
Si un valor no está en la fuente UX, se registra como `OPEN DECISION` en
`docs/ux/UX14-PROT-002-SCAFFOLD-REPORT.md` — no se inventa.

## Escenarios

Cada escenario declara: `scenarioId`, `title`, `actor`, `initialRoute`,
`fixtureSet`, `expectedAvailableActions`, `expectedOutcome`.

Hoy `expectedAvailableActions` está vacío en los diez escenarios y marcado
`specStatus: "PENDING_SOURCE"` porque UX-10…UX-14 no están en este repositorio
(OD-01). PM-UX14-04/05/06 los completará desde la fuente UX.

## Desenlaces del mock-api

`success` · `validation_error` · `business_conflict` · `stale` ·
`permission_denied` · `recoverable_error`

`loading` se modela como **fase** (`ProtoPhase`), no como desenlace terminal, y
se notifica vía `onPhaseChange`.

Los desenlaces son **determinísticos**: los fija el escenario activo, nunca el azar.

## Modo prototipo

Se activa por cualquiera de estas vías:

1. `?prototype=true` en cualquier página que cargue `js/prototype/state/prototype-mode.js`
2. Cualquier ruta bajo `/workspace/` (todas son prototipo por definición)
3. Flag en `sessionStorage` (`transformx-prototype-mode`), que preserva el modo al navegar

Fuera de modo prototipo, los accesos marcados con `[data-prototype-entry]`
permanecen ocultos (`hidden` en el HTML) y el flujo público no cambia.

## Convenciones

- **Prefijo `PROTO_` / `proto*`** en todo símbolo global, para no colisionar con
  los scripts globales del sitio (`ts/*.ts` también son scripts, no módulos ES).
- **Datos como constantes TS**, no JSON + `fetch`: el prototipo debe funcionar
  abriendo el HTML directamente desde el sistema de archivos.
- **Datos 100 % sintéticos**: ninguna empresa, persona, correo o teléfono real.
  Los correos usan el TLD reservado `.test`.

## Build

Los `.ts` de esta carpeta se compilan con un proyecto TypeScript separado:

```bash
npm run build             # sitio (ts/ → js/) + prototipo (prototype/ → js/prototype/)
npm run build:prototype   # sólo el prototipo (tsc -p tsconfig.prototype.json)
```

La salida vive en `js/prototype/**` y **no se edita a mano**, igual que el resto de `js/`.
