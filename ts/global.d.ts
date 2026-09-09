/** Funciones globales compartidas entre scripts (sin módulos ES). */
declare function esEmailValido(valor: string): boolean;
declare function esEmailCorporativo(email: string): boolean;

/**
 * Analítica (`ts/analytics.ts`). Silenciosa si Mixpanel no cargó, así que se
 * puede llamar sin comprobar nada. Nunca pasar contenido tecleado por la
 * persona: sólo qué ocurrió y con qué resultado.
 */
declare function trackEvent(
  nombre: string,
  propiedades?: Record<string, string | number | boolean | null>
): void;
