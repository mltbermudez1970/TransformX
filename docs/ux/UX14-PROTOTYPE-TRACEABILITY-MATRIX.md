# UX-14 — Matriz de trazabilidad del prototipo (PM-UX14-07)

Persona → Job → Journey → Task Flow → Pantalla → Contrato de interacción →
Requisito UX → Ruta / escenario del prototipo.

**Rama:** `feature/ux14-workspace-prototype`
**Artefactos cubiertos:** `TX-UX-014-PROT-001` (público) y `TX-UX-014-PROT-002`
(workspace autenticado).

---

## 0. Advertencia de procedencia — léela antes de usar esta matriz

Las columnas **Persona**, **Journey**, **Pantalla**, **Contrato de interacción** y
**Ruta/escenario** están tomadas de material controlado presente en el
repositorio: `UX-14 Resolution Package v1.0`, los tres addenda de ejecución
(PM-04, PM-05, PM-06), `prototype/fixtures/domain.ts` y
`prototype/scenarios/scenarios.ts`.

La columna **Job** está **derivada** del `expectedOutcome` de cada escenario
controlado y de la definición de LAB-001. **No** proviene de un documento de
personas o de jobs-to-be-done: UX-10, UX-11, UX-12 y UX-13 **no están presentes
en este repositorio** (`OD-01`, abierta desde PM-UX14-01). Cuando esos documentos
se incorporen, esta columna debe reconciliarse contra ellos y no al revés.

Nada de esta matriz debe leerse como especificación de negocio. Es el mapa de lo
que el prototipo **muestra**, no de lo que el sistema real **debe hacer**.

---

## 1. Personas representadas

| Persona (actor) | Rol aprobado (§7) | Ámbitos | Presente en |
|-----------------|-------------------|---------|-------------|
| **Visitante público** — sin sesión | — | — | PROT-001 completo |
| **Ana Ruiz** (`act-001`) | `SALES_REPRESENTATIVE` | `SELF` | S-01, S-02, S-03, S-07, S-09, S-10 |
| **Bruno Salas** (`act-002`) | `SALES_OPERATIONS_ANALYST` | `BIZCAP` | Fixtures de cola y configuración |
| **Elena Mora** (`act-003`) | `SALES_MANAGER` | `TEAM`, `BIZCAP` | S-06, S-08 |
| **Hugo Reyes** (`act-004`) | `HUMAN_REVIEWER` | `BIZCAP` | S-04, S-05 |

Los siete roles del Resolution Package existen en `domain.ts`; el prototipo
instancia cuatro. Los tres restantes no tienen escenario asignado — registrado
como riesgo **R-07**.

---

## 2. Matriz — PROT-001 · Public Experience

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Visitante | Entender qué es una BizCap antes de hablar con nadie | Public Discovery | Home → plataforma → BizCaps | Home | El copy no promete cuenta, trial ni adopción productiva | PM-02 §consolidación | `index.html` |
| Visitante | Saber si existe una capacidad para su problema | Public Discovery | Describir el problema → recibir orientación | Capio público | Discovery determinístico: mapea a LAB-001/002/003; **rechaza contexto privado**; nunca ejecuta | PM-02; `CLAUDE.md` | `index.html#capio` |
| Visitante | Comparar el catálogo controlado | Public Discovery | Catálogo → detalle | Catálogo BizCaps | Sólo LAB-001/002/003 como controladas; las futuras marcadas *Planned* | PM-02 | `bizcaps.html` |
| Visitante | Evaluar LAB-001 en concreto | Public Discovery | Detalle de capacidad | Detalle LAB-001 | Sin KPIs inventados ni integraciones como disponibles | PM-02 | `bizcap-lead-intake-qualification.html` |
| Visitante | Entender el modelo comercial | Public Discovery | Precios | Precios | Sin precios definitivos, Cap Credits incluidos ni SLA | `CLAUDE.md` (negocio) | `precios.html` |
| Visitante | Contactar | Public Discovery | Formulario | Contacto | Validación en cliente + confirmación simulada; sin envío real | PM-01 restricciones | `contacto.html` |
| Visitante | Anticipar el acceso autenticado | Frontera público ↔ prototipo | CTA → prototipo | Acceso / Adopción | `noindex`; no son producto | PM-02 | `acceso.html`, `adopcion.html` |

---

## 3. Matriz — PROT-002 · Authenticated Workspace

### 3.1 Identidad y sesión

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Cualquiera | Entrar a su espacio de trabajo | Sign In | Credenciales → segundo factor | AUTH-01, AUTH-09 | Error genérico: **no revela si la cuenta existe**; ninguna contraseña se compara con nada | PM-03 | `workspace/auth/` · **S-10** |
| Cualquiera | Recuperar el acceso | Auth recovery | Recuperar → restablecer | AUTH-02, AUTH-03, AUTH-10 | Capio **nunca** recibe contraseña, OTP ni códigos de recuperación | PM-03 | `workspace/auth/?screen=…` · **S-10** |
| Cualquiera | Elevar el nivel de aseguramiento | Step-up | Verificación adicional | AUTH-12 | MFA **no es una acción de negocio del Lead**; sin aseguramiento no hay acciones de negocio | PM-03; S-10 | `workspace/auth/` · **S-10** |
| Administrador | Alta de personas | Onboarding | Invitación → primer acceso | AUTH-06, AUTH-07, AUTH-08 | Sin IdP real; clave de setup declarada como no-secreto | PM-03 | `workspace/auth/` |

### 3.2 Trabajo diario

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Ana Ruiz | Saber qué le toca hacer ahora | Daily work | Entrar → ver obligaciones | APP-01, APP-02 | Obligaciones personales, cross-BizCap; **cada ítem trae su acción del fixture** | PM-04 | `workspace/`, `workspace/my-work/` · **S-01** |
| Bruno Salas | Triar el trabajo del equipo | Team triage | Cola → ítem | WORK-01 | En móvil la fila pasa a tarjeta **sin perder** obligación, estado, prioridad, lead ni acción | PM-04; PM-07 §B | `workspace/work-queue/` |
| Ana Ruiz | Ver un lead completo sin reconstruirlo | Lead review | Lista → detalle | LEAD-01/02/03 | Diez secciones en orden fijo; la UI **no deduce** acciones | PM-04 | `workspace/leads/?leadId=…` · **S-01** |
| Ana Ruiz | Pedir lo que falta sin adivinar qué falta | Missing information | Detectar → redactar → enviar | MI-01 | Requerido ≠ enriquecimiento; el borrador de IA es **editable** y **no** está en región live | PM-04 | `workspace/missing-information/?leadId=…` · **S-02** |
| Ana Ruiz | Decidir sobre información que contradice lo conocido | Conflicting update | Comparar → resolver por campo | MI-03 | Tres columnas separadas: hecho canónico · información recibida · interpretación de IA | PM-04 | `…&view=received` · **S-03** |
| Ana Ruiz | Entender por qué un lead califica o no | Qualification | Resumen → criterio | QUAL-01, QUAL-02 | QD-01…QD-05; **FAIL ≠ REVIEW**; el resultado global no se recalcula en cliente | PM-04 | `workspace/qualification/?leadId=…` |

### 3.3 Decisión humana y asignación

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Hugo Reyes | Resolver lo que la regla no puede resolver sola | Human review | Evidencia → resolución → justificación | REV-02 | `allowedResolutions` se pinta **tal cual llega**; una opción deshabilitada se muestra **con su motivo**, nunca se oculta; solicitar más información **no es** resolver | PM-05 | `workspace/reviews/?reviewId=HR-0045` · **S-05** |
| Hugo Reyes | Decidir si dos registros son la misma necesidad | Duplicate review | Comparar campo a campo → resolver | REV-03 | La pregunta es la **necesidad comercial**, no la empresa ni el contacto; la similitud de IA es **asesora**: sólo propone el candidato | PM-05 | `workspace/reviews/?reviewId=DR-0044` · **S-04** |
| Hugo Reyes | Resolver una excepción gobernada | Exception review | Evidencia → resolución → justificación | REV-04 | **Reutiliza REV-02** (`reviewType: "EXCEPTION_REVIEW"`): mismo contrato de decisión, no una superficie duplicada — ver **OD-17** | PM-05 | `workspace/reviews/?reviewId=…` |
| Elena Mora | Resolver que no hay responsable elegible | Assignment exception | Ver candidatos → resolver o anular política | ASN-01 | **Elegibilidad ≠ sugerencia de IA ≠ permiso**: tres objetos separados, nunca un score único; anular la política exige justificación | PM-05 | `workspace/assignment/?leadId=…` · **S-06** |
| Elena Mora | Auditar cómo se llegó a la asignación actual | Assignment history | Historial | ASN-02 | Eventos del fixture, sin recomposición local | PM-05 | `…&view=history` · **S-06** |

### 3.4 Readiness, conversión y estados de sistema

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Ana Ruiz | Saber por qué un lead calificado **todavía no** se convierte | Readiness | Ver condiciones → ir a resolverlas | OPP-01 | **Calificado ≠ listo**; RC-01…RC-08 completas, incluidas satisfechas y no aplicables; sin CTA si hay bloqueador | PM-06 | `workspace/opportunity/?leadId=LEAD-00047` · **S-07** |
| Elena Mora | Convertir con la consecuencia a la vista | Conversion | Confirmar → convertir | OPP-02 | Envío único + idempotencia; el diálogo **enuncia la consecuencia material** antes de enviar | PM-06 | `…&view=convert` · **S-08** |
| Elena Mora | Confirmar qué se creó y con qué evidencia | Handoff | Resultado → snapshot | OPP-03 | Snapshot **inmutable**; `OPP-YYYY-NNNNN` en estado `OPEN`; sin valor, probabilidad ni etapas; LAB-002 fuera de alcance | PM-06 | `…&view=handoff` |
| Ana Ruiz | Entender que alguien cambió algo mientras trabajaba | Concurrency | Intentar → conflicto → refrescar | SYS-06 | **Conflicto de negocio ≠ error técnico**: en línea, conservando el contexto | PM-06 | `…&revalidate=…` · **S-09** |
| Cualquiera | No perder trabajo por una caída | System states | Banner → reintento seguro | SYS-07 | Deshabilita los envíos **materiales**, no la navegación | PM-06 | `?offline=1` |
| Cualquiera | Llegar a un ítem ya resuelto sin ver un 404 | System states | Ruta obsoleta → reemplazo | SYS-08 | No reactiva la acción; ofrece rutas de vuelta | PM-06 | ruta de WorkItem resuelto |
| Cualquiera | Entender un fallo sin reintentar a ciegas | System states | Error → soporte | SYS-01…SYS-05 | SYS-05 es frontera de página, con referencia de soporte | PM-03, PM-06 | `workspace/system/?state=…` · **S-10** |

### 3.5 Capio dentro del workspace

| Persona | Job (derivado) | Journey | Task flow | Pantalla | Contrato de interacción | Requisito UX | Ruta / escenario |
|---------|----------------|---------|-----------|----------|-------------------------|--------------|------------------|
| Cualquiera con sesión | Preguntar por el contexto en el que está | Contextual guidance | Preguntar → orientación | Capio workspace | **Capio recomienda, `availableActions` autoriza**: declina ejecutar y nunca registra secretos | PM-03; PM-07 §D | `workspace/capio/` |

---

## 4. Cobertura escenario → flujo verificado en navegador

| Escenario | Verificado por | Evidencia |
|-----------|----------------|-----------|
| S-01 | `qa-scenarios`, `journey-p0`, `qa-keyboard` F3 | Actor Ana Ruiz, ruta My Work, estado limpio |
| S-02 | `qa-scenarios`, `qa-final` | MI-01 con requeridos ausentes y borrador editable |
| S-03 | `qa-scenarios`, `qa-final` | MI-03 con las tres columnas separadas |
| S-04 | `qa-scenarios`, `qa-final` | Comparación de duplicados → tarjetas en móvil |
| S-05 | `qa-scenarios`, `qa-keyboard` F4 | REV-03 resuelto sólo con teclado |
| S-06 | `qa-scenarios`, `qa-final` | Elegibilidad, sugerencia y permiso separados |
| S-07 | `qa-scenarios`, `qa-pm06`, `journey-p0` | Sin `CONVERT_TO_OPPORTUNITY`, con bloqueador |
| S-08 | `qa-scenarios`, `qa-pm06`, `qa-keyboard` F5 | Conversión por teclado → OPP-03 |
| S-09 | `qa-scenarios`, `qa-pm06` | `CONCURRENCY_CONFLICT` y refresco de acciones |
| S-10 | `qa-scenarios`, `qa-keyboard` F2 | AUTH-01 → AUTH-09 → workspace |

---

## 5. Huecos de trazabilidad conocidos

| # | Hueco | Consecuencia | Riesgo |
|---|-------|--------------|--------|
| 1 | UX-10…UX-13 ausentes del repositorio | La columna **Job** es derivada, no trazada | R-01 |
| 2 | Tres de los siete roles sin escenario | Sus permisos existen en `domain.ts` pero no se validan en pantalla | R-07 |
| 3 | LEAD-02 "My Leads" es una vista guardada (`LEADS_MY_OWNED`) dentro de LEAD-01, no una ruta propia | Decisión de implementación, no hueco de especificación; conviene confirmarla | R-08 |
| 4 | MI-02 no existe como pantalla en el prototipo | Hueco de numeración heredado del material fuente; no se inventó una pantalla para rellenarlo | R-08 |
| 5 | REV-01 no existe como pantalla; la bandeja de `workspace/reviews/` cubre la entrada | Ídem | R-08 |
| 6 | Dashboard, Configuration y Administration son marcadores de navegación sin contrato propio | Declarados como P04/P06 en el nav; no se validan en esta secuencia | R-09 |
