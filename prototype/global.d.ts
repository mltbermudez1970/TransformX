/**
 * Declaraciones para la capa de prototipo (scripts globales, no módulos ES).
 *
 * `tsconfig.prototype.json` sólo incluye `prototype/**` y `workspace/**`, así
 * que no ve `ts/global.d.ts`. Lo que se declare aquí debe corresponder a un
 * script que las páginas del workspace carguen de verdad: `tsc` no puede
 * detectar una referencia rota entre archivos globales, y ya ha causado
 * `ReferenceError` en tiempo de ejecución dos veces en este proyecto.
 *
 * `js/analytics.js` se carga en las 18 páginas de `workspace/`, así que
 * `trackEvent` está disponible en toda la capa de prototipo.
 */
declare function trackEvent(
  nombre: string,
  propiedades?: Record<string, string | number | boolean | null>
): void;
