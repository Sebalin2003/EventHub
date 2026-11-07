# Informe de cumplimiento de criterios de testing

## Conclusión ejecutiva

La aplicación cuenta con una base de pruebas automatizadas funcional: las suites existentes pasan, el backend y el frontend compilan y hay cobertura de varios flujos críticos de negocio, resiliencia, seguridad e inteligencia artificial.

Sin embargo, **la aplicación no cumple todavía con la totalidad de los criterios definidos en `criterios_de_testing.md`**. Los principales incumplimientos son:

- ~~No existe el tag `v1.0-testing`.~~ Tag creado y publicado sobre el commit final (07/11/2026), reubicado para incluir el Eje A.
- La cobertura observada está por debajo de los mínimos exigidos.
- No hay mutation testing configurado ni reporte de mutation score.
- ~~Las pruebas denominadas E2E utilizan principalmente servicios y mocks en memoria.~~ El Eje A incorpora 18 pruebas Playwright contra el stack Docker real; los 6 escenarios de API siguen siendo integración lógica en memoria.
- ~~No hay evidencia de integración real con PostgreSQL y RabbitMQ en las pruebas.~~ Hay evidencia real del stack Docker (Playwright sobre API + PostgreSQL) y de caída/recuperación de RabbitMQ; falta una suite de integración dedicada con Testcontainers.
- No hay ejecución comprobable de Newman, ZAP, Trivy/Snyk/Dependency-Check ni k6.
- La prueba del manual de usuario y la prueba exploratoria del docente siguen pendientes de ejecución en clase.
- **EVH-108** (recarga en checkout, severidad Menor) queda abierto con workaround documentado.
- Varias condiciones dependen de evidencias externas: Teams, Jira y demostración presencial.

## Evidencia ejecutada

| Verificación | Resultado |
|---|---:|
| Tests unitarios/dominio/seguridad de API | 89 tests pasados |
| Tests del frontend | 8 tests pasados |
| Escenarios críticos de integración E2E de API | 6 tests pasados |
| E2E Playwright contra el stack Docker (críticos + responsive + a11y) | 18 tests pasados |
| Responsive 360 / 768 / 1280 px | 3/3 PASA |
| Accesibilidad axe-core (9 pantallas, WCAG 2.2 AA) | 0 violaciones critical/serious |
| Lighthouse 13.6.0 Accessibility (desktop / mobile) | 100 / 100 |
| Build del backend | Correcto |
| Build del frontend | Correcto |
| Typecheck del frontend | Correcto |
| Oxlint | Correcto, con 3 warnings |
| Cobertura de líneas total API | 74,19% |
| Cobertura de ramas total API | 52,29% |
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
pnpm --filter @evenhub/web exec playwright test
pnpm --filter api test:cov
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
| G3 | Cumple | CI en verde sobre el tag: build, lint, typecheck, tests, cobertura, E2E de API, Gitleaks, job Docker con smoke HTTP y job `playwright-e2e` con la suite E2E/responsive/a11y. [workflow CI](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml). |
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

- Hay tests unitarios para identidad, eventos, inventario, órdenes, pagos, tickets, notificaciones e IA.
- Las transiciones inválidas de órdenes se prueban con `409 Conflict`.
- Existe una colección Postman versionada.
- El backend y el frontend compilan correctamente.
- La suite actual no presentó fallos.

### Incumplimientos

| Criterio | Mínimo | Resultado | Estado |
|---|---:|---:|---|
| Cobertura de líneas | 80% | 74,19% | No cumple |
| Cobertura de ramas | 70% | 52,29% | No cumple |
| Mutation score | 60% | Sin reporte | No cumple |
| Quality Gate SonarQube/SonarCloud | Aprobado | No configurado | No cumple |
| Integración con PostgreSQL real | Requerida | Playwright A1–A6 contra API + PostgreSQL en Docker; E2E de API en memoria | Parcial |
| Integración con RabbitMQ real | Requerida | Prueba de caída/reconexión del broker y consumidor contra RabbitMQ en Docker | Parcial |
| API con casos de éxito y error | Requerida | Colección existente, sin ejecución CI comprobada | Parcial |
| Pruebas de contrato OpenAPI/WSDL | Requerida | No encontradas | No cumple |
| Suite sin flaky tests tres veces | Requerida | Playwright 18/18 estable en corridas repetidas; falta formalizar 3 corridas completas | Parcial |
| Pipeline menor o igual a 15 minutos | Requerida | `build-and-test` con timeout de 15 min; `playwright-e2e` tiene timeout propio de 25 min | Parcial |

El workflow de CI anterior imprimía un mensaje de “Quality Gate aprobado” sin calcular nada. Fue reemplazado por un workflow que ejecuta Gitleaks sobre el historial, typecheck, builds, las suites completas, la cobertura real y un baseline anti-regresión (73% líneas / 51% ramas), además de un job Docker con smoke HTTP y un job `playwright-e2e`. El run público sobre el tag está en verde; el baseline no sustituye el umbral del 80%/70%.

### Acciones necesarias

1. Incorporar tests para las ramas no cubiertas, especialmente en eventos, órdenes, pagos y tickets.
2. Configurar mutation testing sobre la capa de dominio.
3. Configurar un Quality Gate real, no solamente mensajes de consola.
4. Agregar Testcontainers o una estrategia equivalente para PostgreSQL y RabbitMQ.
5. Ejecutar Newman en CI sobre la colección Postman.
6. Agregar validación de contratos OpenAPI y WSDL.
7. Ejecutar la suite tres veces y conservar la evidencia.

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

- **Caída y recuperación de RabbitMQ (07/11/2026):** con el broker detenido, la publicación de un evento respondió **HTTP 201** y la API siguió `healthy`; al reiniciar el broker, el log pasó de `Disconnected from RMQ` a `Successfully connected to RMQ broker`.
- **Playwright contra Docker:** los flujos de compra y check-in atraviesan navegador, API y PostgreSQL reales.
- **Smoke HTTP:** login, creación y publicación de evento, orden, pago, emisión de tickets y check-in.

### Incumplimientos

No se demostró todavía mediante pruebas de integración dedicadas que:

- Los mensajes no se pierdan durante una caída del broker.
- El consumidor procese mensajes duplicados una sola vez en el broker real (se prueba de forma lógica).
- La DLQ sea una cola real de RabbitMQ con reproceso.
- Exista rollback transaccional completo.
- Idempotency-Key y ETag funcionen mediante endpoints HTTP reales (se prueban a nivel de servicio/controlador).
- El timeout sea provocado por un proveedor externo real o mock externo.
- La prueba de carga haya sido ejecutada.

El script `load-tests/k6-load-test.js` define correctamente 50 usuarios concurrentes durante cinco minutos y los umbrales `p95 < 500 ms` y errores menores al 1%, pero falta ejecutar el script y adjuntar el reporte.

### Acciones necesarias

1. ~~Probar apagado y recuperación del broker.~~ Hecho: publicación 201 con broker caído y reconexión automática.
2. Crear una suite de integración dedicada con PostgreSQL y RabbitMQ reales (Testcontainers o equivalente).
3. Configurar colas durables, DLQ y estrategia de reproceso verificable.
4. Probar rollback y compensación de operaciones fallidas.
5. Crear pruebas HTTP para idempotencia, ETag y Problem Details.
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

1. Elevar la cobertura a mínimo 80% de líneas y 70% de ramas.
2. Agregar mutation testing con score mínimo de 60%.
3. Ejecutar Newman en CI.
4. Crear pruebas de integración dedicadas con PostgreSQL y RabbitMQ reales.
5. Ejecutar k6 y documentar el reporte.
6. Ejecutar ZAP y un scanner de dependencias.

### Prioridad media

1. Agregar contratos OpenAPI/WSDL.
2. Agregar pruebas HTTP de seguridad y resiliencia.
3. Ejecutar la suite tres veces para verificar ausencia de flaky tests.
4. ~~Validar responsive y accesibilidad.~~ Validado: 360/768/1280 px, axe 9/9 y Lighthouse 100/100.
5. Completar la declaración de IA.
6. Cerrar EVH-108.

## Veredicto final

La clasificación actual es:

| Área | Estado |
|---|---|
| Eje A - HU, criterios y E2E | Cumple el alcance técnico; pendiente la prueba del manual y la exploratoria del docente |
| Eje B - código y pruebas | No cumple (cobertura y mutation testing) |
| Eje C - integración y resiliencia | Parcial (broker real verificado; falta suite de integración dedicada y k6) |
| Eje D - seguridad | Parcial |
| Eje E - IA | Parcialmente cumplido |
| G1-G9 | G1, G2, G3 y G6 cumplidos; G4, G5, G7, G8 y G9 pendientes de evidencia externa |

La aplicación tiene una base sólida, el Eje A está cerrado a nivel técnico y el pipeline está en verde; **no debe presentarse como plenamente conforme hasta completar las evidencias externas, corregir la cobertura y demostrar las integraciones dedicadas restantes**.
