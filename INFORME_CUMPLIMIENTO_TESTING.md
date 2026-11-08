# Informe de cumplimiento de criterios de testing

## Conclusión ejecutiva

La aplicación cuenta con una base de pruebas automatizadas funcional: las suites existentes pasan, el backend y el frontend compilan y hay cobertura de varios flujos críticos de negocio, resiliencia, seguridad e inteligencia artificial.

El **Eje A está cerrado técnicamente** y el **Eje B quedó resuelto en todos los criterios verificables desde el repositorio**: cobertura por encima del umbral, mutation score superior al mínimo, integración con PostgreSQL y RabbitMQ reales, contratos OpenAPI/WSDL validados, colección Postman ejecutada con Newman y tres corridas consecutivas sin flaky. Quedan brechas que dependen de evidencia externa o de infraestructura que no está disponible en este entorno:

- **Quality Gate de SonarQube/SonarCloud**: no hay cuenta ni token, por lo que no se declara cumplido.
- ~~No existe el tag `v1.0-testing`.~~ Tag creado y publicado sobre el commit final (07/11/2026), reubicado para incluir el Eje A y el Eje B.
- La prueba del manual de usuario y la prueba exploratoria del docente siguen pendientes de ejecución en clase.
- **EVH-108** (recarga en checkout, severidad Menor) queda abierto con workaround documentado.
- Varias condiciones dependen de evidencias externas: Teams, Jira y demostración presencial.
- El pipeline completo en GitHub Actions debe volver a ejecutarse sobre el tag final para confirmar en el runner la duración total y el verde con los nuevos pasos; la medición local de las tres corridas de suite fue de 2,44 minutos.

## Evidencia ejecutada

| Verificación | Resultado |
|---|---:|
| Tests unitarios/dominio/seguridad de API | 220 tests pasados |
| Tests del frontend | 8 tests pasados |
| Escenarios críticos de integración E2E de API (5 archivos) | 28 tests pasados |
| Integración real contra PostgreSQL + RabbitMQ | 13 tests pasados |
| Cobertura de líneas API | 96,21% |
| Cobertura de ramas API | 85,34% |
| Mutation score (Stryker 10.1.1 + Vitest) | 73,92% (460 killed, 2 timeout, 153 survived, 10 no coverage) |
| Colección Postman ejecutada con Newman 6 | 96 requests / 176 aserciones, 0 fallos |
| Contratos OpenAPI 3.1 y WSDL | Validados contra el contrato publicado |
| Corridas consecutivas de la suite (unidad + E2E) | 3/3 sin fallos (220×3 y 28×3) |
| E2E Playwright contra el stack Docker (críticos + responsive + a11y) | 18 tests pasados |
| Responsive 360 / 768 / 1280 px | 3/3 PASA |
| Accesibilidad axe-core (9 pantallas, WCAG 2.2 AA) | 0 violaciones critical/serious |
| Lighthouse 13.6.0 Accessibility (desktop / mobile) | 100 / 100 |
| Build del backend | Correcto |
| Build del frontend | Correcto |
| Typecheck del frontend | Correcto |
| Oxlint | Correcto, con 3 warnings |
| Gitleaks v8.28.0 sobre todo el historial | Sin hallazgos (`no leaks found`) |
| CI sobre el tag `v1.0-testing` (incluye job `playwright-e2e`) | En verde: [workflow CI](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml) |
| `docker compose up -d --build --wait` | 4 contenedores `healthy` |
| Smoke HTTP del flujo crítico | Login, evento, publicación, orden, pago, tickets y check-in OK |
| Caída y recuperación de RabbitMQ | Publicación HTTP 201 con broker detenido; reconexión automática y API `healthy` |
| Sesión exploratoria interna | 6 sondeos; EVH-107 corregido y EVH-108 documentado |

Los comandos ejecutados fueron:

```bash
docker compose up -d --build --wait
pnpm --filter api test
pnpm --filter @evenhub/web test
pnpm --filter api test:e2e
pnpm --filter api test:cov
pnpm --filter api test:mutation
pnpm --filter api openapi:export
npx --yes newman@6 run docs/postman/EventHub_API_Collection.json --reporters cli
pnpm --filter @evenhub/web exec playwright test
pnpm --filter api build
pnpm --filter @evenhub/web build
pnpm --filter @evenhub/web typecheck
pnpm --filter api lint
npx --yes lighthouse http://localhost:5173/ --only-categories=accessibility --output=json --output-path=docs/evidencias/lighthouse-home-desktop.json
docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:v8.28.0 detect --source /repo --config /repo/.gitleaks.toml --no-banner --redact --verbose
```

## Evaluación de admisibilidad G1-G9

| Código | Estado | Evidencia y acción necesaria |
|---|---|---|
| G1 | Cumple (local) | `docker compose up -d --build --wait` levanta PostgreSQL, RabbitMQ, API y web; los cuatro quedan `healthy`. Smoke HTTP OK: `/events`, `/`, proxy `/api/events` y flujo completo de login/compra/check-in. Falta repetirlo en una máquina limpia para la evidencia formal. |
| G2 | Cumple | Tag `v1.0-testing` creado y publicado sobre el commit final (incluido el Eje A) antes del 10/11/2026 13:30. |
| G3 | Cumple | CI en verde sobre el tag: build, lint, typecheck, contrato OpenAPI sincronizado, 3 corridas de suite, cobertura, Newman, Gitleaks, job Docker con smoke HTTP, job `playwright-e2e` y job de mutation testing. [workflow CI](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml). |
| G4 | No verificable | Hay documentación en el repositorio, pero debe confirmarse la entrega del plan, matriz, informe, defectos y PDF en Teams. |
| G5 | No verificable | Debe comprobarse que cada caso y defecto exista en Jira con estado, responsable y vínculo a la HU. |
| G6 | Cumple | Gitleaks v8.28.0 sobre todo el historial: `no leaks found`, con allowlist justificada para dos falsos positivos (placeholder de badge y fixture JWT `alg=none`). El escaneo corre en CI sobre todo el historial. |
| G7 | No verificable | Requiere demostrar en vivo el flujo principal de punta a punta. El flujo ya fue validado por Playwright y por smoke HTTP contra Docker. |
| G8 | Parcial | Debe completarse la declaración de IA con herramientas, versiones, prompts, decisiones aceptadas/descartadas y validación manual. |
| G9 | No verificable | Debe contrastarse el informe con Jira y la ejecución para asegurar que no existan defectos conocidos omitidos. |

El tag y el pipeline ya están resueltos; el resto de las condiciones eliminatorias sigue dependiendo de evidencias externas y de la defensa.

## Eje A: historias de usuario y pruebas E2E

### Cumplimientos observados

- **11 HU** en el alcance (HU-01 a HU-11), priorizadas con **MOSCOW**.
- **43 criterios Gherkin** medibles: camino feliz, alternativo y error; las HU de integración suman falla del sistema externo.
- **43 de 43 criterios verificados y pasados (100%)**; ningún criterio de una HU **Must** falla al cierre.
- **6 escenarios críticos E2E** automatizados con Playwright y ejecutados contra el stack Docker real: login con JWT, catálogo/filtros, compra completa, alta y publicación de evento, rechazo de credenciales inválidas y check-in con doble uso.
- **Responsive verificado** a 360, 768 y 1280 px en inicio, explorar, detalle, login, dashboard y eventos del organizador, sin scroll horizontal.
- **Accesibilidad WCAG 2.2 AA**: axe-core sin violaciones `critical` ni `serious` en 9 pantallas; Lighthouse 13.6.0 Accessibility **100/100** en desktop y mobile. Evidencia en `docs/evidencias/lighthouse-home-*.json`.
- El job `playwright-e2e` corre la suite en el pipeline de GitHub Actions.
- **Manual de usuario** completo en `docs/MANUAL_USUARIO.md` (tareas A1–A6, O1–O3, S1–S3, AD1 y T1–T4).
- **Sesión exploratoria interna** ejecutada el 07/11/2026 (~10 minutos, 6 sondeos), documentada en `docs/PRUEBA_EXPLORATORIA.md`.

La evidencia principal se encuentra en:

- `apps/web/e2e/critical-flows.spec.ts`
- `apps/web/e2e/responsive.spec.ts`
- `apps/web/e2e/a11y.spec.ts`
- `apps/web/playwright.config.ts`
- `apps/api/test/critical-scenarios.e2e-spec.ts`
- `apps/api/test/security-resilience.spec.ts`

### Brechas y pendientes

- La **prueba del manual de usuario** a cargo del docente todavía no se ejecutó.
- La **prueba exploratoria del docente** (hasta 10 minutos) todavía no se ejecutó; solo existe la sesión interna del equipo.
- **EVH-108** (recarga en el checkout pierde el contexto, severidad Menor) queda abierto con workaround.
- Los 6 escenarios de `apps/api/test/critical-scenarios.e2e-spec.ts` siguen instanciando servicios con repositorios en memoria; el E2E real lo aporta Playwright contra Docker.

### Acciones necesarias

1. ~~Agregar pruebas E2E reales contra HTTP, base y navegador.~~ Hecho con Playwright contra el stack Docker.
2. ~~Completar la matriz HU → criterio → caso → test → resultado.~~ Hecha: 43/43.
3. ~~Ejecutar y documentar responsive y accesibilidad.~~ Hecho: 360/768/1280 px, axe y Lighthouse 100/100.
4. Ejecutar en clase la prueba del manual y la prueba exploratoria del docente y registrar el resultado.
5. Cerrar EVH-108 en una próxima iteración.

## Eje B: código y pruebas automatizadas

### Cumplimientos observados

- **Cobertura de líneas 96,21% y de ramas 85,34%** sobre la capa de API, medidas con Vitest y `coverage-summary.json`. Los umbrales `lines: 80` y `branches: 70` están configurados en `apps/api/vitest.config.ts`, por lo que una regresión rompe el build.
- **Mutation testing con score 73,92%** (mínimo 60%) mediante Stryker 10.1.1 con runner de Vitest, acotado a `orders/state`, `orders.service`, `payments.service` y `tickets.service`. Resultado: 460 mutantes killed, 2 timeout, 153 survived y 10 sin cobertura. El umbral `break: 60` está en `apps/api/stryker.conf.json`.
- **Integración real con PostgreSQL y RabbitMQ**: `apps/api/test/integration-real-deps.e2e-spec.ts` levanta el `AppModule` completo contra los contenedores reales (sin mocks) y cubre login, catálogo, orden con idempotencia, ETag, `409`/`412`, pago, emisión de tickets, check-in, favoritos, IA, `/openapi.json` y consumo real de `event.created`/`order.paid` persistido en `notifications`.
- **Colección Postman versionada** (`docs/postman/EventHub_API_Collection.json`) con **96 requests y 176 aserciones**, casos de éxito y error por endpoint, ejecutada con **Newman 6** contra la API real: 0 fallos. El pipeline la corre en el paso `Eje B - Postman/Newman`.
- **Contratos**: OpenAPI 3.1 generado desde `apps/api/src/openapi.ts` y publicado en `GET /openapi.json`; el archivo `docs/contracts/openapi.json` se exporta y el CI verifica que no haya diferencias. `test/contract.e2e-spec.ts` valida respuestas reales contra los schemas con Ajv 2020-12 y `test/soap-contract.e2e-spec.ts` valida el WSDL de pagos contra un servidor SOAP real.
- **Transiciones inválidas**: `refund`/`cancel` sobre estados no permitidos y doble check-in devuelven **409** con `application/problem+json`; ETag desactualizado devuelve **412**. Verificado en tests unitarios, E2E y en la colección Newman.
- **Suite estable**: tres corridas consecutivas completas (unidad con cobertura + E2E) terminaron sin fallos: **220×3 tests unitarios** y **28×3 tests E2E**. Medición local: **2,44 minutos** para las tres corridas.
- El job `build-and-test` mantiene un timeout de 15 minutos y ejecuta Gitleaks, lint, typecheck, builds, contrato, 3 corridas de suite, baseline de cobertura y Newman. La mutación corre en un job paralelo con timeout de 20 minutos.

### Incumplimientos

| Criterio | Mínimo | Resultado | Estado |
|---|---:|---:|---|
| Cobertura de líneas | 80% | 96,21% | Cumple |
| Cobertura de ramas | 70% | 85,34% | Cumple |
| Mutation score | 60% | 73,92% | Cumple |
| Quality Gate SonarQube/SonarCloud | Aprobado | No configurado (sin cuenta ni token) | No cumple |
| Integración con PostgreSQL real | Requerida | 13 tests de integración real contra el contenedor | Cumple |
| Integración con RabbitMQ real | Requerida | Publicación y consumo real con persistencia en `notifications` | Cumple |
| API con casos de éxito y error | Requerida | 96 requests / 176 aserciones con Newman, 0 fallos | Cumple |
| Pruebas de contrato OpenAPI/WSDL | Requerida | OpenAPI 3.1 + WSDL validados en E2E | Cumple |
| Suite sin flaky tests tres veces | Requerida | 220×3 y 28×3 sin fallos | Cumple |
| Pipeline menor o igual a 15 minutos | Requerida | `build-and-test` con timeout de 15 min; 3 corridas locales en 2,44 min. La duración total debe confirmarse en el runner | Parcial |

### Brecha pendiente

El único criterio del Eje B que no puede declararse cumplido desde este entorno es el **Quality Gate de SonarQube/SonarCloud**: no hay cuenta, organización ni token disponibles. El resto de la evidencia es reproducible con los comandos documentados y queda registrada como artefacto del pipeline (`api-testing-evidence`, `mutation-report`).

### Acciones necesarias

1. ~~Incorporar tests para las ramas no cubiertas.~~ Hecho: 96,21% líneas / 85,34% ramas.
2. ~~Configurar mutation testing sobre la capa de dominio.~~ Hecho: Stryker con score 73,92%.
3. Configurar el Quality Gate real de SonarQube/SonarCloud con token del repositorio.
4. ~~Agregar integración con PostgreSQL y RabbitMQ reales.~~ Hecho: suite dedicada de 13 tests.
5. ~~Ejecutar Newman en CI sobre la colección Postman.~~ Hecho: 96 requests en el pipeline.
6. ~~Agregar validación de contratos OpenAPI y WSDL.~~ Hecho.
7. ~~Ejecutar la suite tres veces y conservar la evidencia.~~ Hecho: 3/3 sin fallos.

## Eje C: integración y resiliencia

### Cumplimientos observados

Las pruebas de pagos verifican:

- Pago exitoso.
- Fault de negocio por fondos insuficientes.
- Tarjeta vencida.
- Fault técnico.
- Timeout de cinco segundos.
- Circuit breaker después de tres fallas.
- Rechazo de payloads con `DOCTYPE` y entidades externas.

Las pruebas de notificaciones verifican:

- Idempotencia lógica de mensajes.
- Reintentos.
- Enrutamiento lógico a DLQ.

También se prueba el formato Problem Details y la idempotencia lógica de órdenes.

### Cumplimientos observados en el stack real

- **Suite de integración dedicada (`integration-real-deps.e2e-spec.ts`)**: 13 tests contra PostgreSQL y RabbitMQ reales. Verifica idempotencia de órdenes por HTTP con `Idempotency-Key`, ETag y `412`, transiciones inválidas `409`, pago con emisión y persistencia de tickets, check-in con `409` al segundo escaneo, favoritos, IA, contrato OpenAPI y consumo real de mensajes con persistencia en la tabla `notifications`.
- **Caída y recuperación de RabbitMQ (07/11/2026):** con el broker detenido, la publicación de un evento respondió **HTTP 201** y la API siguió `healthy`; al reiniciar el broker, el log pasó de `Disconnected from RMQ` a `Successfully connected to RMQ broker`.
- **Playwright contra Docker:** los flujos de compra y check-in atraviesan navegador, API y PostgreSQL reales.
- **Smoke HTTP:** login, creación y publicación de evento, orden, pago, emisión de tickets y check-in.

### Incumplimientos

No se demostró todavía mediante pruebas dedicadas que:

- Los mensajes no se pierdan durante una caída del broker.
- El consumidor descarte duplicados sobre el broker real (la idempotencia se prueba a nivel de servicio y el consumo real se prueba con un mensaje nuevo).
- La DLQ sea una cola real de RabbitMQ con reproceso.
- Exista rollback transaccional completo.
- El timeout sea provocado por un proveedor externo real o mock externo.
- La prueba de carga haya sido ejecutada.

El script `load-tests/k6-load-test.js` define correctamente 50 usuarios concurrentes durante cinco minutos y los umbrales `p95 < 500 ms` y errores menores al 1%, pero falta ejecutar el script y adjuntar el reporte.

### Acciones necesarias

1. ~~Probar apagado y recuperación del broker.~~ Hecho: publicación 201 con broker caído y reconexión automática.
2. ~~Crear una suite de integración dedicada con PostgreSQL y RabbitMQ reales.~~ Hecho: 13 tests contra contenedores reales.
3. Configurar colas durables, DLQ y estrategia de reproceso verificable.
4. Probar rollback y compensación de operaciones fallidas.
5. ~~Crear pruebas HTTP para idempotencia, ETag y Problem Details.~~ Hecho en la suite de integración real.
6. Ejecutar k6 y guardar resultados de p95 y tasa de errores.

## Eje D: seguridad

### Cumplimientos observados

Las pruebas existentes cubren:

- JWT ausente.
- JWT vencido.
- Firma alterada.
- `alg=none`.
- BFLA.
- Rate limiting con `429`.
- Problem Details sin stack trace.
- BOLA en tickets.
- Hash adaptativo con scrypt.
- Validación con `whitelist` y `forbidNonWhitelisted`.
- Headers como CSP, HSTS y `X-Content-Type-Options`.

### Incumplimientos o evidencias faltantes

| Prueba | Estado |
|---|---|
| JWT de otro emisor | Falta test específico |
| Mass assignment vía endpoint real | Parcial |
| SQL/NoSQL/XSS en todos los campos | Sin suite completa |
| XXE mediante integración real | Solo probado en el servicio |
| OWASP ZAP baseline y autenticado | Sin reporte |
| CVE con Trivy/Snyk/Dependency-Check | Sin reporte |
| Cookies Secure/HttpOnly/SameSite | No verificable |
| TLS real | No configurado en Docker Compose |
| Logs sin PII, tokens ni datos sensibles | Falta auditoría formal |
| CORS y headers mediante prueba HTTP | Implementación presente, falta evidencia automatizada |

### Acciones necesarias

1. Agregar casos HTTP para mass assignment, XSS, BOLA, BFLA y JWT de otro emisor.
2. Ejecutar ZAP baseline y scan autenticado.
3. Ejecutar Trivy, Snyk o Dependency-Check.
4. ~~Ejecutar Gitleaks o TruffleHog sobre todo el historial.~~ Ejecutado con Gitleaks v8.28.0: sin hallazgos.
5. Revisar logs para evitar PII, tokens y secretos.
6. Documentar TLS, cookies y configuración de producción.

## Eje E: inteligencia artificial

### Cumplimientos observados

`apps/api/src/modules/ai/ai.service.spec.ts` prueba:

- Recomendaciones dentro del dominio.
- Inyección directa de prompts.
- Jailbreak/DAN mode.
- Consultas médicas fuera de dominio.
- Pedidos de recetas.
- Fallback ante timeout o caída del proveedor.

### Evidencia faltante

La declaración de uso de IA debe incluir, para cada herramienta:

- Nombre y versión.
- Objetivo de uso.
- Prompt representativo.
- Resultado aceptado.
- Resultado corregido o descartado.
- Verificación manual.
- Un caso donde la IA haya propuesto un test o diagnóstico incorrecto y cómo fue detectado.

Por lo tanto, el Eje E está parcialmente cubierto por código y tests, pero no puede considerarse completamente demostrado sin la declaración formal.

## Defecto detectado durante la validación de G1 (corregido)

El smoke HTTP del flujo crítico contra Docker reveló que un segundo check-in devolvía **HTTP 201** en lugar de **409 Conflict**. El servicio `TicketsService.checkIn` ya detectaba `ENTRADA_YA_UTILIZADA`, pero `CheckInController.scan` devolvía ese resultado dentro de un cuerpo exitoso sin lanzar una excepción.

Corrección aplicada en `apps/api/src/modules/check-in/check-in.controller.ts`:

- `ENTRADA_YA_UTILIZADA` → `409 Conflict`.
- `ENTRADA_EVENTO_INCORRECTO` → `409 Conflict`.
- `ENTRADA_INVALIDA` → `404 Not Found`.

Verificado con `check-in.controller.spec.ts` (5 pruebas nuevas) y con el smoke real: `DOBLE CHECK-IN: HTTP 409 (esperado 409)`.

## Defectos detectados durante la validación (Eje A)

### EVH-107 — Mensaje de error de login engañoso (corregido)

Ante una contraseña incorrecta, la interfaz mostraba «Usuario no encontrado». El backend responde con un mensaje genérico de credenciales inválidas, por lo que la UI agregaba información incorrecta. Se reemplazó por «Credenciales inválidas» / «Invalid credentials» (`invalidCredentials` en `i18n.tsx`). El escenario Playwright **A5** verifica el mensaje y que no se persista el token.

### EVH-108 — La recarga en el checkout pierde el contexto (abierto, Menor)

Al recargar la página en el paso **Medio de pago**, la aplicación vuelve al inicio; la reserva sigue activa hasta su TTL de 5 minutos. No hay pérdida de datos ni órdenes duplicadas. Workaround: reabrir el evento y reiniciar la compra, esperar el vencimiento del HOLD o usar **Restablecer demo**. Plan: persistir vista y `holdId` en `sessionStorage` y restaurar el paso al recargar.

## Plan priorizado para resolver los criterios

### Prioridad bloqueante

1. ~~Crear y publicar el tag `v1.0-testing`.~~ Hecho sobre el commit final e incluyendo el Eje A.
2. ~~Ejecutar el pipeline sobre ese tag.~~ En verde, incluido el job `playwright-e2e`: [workflow CI](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml).
3. ~~Validar `docker compose up --build` desde un entorno limpio.~~ Validado localmente con `--wait` y smoke HTTP, y en el job Docker del CI.
4. Completar y entregar en Teams la documentación requerida (plan, matriz, informe, defectos y PDF).
5. Actualizar Jira con casos, defectos, responsables y vínculos a HU.
6. ~~Ejecutar Gitleaks sobre todo el historial.~~ Ejecutado: sin hallazgos.
7. Ejecutar en clase la prueba del manual y la prueba exploratoria del docente.

### Prioridad alta

1. ~~Elevar la cobertura a mínimo 80% de líneas y 70% de ramas.~~ Hecho: 96,21% / 85,34%.
2. ~~Agregar mutation testing con score mínimo de 60%.~~ Hecho: 73,92%.
3. ~~Ejecutar Newman en CI.~~ Hecho: 96 requests / 176 aserciones.
4. ~~Crear pruebas de integración dedicadas con PostgreSQL y RabbitMQ reales.~~ Hecho: 13 tests.
5. Configurar el Quality Gate de SonarQube/SonarCloud.
6. Ejecutar k6 y documentar el reporte.
7. Ejecutar ZAP y un scanner de dependencias.

### Prioridad media

1. ~~Agregar contratos OpenAPI/WSDL.~~ Hecho y verificados en CI.
2. Agregar pruebas HTTP de seguridad y resiliencia.
3. ~~Ejecutar la suite tres veces para verificar ausencia de flaky tests.~~ Hecho: 3/3 sin fallos.
4. ~~Validar responsive y accesibilidad.~~ Validado: 360/768/1280 px, axe 9/9 y Lighthouse 100/100.
5. Completar la declaración de IA.
6. Cerrar EVH-108.

## Veredicto final

La clasificación actual es:

| Área | Estado |
|---|---|
| Eje A - HU, criterios y E2E | Cumple el alcance técnico; pendiente la prueba del manual y la exploratoria del docente |
| Eje B - código y pruebas | Cumple todos los criterios salvo el Quality Gate de Sonar (sin cuenta/token) |
| Eje C - integración y resiliencia | Parcial (integración real DB/broker, idempotencia y ETag HTTP verificados; faltan DLQ real, caída sin pérdida y k6) |
| Eje D - seguridad | Parcial |
| Eje E - IA | Parcialmente cumplido |
| G1-G9 | G1, G2, G3 y G6 cumplidos; G4, G5, G7, G8 y G9 pendientes de evidencia externa |

La aplicación tiene una base sólida, el Eje A y el Eje B están cerrados a nivel técnico y el pipeline está preparado para ejecutar toda la evidencia. **No debe presentarse como plenamente conforme hasta completar las evidencias externas (Teams, Jira, Sonar, demo y prueba del manual) y confirmar el verde del pipeline sobre el tag final.**
