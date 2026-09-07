# TX-UX-014-PROT-002 — Fase 05: Decisión humana y asignación (PM-UX14-05)

**Insumos autoritativos:** UX-14 Resolution Package v1.0 · Addendum PM-04 v1.0 · Addendum PM-05 v1.0 (TX-UX-014-AMD-PM05-001)
**Rama:** `feature/ux14-workspace-prototype`
**Condición de parada alcanzada:** flujos Review / Duplicate / Assignment demostrables end-to-end en navegador real.

---

## 1. Superficies construidas

| Código | Superficie | Ruta |
|--------|-----------|------|
| — | Bandeja de revisiones | `workspace/reviews/` |
| REV-02 | Human Review | `workspace/reviews/?reviewId=HR-0045` |
| REV-03 | Duplicate Review | `workspace/reviews/?reviewId=DR-0044` |
| REV-04 | Exception Review | misma superficie que REV-02 (`reviewType: "EXCEPTION_REVIEW"`) |
| ASN-01 | Assignment Exception | `workspace/assignment/?leadId=LEAD-00046` |
| ASN-02 | Assignment History | `workspace/assignment/?leadId=…&view=history` |

REV-04 **reutiliza** REV-02 en lugar de duplicar superficie: una revisión de
excepción es una revisión humana gobernada con el mismo contrato de decisión.
Sólo cambian el código mostrado y el título.

---

## 2. Gate §13 del Addendum

| # | Criterio | Estado | Evidencia verificada en navegador |
|---|----------|--------|-----------------------------------|
| 1 | Contrato `AllowedResolution` compartido por REV-02, REV-03 y ASN-01 | ✅ | Un solo `PROTO_RESOLUTIONS` y un solo renderizador |
| 2 | REV-02 usa sólo el vocabulario aprobado | ✅ | Las 5 opciones renderizadas coinciden exactamente con `allowedResolutions` del fixture |
| 3 | REV-03 con campos de comparación + similitud IA asesora | ✅ | 11 campos requeridos; 22 marcas de similitud por campo |
| 4 | Candidato admite `LEAD` y `OPEN_OPPORTUNITY` | ✅ | Tipo modelado; `ASSOCIATE_WITH_EXISTING_OPPORTUNITY` deshabilitada con motivo por ser un lead |
| 5 | Sin score/umbral de decisión de duplicado en el frontend | ✅ | Sin agregación ni veredicto por porcentaje |
| 6 | ASN-01 con `autoAssignmentResult`, candidatos evaluados y sugerencia IA separada | ✅ | 3 candidatos, 18 criterios de política, bloque IA aparte |
| 7 | `assignment.override` de Elena Mora sin alterar elegibilidad | ✅ | Sigue `INELIGIBLE`; el permiso sólo habilita la acción |
| 8 | Override exige justificación + confirmación material | ✅ | Diálogo `c-dialog--destructive` con la consecuencia |
| 9 | Sin responsable elegible como resultado de negocio | ✅ | Texto explícito + `SEND_TO_SALES_OPS_QUEUE` como resolución gobernada |
| 10 | Contrato y vocabulario de ASN-02 implementados | ✅ | 7 tipos de evento |
| 11 | Historial conserva actor, cambios de dueño, motivo, versión de política y evidencia del override | ✅ | Registro añadido tras el override con criterios incumplidos |
| 12 | Sugerencias de IA distintas visual y semánticamente | ✅ | Bloque con borde punteado y etiqueta de autoridad asesora |
| 13–16 | Build · TypeScript · regresión PM-04 · regresión pública | ✅ | Ver §5 |

---

## 3. Cómo se hicieron cumplir los invariantes

**La pregunta domina la pantalla.** El `h1` de cada revisión es la Decision
Question, no el nombre de la superficie. El orden verificado por la suite es:
pregunta → por qué existe → contexto → regla/política → evidencia → asistencia
de IA → resolución → resultado autoritativo.

**Las resoluciones llegan del fixture y no se filtran.** El renderizador pinta
el array tal cual, en su orden. Una opción con `enabled: false` **se muestra
con su motivo** en vez de ocultarse: en REV-03, `ASSOCIATE_WITH_EXISTING_OPPORTUNITY`
aparece deshabilitada explicando que el candidato es un lead, no una oportunidad;
en ASN-01, `ASSIGN_SELECTED_ELIGIBLE_OWNER` aparece deshabilitada porque la
política no devolvió ningún candidato elegible. Esconderlas habría ocultado
información de gobernanza.

**La IA nunca decide.** Vive en su propio bloque, etiquetada
`authority: ADVISORY`, con el texto «No selecciona, no aprueba y no ejecuta
ninguna resolución». En ASN-01 el caso es deliberadamente incómodo: la IA
recomienda a Elena Mora, a quien la política marca **NO ELEGIBLE**. La tarjeta
del candidato enuncia el conflicto —«Sugerido por IA — pero la política lo marca
como no elegible. La sugerencia no cambia la elegibilidad»— en lugar de
resolverlo con una insignia única. Verificado que la clase de elegibilidad no
cambia por la recomendación.

**Coincidir no prueba duplicado.** Empresa y contacto llevan la marca «sólo
contexto». La similitud es por campo (MATCH / PARTIAL_MATCH / DIFFERENT /
UNKNOWN) y el frontend no la agrega: no existe umbral ni veredicto por
porcentaje. La regla completa se enuncia en la sección de política.

**Justificación antes de la confirmación.** Cuando `requiresRationale`, el
envío se bloquea **antes** de abrir el diálogo, con `aria-invalid` y foco al
campo. Verificado que el diálogo no llega a abrirse.

**La confirmación enuncia la consecuencia.** El diálogo muestra la resolución
elegida y su `consequence` textual. Para `destructive: true` usa
`c-dialog--destructive`.

**La resolución humana no sobrescribe.** Tras aplicar, el resultado declara que
la evaluación original y su evidencia se conservan intactas; la decisión humana
se registra aparte. En REV-02 se nombra el criterio original con su estado.

**Historial inmutable.** El override añade un registro nuevo con los criterios
de política incumplidos, la justificación y la versión de política. No edita
nada previo. La UI lo declara y explica que las sugerencias de IA no son eventos
de historial.

**Fallo automático ≠ error técnico.** Tanto ASN-01 como el evento
`ASSIGNMENT_FAILED_NO_ELIGIBLE_OWNER` en ASN-02 lo presentan como resultado de
negocio, con su ruta gobernada de salida.

**Mismo contrato en móvil.** Bajo 768 px la comparación de duplicados pasa de
tabla lado a lado a 11 tarjetas por campo, con la misma semántica y sin
desbordamiento.

---

## 4. Defectos encontrados y corregidos

| # | Defecto | Cómo apareció | Corrección |
|---|---------|---------------|-----------|
| 1 | Desbordamiento horizontal a 320 px en las tres superficies nuevas | Batería responsive | Dos causas: los `<code>` con identificadores largos (`STRATEGIC_EXCEPTION_REQUIRES_HUMAN_REVIEW`) no tienen puntos de corte → `overflow-wrap: anywhere`; y `<fieldset>` arrastra un `min-width` intrínseco que ignora el contenedor → `min-width: 0` en `.c-radio-group` |

La suite de aceptación pasó **31/31 a la primera**: no hubo defectos de lógica
de decisión ni de autoridad. Los contratos del addendum eran lo bastante
precisos como para no dejar margen de interpretación.

---

## 5. Validación ejecutada (Chrome headless vía CDP)

| Suite | Verificaciones | Resultado |
|-------|----------------|-----------|
| Aceptación PM-UX14-05 | 31 | **PASS** |
| Workspace: reflow (6 viewports × 23 superficies), contraste (2 temas), ARIA, touch, errores JS | 207 | **PASS** |
| Regresión PM-UX14-04 + E2E | 36 + 8 | **PASS** |
| Gate pre-PM-04 (OD-01/02/09) | 18 | **PASS** |
| Regresión PM-UX14-03 + E2E | 41 + 6 | **PASS** |
| Regresión pública: teclado 49 · contraste 22 · responsive 77 | 148 | **PASS** |
| Build · TypeScript · enlaces · fuga al sitio público | — | **PASS** · 0 rotos · 0 fugas |

---

## 6. Revisión de confusión de autoridad

| Riesgo | Cómo se evita |
|--------|---------------|
| Que la IA parezca decidir | Bloque propio, etiqueta de autoridad, texto de frontera, y un caso donde IA y política se contradicen visiblemente |
| Que el permiso parezca elegibilidad | `assignment.override` habilita la acción; la tarjeta de Elena Mora sigue `INELIGIBLE`. El contexto lo dice literalmente |
| Que un score decida el duplicado | Similitud sólo por campo, sin agregación ni umbral |
| Que la resolución humana borre lo anterior | El resultado declara la conservación; el historial es aditivo |
| Que un fallo de política parezca avería | Texto explícito y resolución gobernada de salida |
| Que la UI invente resoluciones | El conjunto se pinta tal cual; las deshabilitadas se muestran con motivo |

---

## 7. OPEN DECISIONS

**Nueva:**

| ID | Decisión abierta | Restricción vigente | Qué NO se asume | Disparador |
|----|------------------|---------------------|-----------------|------------|
| **OD-17** | Alcance propio de REV-04 Exception Review | Reutiliza REV-02 con `reviewType: "EXCEPTION_REVIEW"`, conforme al prompt maestro | Que no vaya a requerir superficie propia con contrato distinto | UX-10.4, antes de cualquier build productivo |

**Siguen abiertas:** OD-03, OD-05, OD-07, OD-08, OD-10…OD-16.

---

## 8. Acceptance Gate PM-UX14-05

| Criterio | Estado | Evidencia |
|----------|--------|-----------|
| La Decision Question domina | ✅ | Es el `h1`; orden del patrón verificado |
| AI Summary claramente no autoritativo | ✅ | Bloque separado, autoridad declarada, conflicto con política explícito |
| Resoluciones desde fixtures | ✅ | Coincidencia exacta con `allowedResolutions`; deshabilitadas con motivo |
| Semántica de duplicado correcta | ✅ | Sólo contexto en empresa/contacto; sin agregación de score; asociar ≠ duplicar |
| Política de asignación vs sugerencia IA distintas | ✅ | Objetos y bloques separados; la IA no altera elegibilidad |
| Confirmaciones materiales explican la consecuencia | ✅ | Diálogo con `consequence`; variante destructiva en override y confirmar duplicado |
| Build PASS | ✅ | exit 0 |

**Estado: COMPLETADO. Detenido antes de PM-UX14-06.**
