# Informe de cumplimiento de criterios de testing

## Conclusión ejecutiva

La aplicación cuenta con una base de pruebas automatizadas funcional: las suites existentes pasan, el backend y el frontend compilan y hay cobertura de varios flujos críticos de negocio, resiliencia, seguridad e inteligencia artificial.

Sin embargo, **la aplicación no cumple todavía con la totalidad de los criterios definidos en `criterios_de_testing.md`**. Los principales incumplimientos son:

- No existe el tag `v1.0-testing`.
- La cobertura observada está por debajo de los mínimos exigidos.
- No hay mutation testing configurado ni reporte de mutation score.
- Las pruebas denominadas E2E utilizan principalmente servicios y mocks en memoria.
- No hay evidencia de integración real con PostgreSQL y RabbitMQ en las pruebas.
- No hay ejecución comprobable de Newman, ZAP, Trivy/Snyk/Dependency-Check ni k6.
- Varias condiciones G1-G9 dependen de evidencias externas: Teams, Jira, GitHub Actions y demostración presencial.

## Evidencia ejecutada

| Verificación | Resultado |
|---|---:|
| Tests unitarios/dominio/seguridad de API | 84 tests pasados |
| Tests del frontend | 8 tests pasados |
| Tests configurados como E2E | 6 tests pasados |
| Build del backend | Correcto |
| Build del frontend | Correcto |
| Oxlint | Correcto, con 3 warnings |
| Cobertura de líneas total API | 73,75% |
| Cobertura de ramas total API | 51,04% |

Los comandos ejecutados fueron:

```bash
pnpm --filter api test
pnpm --filter @evenhub/web test
pnpm --filter api test:e2e
pnpm --filter api test:cov
pnpm --filter api build
pnpm --filter @evenhub/web build
pnpm --filter api lint
```

## Evaluación de admisibilidad G1-G9

| Código | Estado | Evidencia y acción necesaria |
|---|---|---|
| G1 | Parcial | Existe Docker Compose y el build local funciona. Falta validar en una máquina limpia que API, frontend, PostgreSQL, RabbitMQ y mocks levanten juntos en menos de 15 minutos. |
| G2 | No cumple | No existe el tag `v1.0-testing`. Crear el tag sobre el commit final y publicarlo en el repositorio. |
| G3 | Parcial | Existe `.github/workflows/ci.yml`, pero falta un run exitoso comprobable sobre el tag requerido. |
| G4 | No verificable | Hay documentación en el repositorio, pero debe confirmarse la entrega del plan, matriz, informe y defectos en Teams. |
| G5 | No verificable | Debe comprobarse que cada caso y defecto exista en Jira con estado, responsable y vínculo a la HU. |
| G6 | Parcial | El workflow busca patrones de claves privadas, pero no reemplaza un escaneo histórico completo con Gitleaks o TruffleHog. |
| G7 | No verificable | Requiere demostrar en vivo el flujo principal de punta a punta. |
| G8 | Parcial | Debe completarse la declaración de IA con herramientas, versiones, prompts, decisiones aceptadas/descartadas y validación manual. |
| G9 | No verificable | Debe contrastarse el informe con Jira y la ejecución para asegurar que no existan defectos conocidos omitidos. |

Mientras G2 no se resuelva y el resto de las evidencias no se adjunte, no puede afirmarse el cumplimiento de las condiciones eliminatorias.

## Eje A: historias de usuario y pruebas E2E

### Aspectos cubiertos

Las pruebas existentes cubren:

- Registro y autenticación.
- Hashing de contraseñas.
- Reservas temporales y prevención de sobreventa.
- Idempotencia de órdenes.
- Pagos y fallas de la pasarela.
- Emisión de tickets y check-in.
- BOLA y autorización por roles.
- Timeout y circuit breaker.
- Guardrails y fallback de IA.

La evidencia principal se encuentra en:

- `apps/api/test/critical-scenarios.e2e-spec.ts`
- `apps/api/test/security-resilience.spec.ts`
- `apps/api/src/modules/ai/ai.service.spec.ts`

### Incumplimientos

Los escenarios llamados E2E instancian servicios directamente y utilizan mocks para repositorios, JWT y dependencias externas. Por lo tanto, no demuestran un flujo completo a través de HTTP, base de datos real y broker real.

El archivo `apps/api/test/app.e2e-spec.ts` únicamente verifica `GET /` y la respuesta `"Hello World!"`.

También falta evidencia de:

- 100% de HU del alcance ejecutadas.
- Al menos 95% de criterios de aceptación pasados.
- Prueba del manual de usuario por parte del docente.
- Prueba exploratoria.
- Responsive a 360, 768 y 1280 píxeles.
- Lighthouse o axe con puntuación mínima de 90 y sin violaciones críticas.

### Acciones necesarias

1. Agregar pruebas HTTP reales con Supertest para los cinco flujos críticos.
2. Ejecutar esas pruebas con PostgreSQL y RabbitMQ en contenedores.
3. Completar la matriz HU → criterio → caso → test → resultado.
4. Ejecutar y documentar las verificaciones responsive y de accesibilidad.

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
| Cobertura de líneas | 80% | 73,75% | No cumple |
| Cobertura de ramas | 70% | 51,04% | No cumple |
| Mutation score | 60% | Sin reporte | No cumple |
| Quality Gate SonarQube/SonarCloud | Aprobado | No configurado | No cumple |
| Integración con PostgreSQL real | Requerida | Mocks en memoria | No cumple |
| Integración con RabbitMQ real | Requerida | No demostrada | No cumple |
| API con casos de éxito y error | Requerida | Colección existente, sin ejecución CI comprobada | Parcial |
| Pruebas de contrato OpenAPI/WSDL | Requerida | No encontradas | No cumple |
| Suite sin flaky tests tres veces | Requerida | Sin evidencia | No verificable |
| Pipeline menor o igual a 15 minutos | Requerida | Sin run verificable | No verificable |

El workflow de CI imprime un mensaje de “Quality Gate aprobado”, pero no calcula ni valida realmente la cobertura, el mutation score, SonarQube ni las vulnerabilidades. Además, la documentación declara coberturas superiores a las observadas, por lo que debe actualizarse con resultados reales o corregirse la suite.

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

### Incumplimientos

No se demostró mediante pruebas de integración real que:

- RabbitMQ se recupere luego de ser apagado.
- Los mensajes no se pierdan durante una caída del broker.
- El consumidor procese mensajes duplicados una sola vez en el broker real.
- La DLQ sea una cola real de RabbitMQ con reproceso.
- Exista rollback transaccional completo.
- Idempotency-Key y ETag funcionen mediante endpoints HTTP reales.
- El timeout sea provocado por un proveedor externo real o mock externo.
- La prueba de carga haya sido ejecutada.

El script `load-tests/k6-load-test.js` define correctamente 50 usuarios concurrentes durante cinco minutos y los umbrales `p95 < 500 ms` y errores menores al 1%, pero falta ejecutar el script y adjuntar el reporte.

### Acciones necesarias

1. Crear pruebas de integración con PostgreSQL y RabbitMQ reales.
2. Configurar colas durables, DLQ y estrategia de reproceso verificable.
3. Probar apagado y recuperación del broker.
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
4. Ejecutar Gitleaks o TruffleHog sobre todo el historial.
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

## Plan priorizado para resolver los criterios

### Prioridad bloqueante

1. Crear y publicar el tag `v1.0-testing`.
2. Ejecutar el pipeline sobre ese tag.
3. Validar `docker compose up --build` desde un entorno limpio.
4. Completar y entregar en Teams la documentación requerida.
5. Actualizar Jira con casos, defectos, responsables y vínculos a HU.

### Prioridad alta

1. Elevar la cobertura a mínimo 80% de líneas y 70% de ramas.
2. Agregar mutation testing con score mínimo de 60%.
3. Ejecutar Newman en CI.
4. Crear pruebas de integración con PostgreSQL y RabbitMQ reales.
5. Ejecutar k6 y documentar el reporte.
6. Ejecutar ZAP y un scanner de dependencias.

### Prioridad media

1. Agregar contratos OpenAPI/WSDL.
2. Agregar pruebas HTTP de seguridad y resiliencia.
3. Ejecutar la suite tres veces para verificar ausencia de flaky tests.
4. Validar responsive y accesibilidad.
5. Completar la declaración de IA.

## Veredicto final

La clasificación actual es:

| Área | Estado |
|---|---|
| Eje A - HU, criterios y E2E | Parcial |
| Eje B - código y pruebas | No cumple |
| Eje C - integración y resiliencia | Parcial |
| Eje D - seguridad | Parcial |
| Eje E - IA | Parcialmente cumplido |
| G1-G9 | No cumplidas o no verificables en su totalidad |

La aplicación tiene una base sólida para continuar, pero **no debe presentarse como plenamente conforme a los criterios hasta completar las evidencias externas, corregir la cobertura y demostrar las integraciones reales**.
