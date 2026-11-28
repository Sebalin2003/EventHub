# Plan por etapas para corregir EventHub

> **Estado general del plan:**
> - **Etapa 1:** ✅ **COMPLETADA** (Mergeada en `main` - Commit `00ee70e`)
> - **Etapa 2:** ✅ **COMPLETADA** (Mergeada en `main` - Commit `00ee70e`)
> - **Etapa 3:** ✅ **COMPLETADA** (Integridad de datos y concurrencia - Commit `7643236`)
> - **Etapa 4:** ✅ **COMPLETADA** (Integraciones obligatorias: SOAP mock, Geocode mock, Topic Exchange y Fallback 503/504)
> - **Etapa 5:** ✅ **COMPLETADA** (Web conectada al backend)
> - **Etapa 6:** ✅ **IMPLEMENTADA** (Umbrales y automatización en CI)
> - **Etapa 7:** ✅ **COMPLETADA** (documentación alineada al run verde [`46165701834`](https://github.com/Sebalin2003/EventHub/actions/runs/46165701834), 6/6 jobs sobre `65e0dd8`). Datos externos a cargar por el equipo: nombre del QA, número de grupo, Jira, Teams y token de SonarCloud.
> - **Etapa 8:** 🟡 **EN CURSO** (README con pasos desde `git clone`; falta cronometrar en máquina limpia y mover `v1.0-final`)

---

Hice las etapas en orden de dependencia. Las tres primeras desbloquean la aprobación: CI en verde, seguridad crítica y datos consistentes. La web es la tarea más grande, así que conviene que una persona arranque con ella en paralelo desde el día 1. Las referencias P-xx son las de la sección C del informe.

## Antes de empezar
- **Trabajen sobre `main` (`00ee70e` / última versión), no sobre `avances-octavio`.** Esa rama quedó integrada.
- **Un PR por etapa, o por bloque de etapa.** No se mergea nada sin CI verde, salvo el PR de la etapa 1, que es el que lo arregla.
- **Muevan el tag `v1.0-final` una sola vez,** al final (etapa 8).

---

## Etapa 1 — CI en verde · urgente · 1 persona · chica — [✅ COMPLETADA]
**Objetivo:** que la cátedra vea el pipeline verde (G3).  
**Estado:** *Completada y mergeada en `main` (PR #2).*

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Regenerar el lockfile (`pnpm install --lockfile-only`) | `pnpm-lock.yaml` | P-01 | ✅ Hecho |
| Fechas del seed relativas a hoy, y 409 al comprar un evento pasado | `event.seed.ts`, `apps/web/src/data/seed.ts`, `orders.service.ts` | P-03 | ✅ Hecho |
| Cola propia para cada suite E2E, para que no compartan consumidor | `integration-real-deps.e2e-spec.ts`, `security-http.e2e-spec.ts` | P-10 (parte test) | ✅ Hecho |
| `retries: 0` en Playwright | `playwright.config.ts` | B-10 | ✅ Hecho |

**Criterio de salida:**
- [x] 6/6 jobs en verde en GitHub.
- [x] La suite pasa 3 veces seguidas sin fallos.
- [x] Playwright pasa 18/18.

---

## Etapa 2 — Seguridad crítica · 1 persona de backend · chica a media — [✅ COMPLETADA]
**Objetivo:** cerrar lo que la cátedra puede explotar en vivo (Eje D).  
**Estado:** *Completada y mergeada en `main` (PR #2).*

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Guard y rol en `/payments/process` y `/payments/circuit-breaker`. Sacar `simulateTimeout` y las tarjetas mágicas del código productivo | `payments.controller.ts`, `payments.service.ts` | P-06 | ✅ Hecho |
| Secreto JWT por variable. Sin valor por defecto, `.env.example` actualizado y `exp` obligatorio | `docker-compose.yml`, `identity.module.ts`, `main.ts`, `jwt-auth.guard.ts`, `jwt-secret.ts` | P-07 | ✅ Hecho |
| Reembolso solo para admin u organizador. Cancela las entradas y devuelve el cupo | `orders.controller.ts`, `orders.service.ts`, `tickets.service.ts` | P-11 | ✅ Hecho |
| Check-in atómico: `UPDATE … WHERE status='ISSUED'` | `tickets.service.ts` | P-09 | ✅ Hecho |
| `eventId` obligatorio en el check-in, con validación de dueño | `check-in.controller.ts` | P-12 | ✅ Hecho |
| CORS con lista exacta de orígenes | `cors.options.ts` | P-13 | ✅ Hecho |
| Imágenes armadas con pnpm y `--frozen-lockfile`, con `USER node`. Web servida desde `dist` con cabeceras | `apps/api/Dockerfile`, `apps/web/Dockerfile`, `apps/web/nginx.conf`; borrar `apps/api/package-lock.json` | P-08, P-13 | ✅ Hecho |

**Criterio de salida:**
- [x] Un test E2E por cada caso (`security-http.e2e-spec.ts`).
- [x] `npm ls` dentro del contenedor muestra las versiones parcheadas.
- [x] ZAP baseline de la web sin alertas Medium.
- [x] Un token forjado con el secreto viejo da 401.

---

## Etapa 3 — Integridad de datos · 1 o 2 personas de backend · media — [✅ COMPLETADA]
**Objetivo:** que no haya sobreventa ni estados inconsistentes (Eje C y requisito del TP).

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Transacción en pago y reembolso, con el outbox dentro de la misma transacción | `orders.service.ts`, `outbox.service.ts` | P-14, E2-12 | ✅ Hecho |
| Reserva por tipo de entrada y decremento atómico de `sold` | `orders.service.ts`, `events.service.ts`, `inventory.service.ts` | P-05 | ✅ Hecho |
| Bloqueo de la orden al pagar, y cobro recién después de bloquearla | `orders.service.ts` | P-12 | ✅ Hecho |
| Eliminar el `PATCH /orders/:id/pay` sin tarjeta | `orders.controller.ts` | P-12, E2-06 | ✅ Hecho |
| Liberar la reserva al cancelar y poner un tope de reservas por usuario | `orders.service.ts`, `inventory.controller.ts`, `inventory.dto.ts` | P-12 | ✅ Hecho |
| Idempotencia: índice `(userId, idempotencyKey)`, atrapar la clave duplicada y responder 422 si cambia el cuerpo | `orders.service.ts`, `order.entity.ts` | P-16 | ✅ Hecho |
| Deduplicación persistente: `messageId` único en `notifications` | `notifications.service.ts`, `notification.entity.ts` | P-10 | ✅ Hecho |
| Validación de Luhn en todos los caminos | `payments.service.ts` | P-12 | ✅ Hecho |
| Respuesta 409 cuando un conflicto de base hoy da 500 (por ejemplo, borrar un evento con órdenes) | `problem-details.filter.ts`, `events.service.ts` | P-12 | ✅ Hecho |

**Criterio de salida:**
- Tests de concurrencia con `Promise.all`: cupo 2 con 5 compradores emite 2 entradas; 5 POST con la misma clave crean 1 orden.
- La carga k6 de escritura no sobrevende.
- Duplicado tras reiniciar la API: 1 sola fila.

---

## Etapa 4 — Integraciones obligatorias · 1 persona · media — [✅ COMPLETADA]
**Objetivo:** que SOAP, REST y mensajería sean reales en la demo (G1, Eje C, checklist del TP).

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Servicio `soap-mock` en el compose, a partir del servidor que ya usa `soap-contract.e2e-spec.ts`, y `PAYMENTS_WSDL_URL` apuntando a él | `docker-compose.yml`, nuevo `infra/soap-mock/` | P-15 | ✅ Hecho |
| Mock REST de geocodificación en el compose, con test de timeout | `docker-compose.yml`, `events.service.ts`, nuevo `infra/geocode-mock/` | E3-04 | ✅ Hecho |
| Exchange `topic` con 2 colas suscriptas (notificaciones y auditoría) | `broker-topology.service.ts`, `outbox.module.ts`, `topic-publisher.service.ts`, `audit-consumer.service.ts` | P-14 | ✅ Hecho |
| Fallback de pago: 503/504 con `Retry-After`, mensaje propio y la orden queda pendiente | `orders.service.ts`, `problem-details.filter.ts` | P-17 | ✅ Hecho |
| Endurecer el parser del cliente `soap` y probar XXE contra el mock | `payments.service.ts`, `infra/soap-mock/server.mjs` | E3-03 | ✅ Hecho |

**Criterio de salida:**
- El log de arranque dice "SOAP Client initialized".
- Un pago cruza el servicio SOAP.
- Un evento publicado llega a 2 consumidores.
- El timeout responde 504 con la orden en `pending`.

---

## Etapa 5 — Web conectada al backend · 1 persona de frontend desde el día 1 · grande — [✅ COMPLETADA]
**Objetivo:** demo en vivo real (G7).

| Tarea | Archivos | Estado |
|---|---|:---:|
| Cliente API para órdenes, pago, entradas y check-in | `apps/web/src/api/orders.ts`, `tickets.ts`, `checkin.ts` (nuevos) | ✅ Hecho |
| Checkout: `POST /orders` con `Idempotency-Key`, luego `POST /orders/:id/pay`. Mostrar los errores Problem Details (402, 409, 504) | `CheckoutPage.tsx` | ✅ Hecho |
| "Mis entradas" y "Mis compras" desde `GET /tickets/me` y `GET /orders` | `MyTicketsPage.tsx`, `PurchasesPage.tsx` | ✅ Hecho |
| Staff y organizador: `POST /check-in/:id/scan` | `StaffPortal.tsx`, `OrgCheckIn.tsx` | ✅ Hecho |
| Quitar el selector "Resultado de demostración"; los rechazos se prueban con las tarjetas del mock SOAP | `CheckoutPage.tsx` | ✅ Hecho |
| Reescribir A3 y A6 para que verifiquen la respuesta de la API y validen desde otro contexto de navegador | `critical-flows.spec.ts` | ✅ Hecho |

**Criterio de salida:**
- Una compra en la web crea orden y entradas en la base.
- El staff valida esa entrada desde otro navegador.
- El segundo escaneo responde 409.

**Plan B si no llega:** dejar la web como está, declararlo en el informe como limitación y hacer la demo del flujo por la colección Postman contra el stack real.

---

## Etapa 6 — Umbrales de testing · QA · media — [✅ IMPLEMENTADA]
**Objetivo:** cumplir el Eje B con métricas defendibles.

| Tarea | Ref. | Estado |
|---|---|:---:|
| SonarCloud en el CI, con captura del Quality Gate | B-04 | ✅ Configurado |
| `coverage.include: ['src/**']` sin bajar del 80/70 | P-19 | ✅ Configurado |
| Stryker sobre inventory y events; matar mutantes vivos de `order-state.ts` hasta ≥ 60 % | B-03 | ✅ Configurado |
| k6: agregar crear orden y pagar al escenario | C-10 | ✅ Hecho |
| ZAP activo autenticado sobre la API y baseline sobre la web en el CI | D-08 | ✅ Configurado |
| Newman: casos para las 8 rutas que hoy no tienen éxito y error | B-06 | ✅ Integrado en CI |
| Tests de las etapas 2 a 4: concurrencia, rollback forzado, reinicio de la API | — | ✅ Cubierto por suites existentes |

**Criterio de salida:**
- Pipeline ≤ 15 min.
- Quality Gate aprobado.
- Mutación ≥ 60 % en cada archivo de dominio.
- p95 < 500 ms con escritura.

---

## Etapa 7 — Documentación e informe honesto · QA + 1 · media — [✅ COMPLETADA]
**Objetivo:** G9, G8 y la documentación final.

| Tarea | Ref. | Estado |
|---|---|:---:|
| Reescribir el informe de testing con datos actuales. Retirar afirmaciones antiguas no respaldadas; documentar estado CI y cobertura reales | P-04 | ✅ Informe actualizado al run verde `46165701834` (6/6) |
| Registro de defectos con pasos, esperado/obtenido, estado técnico y causa raíz | E3-21 | ✅ Registro local actualizado; estados Jira no verificados |
| Especificación de casos completa, con ≥ 40 % negativos | DOC-06 | ✅ 43 criterios; 21 negativos (48,8 %) |
| Matriz de trazabilidad con columnas de caso y defecto | E3-20 | ✅ [MATRIZ_TRAZABILIDAD.md](docs/testing/MATRIZ_TRAZABILIDAD.md) |
| Documento técnico y ARCHITECTURE alineados con el código, con diagramas de secuencia de SOAP, REST y mensajería | E2-24, DOC-02 | ✅ Reescritos como arquitectura implementada; límites y diagramas añadidos |
| ADR 007 y 008 corregidos; IA descripta según la implementación real | E2-13, E2-14 | ✅ Outbox sin garantía de ACK; asistente descrito como simulador determinístico |
| Declaración de IA actualizada, incluida esta revisión y commits con atribución Git a Claude | G8 | ✅ Se registró Copilot SDK en VS Code sin inventar modelo; trailers Git tratados solo como atribución |
| Limpiar rutas viejas y enlaces `file:///`; nombre real del QA; PDF con número de grupo | P-21 | ✅ Rutas corregidas; los únicos `file:///` restantes son payloads de ejemplo XXE. PDF regenerado; nombre del QA y número de grupo quedan como campos a completar por el equipo |

**Criterio de salida:** cada afirmación del informe tiene un run o un test que la respalda. **Cumplido:** el run [`46165701834`](https://github.com/Sebalin2003/EventHub/actions/runs/46165701834) sobre `65e0dd8` terminó con 6/6 jobs en verde en 12 min 05 s, y la cobertura medida con el mismo comando del CI (`pnpm --filter api test:cov`, 318/318 tests) dio 91,55 % de líneas y 81,59 % de ramas. Fuera del repo quedan a cargo del equipo: nombre del QA, número de grupo, estados de Jira, subida a Teams y token de SonarCloud.

---

## Etapa 8 — Cierre y ensayo · todo el equipo · chica — [⏳ PENDIENTE]
1. Clonar el repo en una máquina limpia, ejecutar `docker compose up` siguiendo solo el README y cronometrar.
2. Confirmar el CI en verde sobre la punta de `main` y mover `v1.0-final` ahí.
3. Subir el PDF a Teams y dejar Jira al día: casos, defectos, responsables y vínculo a cada HU.
4. Ensayar la demo completa: compra en la web, check-in desde otro dispositivo, apagar el broker, timeout SOAP y los ataques de la sección 7 del PDF.
5. Reunión de defensa: que cada integrante pueda explicar los tests de su autoría.

---

## Orden y paralelismo

```
Día 1      Etapa 1 (✅ Hecho) ────┐
Día 1→     Etapa 5 (web) ─────────┼──────────────────────────┐
Día 2→     Etapa 2 (✅ Hecho) ──► Etapa 3 ──► Etapa 4        │
Día 3→     Etapa 6 (va sumando tests de 2-4) ────────────────┤
Último     Etapa 7 ──► Etapa 8 ◄─────────────────────────────┘
```

**Si el tiempo no alcanza, mínimo para aprobar:**
- [x] Etapa 1 completa.
- [x] De la etapa 2: pagos con guard, secreto JWT, reembolso y check-in atómico.
- [x] De la etapa 3: transacción del pago y sobreventa.
- [x] Etapa 5, o su plan B declarado (Playwright 18/18 en el run `46165701834`).
- [x] Etapa 7 sin recortes: la honestidad del informe es eliminatoria.
- [ ] Etapa 8.
