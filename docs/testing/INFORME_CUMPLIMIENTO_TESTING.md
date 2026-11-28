# Informe de cumplimiento de criterios de testing

## Conclusión ejecutiva

**Estado revisado al 28/11/2026:** este informe contiene resultados históricos del 12/11 y evidencia local/CI más reciente. No se declara cumplimiento actual de los umbrales ni CI verde.

El último run consultado, [46105294262](https://github.com/Sebalin2003/EventHub/actions/runs/46105294262), finalizó con 2/6 jobs exitosos y 4/6 fallidos. Los jobs de mutación y smoke Docker pasaron; fallaron build/tests en validación del contrato OpenAPI, Playwright, k6 y ZAP activo autenticado. El run `46069841619`, asociado al checkout local `4f93684`, también falló.

En local, `pnpm --filter api test:cov` ejecutó 307/307 tests, pero el comando terminó con error por cobertura bajo los umbrales: 75,71 % de líneas y 66,34 % de ramas (requisito 80/70). `pnpm --filter @evenhub/web test` pasó 8/8. Por lo tanto, la etapa sigue parcial: faltan corregir fallos de CI y recuperar los umbrales de cobertura.

Persisten además los siguientes bloqueos: no se dispone de cuenta/token para confirmar el Quality Gate de Sonar; no hay acceso para verificar Teams o actualizar Jira; la prueba del docente y la demostración presencial están pendientes; faltan el nombre oficial del QA y el número de grupo para completar el PDF. EVH-108 continúa abierto según el registro técnico local; el estado de Jira no se verificó.

## Evidencia histórica (mediciones reportadas al 12/11/2026)

| Verificación | Resultado |
|---|---:|
| Tests unitarios/dominio/seguridad de API | 259 tests pasados |
| Tests del frontend | 8 tests pasados |
| Escenarios E2E de API (7 archivos: integración, contrato SOAP, seguridad HTTP y asistente de IA) | 76 tests pasados |
| Integración real contra PostgreSQL + RabbitMQ | 17 tests pasados |
| Contrato SOAP contra servidor real (WSDL, Faults y timeout) | 9 tests pasados |
| Cobertura de líneas API | 96,52% |
| Cobertura de ramas API | 84,60% |
| Mutation score (Stryker 10.1.1 + Vitest) | 76,23% (617 killed, 2 timeout, 184 survived, 9 no coverage) |
| Colección Postman ejecutada con Newman 6 | 96 requests / 176 aserciones, 0 fallos |
| Contratos OpenAPI 3.1 y WSDL | Validados contra el contrato publicado |
| Corridas consecutivas de la suite (unidad + E2E) | 3/3 sin fallos (220×3 y 28×3 en la medición previa; 259 y 76 en la final) |
| Carga k6 (50 VUs, 5 min, 3 endpoints) | p95 = 16,41 ms; error rate = 0,00%; 6.695 iteraciones |
| E2E Playwright contra el stack Docker (críticos + responsive + a11y) | 18 tests pasados |
| Responsive 360 / 768 / 1280 px | 3/3 PASA |
| Accesibilidad axe-core (9 pantallas, WCAG 2.2 AA) | 0 violaciones critical/serious |
| Lighthouse 13.6.0 Accessibility (desktop / mobile) | 100 / 100 |
| Build del backend | Correcto |
| Build del frontend | Correcto |
| Typecheck del frontend | Correcto |
| Oxlint | Correcto, sin warnings |
| Gitleaks v8.28.0 sobre todo el historial | Sin hallazgos (`no leaks found`) |
| CI histórico sobre `main` y tag `v1.0-testing` | Run `43040287065` se reportó verde el 11/11/2026; no representa el último estado: run `46105294262` del 28/11/2026 falló en 4/6 jobs |
| `docker compose up -d --build --wait` | 4 contenedores `healthy` |
| Smoke HTTP del flujo crítico | Login, evento, publicación, orden, pago, tickets y check-in OK |
| Caída y recuperación de RabbitMQ | Publicación HTTP 201 con broker detenido; reconexión automática y API `healthy` |
| Sesión exploratoria interna | 6 sondeos; EVH-107 corregido y EVH-108 documentado |

## Evidencia más reciente

| Fuente | Resultado |
|---|---|
| CI run `46105294262` | 2/6 jobs exitosos (mutación, smoke Docker); 4/6 fallidos (build/tests por contrato OpenAPI, Playwright, k6 y ZAP activo autenticado) |
| API local, `pnpm --filter api test:cov` | 307/307 tests pasaron; el comando falla el gate de cobertura: 75,71 % líneas, 66,34 % ramas, 74,34 % sentencias y 61,04 % funciones |
| Frontend local, `pnpm --filter @evenhub/web test` | 8/8 tests pasaron |
| Artefacto k6 del run `46105294262` | p95 16,405 ms, `http_req_failed` 0,00 %, 6.695 iteraciones y 20.087 checks aprobados. El job k6 terminó fallido; el resumen no basta para atribuir la causa |

El fallo de contrato OpenAPI detuvo el job build/tests antes de las suites, la cobertura y Newman; esas etapas no se consideran aprobadas por ese run.

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
| G1 | Evidencia local histórica | El repositorio registra `docker compose up -d --build --wait` y un smoke del flujo principal. Falta repetirlo en una máquina limpia para la evidencia formal. |
| G2 | Parcial / remoto no verificado | El tag `v1.0-testing` existe en este checkout. La publicación remota y relación exacta con el commit final no se verificaron en esta revisión. |
| G3 | No cumple en el estado consultado | Run `46105294262`: 2/6 jobs exitosos, 4/6 fallidos. Ver el resumen de evidencia más reciente al inicio del informe. |
| G4 | No verificable | Hay documentación en el repositorio, pero debe confirmarse la entrega del plan, matriz, informe, defectos y PDF en Teams. |
| G5 | No verificable | Debe comprobarse que cada caso y defecto exista en Jira con estado, responsable y vínculo a la HU. |
| G6 | Evidencia histórica | Gitleaks v8.28.0 sobre el historial reportó `no leaks found`, con allowlist justificada. La última CI no revalidó todos los pasos posteriores al fallo de contrato. |
| G7 | No verificable | Requiere demostrar en vivo el flujo principal de punta a punta. El flujo ya fue validado por Playwright y por smoke HTTP contra Docker. |
| G8 | Documento actualizado; firma pendiente | [DECLARACION_IA.md](../ia/DECLARACION_IA.md) identifica la revisión actual y distingue datos registrados de atribuciones no verificables. Resta que el equipo valide y firme la declaración y la defensa oral. |
| G9 | No verificable | Debe contrastarse el informe con Jira y la ejecución para asegurar que no existan defectos conocidos omitidos. |

El estado de publicación del tag requiere confirmación remota; el pipeline actual no está verde. Las condiciones externas siguen dependiendo de Teams, Jira y la defensa.

## Eje A: historias de usuario y pruebas E2E

Los resultados de esta sección son evidencia histórica; la CI actual falló en el job Playwright.

### Cumplimientos observados

- **11 HU** en el alcance (HU-01 a HU-11), priorizadas con **MOSCOW**.
- **43 criterios Gherkin** medibles: camino feliz, alternativo y error; las HU de integración suman falla del sistema externo.
- La matriz registra 43 criterios y los casos asociados; sus aprobaciones son evidencia histórica, no resultado de la CI más reciente.
- **6 escenarios críticos E2E** automatizados con Playwright y ejecutados contra el stack Docker real: login con JWT, catálogo/filtros, compra completa, alta y publicación de evento, rechazo de credenciales inválidas y check-in con doble uso.
- **Responsive verificado** a 360, 768 y 1280 px en inicio, explorar, detalle, login, dashboard y eventos del organizador, sin scroll horizontal.
- **Accesibilidad WCAG 2.2 AA**: axe-core sin violaciones `critical` ni `serious` en 9 pantallas; Lighthouse 13.6.0 Accessibility **100/100** en desktop y mobile. Evidencia en `docs/evidencias/lighthouse-home-*.json`.
- El job `playwright-e2e` corre la suite en el pipeline de GitHub Actions.
- **Manual de usuario** en [MANUAL_USUARIO.md](./MANUAL_USUARIO.md); falta la ejecución del docente.
- **Sesión exploratoria interna** ejecutada el 07/11/2026 (~10 minutos, 6 sondeos), documentada en [PRUEBA_EXPLORATORIA.md](./PRUEBA_EXPLORATORIA.md).

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

Las mediciones de cierre que siguen son históricas (12/11/2026); las cifras actuales se consignan al inicio del informe.

### Cumplimientos observados

- **Cobertura de líneas 96,52% y de ramas 84,60%** (94,43% de sentencias) sobre la capa de API, medidas con Vitest y `coverage-summary.json`. Los umbrales `lines: 80` y `branches: 70` están configurados en `apps/api/vitest.config.ts`, y el CI fija un baseline de 90% / 75% para detectar regresiones.
- **Mutation testing con score 76,23%** (mínimo 60%) mediante Stryker 10.1.1 con runner de Vitest, acotado a `orders/state`, `orders.service`, `payments.service` y `tickets.service`. Resultado: 617 mutantes killed, 2 timeout, 184 survived y 9 sin cobertura. El umbral `break: 60` está en `apps/api/stryker.conf.json`.
- **Integración PostgreSQL/RabbitMQ**: `apps/api/test/integration-real-deps.e2e-spec.ts` levanta el `AppModule` contra contenedores reales y cubre flujos HTTP y consumo de eventos. Los servicios externos SOAP y geocodificación pueden ser mocks del proyecto; no se describe el sistema completo como libre de mocks.
- **Colección Postman versionada** (`docs/postman/EventHub_API_Collection.json`) con **96 requests y 176 aserciones**, casos de éxito y error por endpoint, ejecutada con **Newman 6** contra la API real: 0 fallos. El pipeline la corre en el paso `Eje B - Postman/Newman`.
- **Contratos**: OpenAPI 3.1 generado desde `apps/api/src/openapi.ts` y publicado en `GET /openapi.json`; el archivo `docs/contracts/openapi.json` se exporta y el CI verifica que no haya diferencias. `test/contract.e2e-spec.ts` valida respuestas reales contra los schemas con Ajv 2020-12 y `test/soap-contract.e2e-spec.ts` valida el WSDL de pagos contra un servidor SOAP real.
- **Transiciones inválidas**: `refund`/`cancel` sobre estados no permitidos y doble check-in devuelven **409** con `application/problem+json`; ETag desactualizado devuelve **412**. Verificado en tests unitarios, E2E y en la colección Newman.
- **Suite estable**: tres corridas consecutivas completas (unidad con cobertura + E2E) terminaron sin fallos en la medición previa (220×3 unitarios y 28×3 E2E). La medición final de cierre es **259 unitarios** y **76 E2E**, todos verdes. La medición local previa de las tres corridas fue **2,44 minutos**. En el primer intento del tag con el Eje E (run `43263594420`) el CI detectó un fallo intermitente real: el seed de eventos hacía *check-then-insert* y dos suites E2E paralelas chocaban con la restricción única de `users.email` (`23505`). Se corrigió `event.seed.ts` para ignorar la colisión concurrente y se validó con tres corridas E2E consecutivas (76/76) y con el run `43265088091` del tag, en verde.
- El job `build-and-test` mantiene un timeout de 15 minutos y ejecuta Gitleaks, lint, typecheck, builds, contrato, 3 corridas de suite, baseline de cobertura y Newman. La mutación corre en un job paralelo con timeout de 20 minutos y `security-scan` ejecuta `pnpm audit --prod` y ZAP baseline. En el run `43040287065` (11/11/2026) el job principal tardó **1 min 49 s**, la mutación **5 min 44 s**, `security-scan` **2 min 17 s** y la duración total fue **12 min 15 s**.

### Resultados históricos frente a los umbrales (12/11/2026)

| Criterio | Mínimo | Resultado | Estado |
|---|---:|---:|---|
| Cobertura de líneas | 80% | 96,52% | Cumple |
| Cobertura de ramas | 70% | 84,60% | Cumple |
| Mutation score | 60% | 76,23% | Cumple |
| Quality Gate SonarQube/SonarCloud | Aprobado | No configurado (sin cuenta ni token) | No cumple |
| Integración con PostgreSQL real | Requerida | 17 tests de integración real contra el contenedor | Cumple |
| Integración con RabbitMQ real | Requerida | Publicación y consumo real con persistencia en `notifications` | Cumple |
| API con casos de éxito y error | Requerida | 96 requests / 176 aserciones con Newman, 0 fallos | Cumple |
| Pruebas de contrato OpenAPI/WSDL | Requerida | OpenAPI 3.1 + WSDL validados en E2E | Cumple |
| Suite sin flaky tests tres veces | Requerida | 220×3 y 28×3 sin fallos (medición previa); 259 unitarios y 76 E2E verdes en el cierre | Cumple |
| Pipeline menor o igual a 15 minutos | Requerida | Run completo en 12 min 15 s (`build-and-test` 1:49, `mutation-testing` 5:44, `security-scan` 2:17) | Cumple |
| Cobertura actual local | 80% líneas / 70% ramas | 75,71% / 66,34% (307 tests pasaron; gate falló) | No cumple |
| CI más reciente | 6/6 jobs exitosos | 2/6 exitosos; 4/6 fallidos | No cumple |

### Brecha pendiente

El **Quality Gate de SonarQube/SonarCloud** no se pudo verificar por falta de cuenta/token. Además, la cobertura local actual está bajo los umbrales configurados y el CI más reciente no completó la validación del contrato OpenAPI; sus pasos de suite, cobertura y Newman quedaron omitidos. Los resultados históricos de cobertura y pipeline no resuelven esos bloqueos actuales.

### Acciones necesarias

1. ~~Incorporar tests para las ramas no cubiertas.~~ Hecho: 96,52% líneas / 84,60% ramas.
2. ~~Configurar mutation testing sobre la capa de dominio.~~ Hecho: Stryker con score 76,23%.
3. Configurar el Quality Gate real de SonarQube/SonarCloud con token del repositorio.
4. ~~Agregar integración con PostgreSQL y RabbitMQ reales.~~ Hecho: suite dedicada de 17 tests.
5. ~~Ejecutar Newman en CI sobre la colección Postman.~~ Hecho: 96 requests en el pipeline.
6. ~~Agregar validación de contratos OpenAPI y WSDL.~~ Hecho.
7. ~~Ejecutar la suite tres veces y conservar la evidencia.~~ Hecho: 3/3 sin fallos.

## Eje C: integración y resiliencia

### Cumplimientos observados

La evidencia histórica cubre los diez criterios del Eje C. La CI más reciente no volvió a ejecutar todas estas pruebas, y la prueba de recuperación del broker no demuestra garantías universales de entrega:

| Criterio | Evidencia |
| :--- | :--- |
| SOAP válido, Fault de negocio y Fault técnico sin XML crudo | `test/soap-contract.e2e-spec.ts` levanta un servidor SOAP real con el WSDL del proyecto y verifica los tres caminos. `sanitizeSoapMessage` elimina etiquetas XML antes de responder al cliente. |
| Timeout de 5 s con reintento/circuit breaker y fallback | `SoapClientService.requestPayment` corta a los 5 s contra un servidor que demora 6 s; `PaymentsService` mantiene el Circuit Breaker (3 fallas) y devuelve fallback comunicado. |
| Caída y recuperación del broker en el escenario ensayado | `docs/evidencias/broker-recovery.json` y `apps/api/scripts/broker-resilience-evidence.mjs`: evento `PENDING` durante la interrupción y reintento observado al reiniciar el broker. `SENT` no prueba ACK: el publicador no usa publisher confirms. |
| Consumidor idempotente con mensaje duplicado | La suite real publica dos veces el mismo `id` y verifica que se persiste una sola notificación. |
| DLQ real con registro y reproceso | La suite real publica un mensaje inválido, el controlador hace `nack` sin requeue tras 3 intentos y el mensaje aparece en `notifications_dlq` con cabecera `x-death`. Luego se reprocesa con un destinatario válido y se persiste la notificación. |
| Rollback o compensación | Cuando el pago es rechazado, la orden pasa a `cancelled`, se libera el hold, no se emiten tickets y no se publica `order.paid`. |
| Idempotencia HTTP | `POST /orders` repetido con la misma `Idempotency-Key` devuelve el mismo recurso. |
| ETag desactualizado | `PATCH /orders/:id/pay` con `If-Match` viejo devuelve 412 Problem Details. |
| Problem Details RFC 9457 | Todas las respuestas de error usan `application/problem+json` con `type`, `title`, `status`, `detail` e `instance`. |
| Carga: 50 VUs, 5 min, 3 endpoints críticos | `docs/evidencias/k6-summary.json`, generado con `grafana/k6` sobre `GET /events`, `GET /events/:id` y `GET /inventory/:id`. |

Además, la topología ensayada usa colas durables, mensajes persistentes y ack/nack manual. El outbox persiste junto a la transacción de negocio y reintenta los mensajes que continúan `PENDING`; no se afirma entrega garantizada ni cero pérdida.

### Suite de integración real

La medición histórica reporta **17 tests** contra PostgreSQL y RabbitMQ. Además de los flujos HTTP (login, catálogo, orden, pago, tickets, check-in, favoritos, IA y OpenAPI), verifica outbox, duplicado, DLQ, reproceso y compensación de pago rechazado.

### Incumplimientos y límites

- La prueba de carga se ejecuta en el job `load-test-k6` del CI y también puede reproducirse localmente con el comando documentado en `docs/evidencias/README.md`.
- La caída del broker se demuestra con Docker local; no se simula una partición de red entre zonas de disponibilidad.
- El Quality Gate de SonarQube/SonarCloud sigue sin configurar por falta de cuenta/token y no se declara cumplido.

### Acciones necesarias

1. ~~Configurar colas durables, DLQ y estrategia de reproceso verificable.~~ Hecho con topología real y prueba de DLQ/reproceso.
2. ~~Probar rollback y compensación de operaciones fallidas.~~ Hecho en la suite real.
3. ~~Ejecutar k6 y guardar resultados de p95 y tasa de errores.~~ Hecho; ver `docs/evidencias/k6-summary.json` y el job `load-test-k6`.
4. Configurar el Quality Gate de SonarQube/SonarCloud (bloqueado por credenciales externas).

## Eje D: seguridad

Las mediciones de ZAP y dependencias que siguen son históricas. El job ZAP activo autenticado del run `46105294262` terminó fallido.

### Cumplimientos observados

La suite HTTP real `apps/api/test/security-http.e2e-spec.ts` (29 pruebas contra `AppModule`, PostgreSQL y RabbitMQ reales) cubre:

- JWT ausente, vencido, con firma alterada, `alg=none`, firmado con otro secreto y emitido por otro emisor (`iss` distinto): todos 401.
- BOLA/IDOR en órdenes y tickets: un usuario no accede a recursos de otro (403/404).
- BFLA: un comprador no accede a endpoints de organizador (403); un ADMIN pasa el guard de roles.
- Mass assignment: campos como `role`, `sold`, `status` o `organizerId` se rechazan con 400 o se ignoran.
- SQL injection, NoSQL injection y XSS en campos reales: no se ejecutan y no se reflejan.
- XXE en el pago SOAP: se rechaza con `XXE_INJECTION_REJECTED`.
- Fuerza bruta en login: 429 tras superar el límite.
- Errores sin stack trace, sin rutas de archivos, sin `TypeError` y sin mensajes de PostgreSQL.
- Id de orden no UUID: 400 (antes producía 500).
- Cabeceras: CSP estricta, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, COEP y CORP.
- CORS: origen permitido y origen rechazado según `cors.options.ts`.
- Cookies: la API no setea cookies de sesión (JWT en `Authorization`).
- Hash adaptativo con scrypt.

### Evidencia de herramientas

| Prueba | Resultado |
|---|---|
| OWASP ZAP baseline | 0 High, 0 Medium, 0 Low; 2 informativas justificadas (`docs/evidencias/zap/baseline.json`) |
| OWASP ZAP API scan autenticado (admin) | 0 High, 0 Medium, 0 Low; 3 informativas justificadas (`docs/evidencias/zap/api-auth.json`) |
| `pnpm audit --prod` | 0 vulnerabilidades (`docs/evidencias/security/pnpm-audit-prod.json`) |
| `pnpm audit` completo | 1 moderada dev-only (`minimatch`), justificada |
| Gitleaks sobre todo el historial | Sin hallazgos |
| TLS local con certificado autofirmado | 200 en `https://localhost:3002/` con HSTS (`docs/evidencias/security/tls-smoke.txt`) |
| Auditoría de logs | Emails enmascarados y payloads reducidos a ids; sin tokens ni stack traces |

Justificación individual de cada alerta y de la deuda de `minimatch`: `docs/evidencias/zap-justificaciones.md`.

### Incumplimientos o evidencias faltantes

| Prueba | Estado |
|---|---|
| TLS real en Docker Compose | Parcial: TLS directo opcional implementado y probado con certificado autofirmado; en producción se documenta terminación en proxy |
| Prueba del manual y exploratoria del docente | Pendiente de la clase |
| Quality Gate de SonarQube/SonarCloud | Omitido por decisión del equipo ante la falta de cuenta/token |
| `minimatch` moderado | Deuda dev-only; la corrección exige un salto de versión mayor incompatible con `@nestjs/cli` y Stryker |

### Acciones realizadas

1. Se agregaron 29 casos HTTP de seguridad con BOLA, BFLA, mass assignment, XSS, SQL/NoSQL, XXE, JWT de otro emisor y fuerza bruta.
2. Se ejecutaron ZAP baseline y API scan autenticado; se corrigieron los 500, la revelación de errores, el `Content-Type` de la raíz y las 3 Medium + 2 Low de cabeceras.
3. Se ejecutó `pnpm audit`; producción quedó en 0 y se documentó la única deuda dev-only.
4. Gitleaks ya se ejecutaba sobre todo el historial: sin hallazgos.
5. Se auditaron los logs: se enmascararon emails y se dejaron de registrar payloads completos.
6. Se documentaron TLS, cookies y configuración de producción en `docs/evidencias/zap-justificaciones.md`.
7. Se agregó el job `security-scan` al pipeline (auditoría de producción + ZAP baseline con verificación de 0 High).

## Eje E: inteligencia artificial

### Declaración formal

La declaración obligatoria está en [DECLARACION_IA.md](../ia/DECLARACION_IA.md). Distingue las herramientas/modelos declarados en registros previos de la evidencia verificable; un trailer Git no se toma como prueba de herramienta/modelo de ejecución. La firma y defensa oral de cada integrante corresponden a la instancia de evaluación.

Casos reales de IA incorrecta detectados y corregidos:

- El job de ZAP comparaba `riskcode === '3'` (string) contra un JSON que lo emite numérico; el run `43034561454` falló y se corrigió a `Number(riskcode) === 3`.
- El contenedor de ZAP no podía escribir el reporte en el volumen montado; se agregó `chmod -R a+rwx`.
- `playwright install --with-deps` falló por DNS del runner; se agregó el reintento sin dependencias apt.
- Un borrador generado con asistencia de IA afirmaba “37 E2E / 316 pruebas / 5 jobs”; la ejecución real mostró 76 E2E, 361 pruebas y 6 jobs. Se corrigieron los documentos y el PDF.

### Testing de la funcionalidad de IA integrada

`AiAdvisorService` es un simulador determinístico de asistente de eventos, sin proveedor externo ni API keys. La suite cubre:

- Recomendaciones dentro del dominio.
- Inyección directa de prompts, en español, jailbreak/DAN y **inyección indirecta** en datos que el sistema le pasa al modelo (`categoryPreference`).
- Protección del prompt del sistema: la respuesta bloqueada no filtra las instrucciones internas.
- Guardrails temáticos para consultas médicas y legales.
- Fuga de PII: emails y tarjetas enmascarados con `sanitizedPii=true`.
- Fallback determinístico activado mediante `simulateTimeout`; no hay proveedor cuya caída se esté manejando.
- Validación HTTP: 400 con `application/problem+json` sin stack y rechazo de propiedades no declaradas.

Evidencia: **14 pruebas unitarias** y **10 pruebas HTTP** verdes, más la suite completa de **259 unitarias y 76 E2E**. Artefactos en `docs/evidencias/ai/`.

### Plan y limitaciones

El plan para la entrega final (regresión visual asistida, datos sintéticos para k6, triage de defectos, red-team de prompts y evaluación de un proveedor LLM real) está en [DECLARACION_IA.md](../ia/DECLARACION_IA.md), con objetivo medible y riesgo controlado por cada incorporación. El componente actual es determinístico y sus guardrails por regex no sustituyen la defensa en profundidad de un LLM real.

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

## Acciones pendientes

1. Corregir la discrepancia del contrato OpenAPI y volver a ejecutar CI.
2. Diagnosticar por separado los fallos de Playwright, k6 y ZAP; los datos resumidos no determinan por sí solos sus causas.
3. Recuperar la cobertura API a los mínimos configurados de 80 % de líneas y 70 % de ramas.
4. Confirmar el Quality Gate de Sonar cuando se disponga de acceso.
5. Validar en Teams y Jira los entregables, historias, defectos, responsables y estados externos.
6. Ejecutar la prueba del manual y la exploratoria del docente; completar demo y defensa.
7. Completar el PDF al confirmar número de grupo y nombre oficial del QA.

## Veredicto al 28/11/2026

La etapa de testing y su documentación **no pueden declararse completamente conformes**. Hay evidencia histórica de pruebas, integración y escaneos, y la corrida actual de mutación y smoke Docker pasó. Sin embargo, la CI más reciente falló en 4 de 6 jobs y la cobertura local no alcanza los umbrales. Los estados de Jira/Teams y las actividades presenciales no se pudieron verificar desde el repositorio.
