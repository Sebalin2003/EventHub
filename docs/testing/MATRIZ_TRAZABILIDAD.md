# Especificación y matriz de trazabilidad

Los 43 criterios Gherkin de [Clase15_GrupoEventHub_Testing.md](./Clase15_GrupoEventHub_Testing.md), sección 2.2, son la especificación de aceptación. Esta matriz enlaza cada criterio con un caso automatizado y el defecto asociado, si corresponde.

**Clasificación:** 21 de 43 criterios (48,8 %) son negativos. Se cuentan como negativos los criterios que esperan rechazo, error de autorización/validación, conflicto, bloqueo de seguridad o recuperación ante falla externa. Los casos de borde, alternativos y no funcionales no se suman como negativos solo por ser casos especiales.

**Vigencia de resultados:** los resultados registrados en el informe original corresponden a la evidencia previa del 12/11/2026. La última CI consultada, run [#46105294262](https://github.com/Sebalin2003/EventHub/actions/runs/46105294262), falló y no habilita a afirmar que todos los criterios pasaron en esa corrida. El caso TC-HU02-C3 sí se volvió a ejecutar dentro de las 307 pruebas unitarias locales del 28/11/2026.

| Criterio | Caso | Tipo | Evidencia automatizada | Resultado registrado | Defecto |
|---|---|---|---|---|---|
| HU-01-C1 | TC-HU01-C1 | Positivo | Playwright `critical-flows.spec.ts` A2 | Pasa (evidencia previa) | — |
| HU-01-C2 | TC-HU01-C2 | Alternativo | Playwright `critical-flows.spec.ts` A2 | Pasa (evidencia previa) | — |
| HU-01-C3 | TC-HU01-C3 | Negativo | `events.service.spec.ts` (404 Problem Details) | Pasa (evidencia previa) | — |
| HU-02-C1 | TC-HU02-C1 | Positivo | `inventory.service.spec.ts` y `critical-scenarios.e2e-spec.ts` | Pasa (evidencia previa) | — |
| HU-02-C2 | TC-HU02-C2 | Borde | `inventory.service.spec.ts` (expiración de HOLD) | Pasa (evidencia previa) | — |
| HU-02-C3 | TC-HU02-C3 | Negativo | `orders/stage3-integrity.spec.ts` (5 compradores, 2 HOLD, 3 conflictos) | Pasa localmente 28/11/2026 | EVH-102 |
| HU-03-C1 | TC-HU03-C1 | Positivo | `orders.service.spec.ts` (total y estado PENDING) | Pasa (evidencia previa) | — |
| HU-03-C2 | TC-HU03-C2 | Borde | `orders/stage3-integrity.spec.ts` (Idempotency-Key repetida) | Pasa (evidencia previa) | — |
| HU-03-C3 | TC-HU03-C3 | Negativo | `order-state.spec.ts` (reembolso inválido → 409) | Pasa (evidencia previa) | EVH-104 |
| HU-04-C1 | TC-HU04-C1 | Positivo | `payments.service.spec.ts` (respuesta aprobada) | Pasa (evidencia previa) | — |
| HU-04-C2 | TC-HU04-C2 | Negativo | `payments.service.spec.ts` (Business Fault) | Pasa (evidencia previa) | — |
| HU-04-C3 | TC-HU04-C3 | Negativo | `payments.service.spec.ts` (timeout de 5 s) | Pasa (evidencia previa) | EVH-101 |
| HU-04-C4 | TC-HU04-C4 | Negativo | `payments.service.spec.ts` (Circuit Breaker) | Pasa (evidencia previa) | EVH-101 |
| HU-04-C5 | TC-HU04-C5 | Negativo | `payments.service.spec.ts` (XXE) | Pasa (evidencia previa) | — |
| HU-05-C1 | TC-HU05-C1 | Positivo | `tickets.service.spec.ts` (emisión) | Pasa (evidencia previa) | — |
| HU-05-C2 | TC-HU05-C2 | Positivo | `tickets.service.spec.ts` (consulta por dueño) | Pasa (evidencia previa) | — |
| HU-05-C3 | TC-HU05-C3 | Negativo | `tickets.service.spec.ts` (BOLA → 403) | Pasa (evidencia previa) | EVH-105 |
| HU-05-C4 | TC-HU05-C4 | Positivo | Playwright `critical-flows.spec.ts` A3 | Pasa (evidencia previa) | — |
| HU-06-C1 | TC-HU06-C1 | Positivo | `tickets.service.spec.ts` y Playwright A6 | Pasa (evidencia previa) | — |
| HU-06-C2 | TC-HU06-C2 | Negativo | `check-in.controller.spec.ts` y Playwright A6 (segundo escaneo → 409) | Pasa (evidencia previa) | EVH-103 |
| HU-06-C3 | TC-HU06-C3 | Negativo | `check-in.controller.spec.ts` (404/409) | Pasa (evidencia previa) | — |
| HU-06-C4 | TC-HU06-C4 | Negativo | `check-in.controller.spec.ts` (evento ajeno → 403) | Pasa (evidencia previa) | — |
| HU-07-C1 | TC-HU07-C1 | Positivo | `notifications.service.spec.ts` (PROCESSED) | Pasa (evidencia previa) | — |
| HU-07-C2 | TC-HU07-C2 | Borde | `notifications.service.spec.ts` (DUPLICATE_SKIPPED) | Pasa (evidencia previa) | — |
| HU-07-C3 | TC-HU07-C3 | Negativo | `notifications.service.spec.ts` (mensaje inválido → DLQ) | Pasa (evidencia previa) | — |
| HU-07-C4 | TC-HU07-C4 | Negativo | `broker-resilience-evidence.mjs` y `broker-recovery.json` | Pasa (evidencia previa) | — |
| HU-08-C1 | TC-HU08-C1 | Positivo | `ai.service.spec.ts` (recomendación) | Pasa (evidencia previa) | — |
| HU-08-C2 | TC-HU08-C2 | Negativo | `ai.service.spec.ts` (guardrail temático) | Pasa (evidencia previa) | — |
| HU-08-C3 | TC-HU08-C3 | Negativo | `ai.service.spec.ts` (prompt injection/DAN) | Pasa (evidencia previa) | EVH-106 |
| HU-08-C4 | TC-HU08-C4 | Negativo | `ai.service.spec.ts` (fallback simulado) | Pasa (evidencia previa) | — |
| HU-09-C1 | TC-HU09-C1 | Positivo | Playwright A1, A3, A4 y A6 (perfiles demo) | Pasa (evidencia previa) | — |
| HU-09-C2 | TC-HU09-C2 | Positivo | Playwright `critical-flows.spec.ts` A1 | Pasa (evidencia previa) | — |
| HU-09-C3 | TC-HU09-C3 | Negativo | Playwright `critical-flows.spec.ts` A5 | Pasa (evidencia previa) | EVH-107 |
| HU-09-C4 | TC-HU09-C4 | Negativo | `identity.service.spec.ts` (401) | Pasa (evidencia previa) | — |
| HU-09-C5 | TC-HU09-C5 | Negativo | `security-resilience.spec.ts` (BFLA → 403) | Pasa (evidencia previa) | — |
| HU-10-C1 | TC-HU10-C1 | Positivo | Playwright `critical-flows.spec.ts` A4 | Pasa (evidencia previa) | — |
| HU-10-C2 | TC-HU10-C2 | Alternativo | `events.service.spec.ts` (publicación y notificación) | Pasa (evidencia previa) | — |
| HU-10-C3 | TC-HU10-C3 | Negativo | `events.service.spec.ts` (evento de otro organizador → 403) | Pasa (evidencia previa) | — |
| HU-10-C4 | TC-HU10-C4 | Negativo | `critical-scenarios.e2e-spec.ts` (ETag obsoleto → 412) | Pasa (evidencia previa) | — |
| HU-11-C1 | TC-HU11-C1 | No funcional | Playwright `responsive.spec.ts` (360/768/1280 px) | Pasa (evidencia previa) | — |
| HU-11-C2 | TC-HU11-C2 | No funcional | Playwright `responsive.spec.ts` (navegación móvil) | Pasa (evidencia previa) | — |
| HU-11-C3 | TC-HU11-C3 | No funcional | Playwright `a11y.spec.ts` (axe, 9 pantallas) | Pasa (evidencia previa) | — |
| HU-11-C4 | TC-HU11-C4 | No funcional | Lighthouse desktop y mobile | Pasa (evidencia previa) | — |

## Alcance del cierre de EVH-102

El caso TC-HU02-C3 vuelve a ejecutar cinco solicitudes concurrentes sobre una instancia de `InventoryService`: dos HOLD exitosos y tres `409 Conflict`. El test está en `apps/api/src/modules/orders/stage3-integrity.spec.ts`. Es una prueba unitaria de concurrencia en proceso; no demuestra por sí sola coordinación entre varias instancias de API. La transición de Jira no se puede confirmar ni cambiar desde este repositorio.
