# Plan por etapas para corregir EventHub

> **Estado general del plan:**
> - **Etapa 1:** ✅ **COMPLETADA** (Mergeada en `main` - Commit `00ee70e`)
> - **Etapa 2:** ✅ **COMPLETADA** (Mergeada en `main` - Commit `00ee70e`)
> - **Etapa 3:** ⏳ **PRÓXIMA A EJECUTAR (Integridad de datos)**
> - **Etapas 4 a 8:** 📋 **PLANIFICADAS / PENDIENTES**

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

## Etapa 3 — Integridad de datos · 1 o 2 personas de backend · media — [⏳ PENDIENTE / SIGUIENTE]
**Objetivo:** que no haya sobreventa ni estados inconsistentes (Eje C y requisito del TP).

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Transacción en pago y reembolso, con el outbox dentro de la misma transacción | `orders.service.ts`, `outbox.service.ts` | P-14, E2-12 | ⏳ Pendiente |
| Reserva por tipo de entrada y decremento atómico de `sold` | `orders.service.ts`, `events.service.ts`, `inventory.service.ts` | P-05 | ⏳ Pendiente |
| Bloqueo de la orden al pagar, y cobro recién después de bloquearla | `orders.service.ts` | P-12 | ⏳ Pendiente |
| Eliminar el `PATCH /orders/:id/pay` sin tarjeta | `orders.controller.ts` | P-12, E2-06 | ⏳ Pendiente |
| Liberar la reserva al cancelar y poner un tope de reservas por usuario | `orders.service.ts`, `inventory.controller.ts`, `inventory.dto.ts` | P-12 | ⏳ Pendiente |
| Idempotencia: índice `(userId, idempotencyKey)`, atrapar la clave duplicada y responder 422 si cambia el cuerpo | `orders.service.ts`, `order.entity.ts` | P-16 | ⏳ Pendiente |
| Deduplicación persistente: `messageId` único en `notifications` | `notifications.service.ts`, `notification.entity.ts` | P-10 | ⏳ Pendiente |
| Validación de Luhn en todos los caminos | `payments.service.ts` | P-12 | ⏳ Pendiente |
| Respuesta 409 cuando un conflicto de base hoy da 500 (por ejemplo, borrar un evento con órdenes) | `problem-details.filter.ts`, `events.service.ts` | P-12 | ⏳ Pendiente |

**Criterio de salida:**
- Tests de concurrencia con `Promise.all`: cupo 2 con 5 compradores emite 2 entradas; 5 POST con la misma clave crean 1 orden.
- La carga k6 de escritura no sobrevende.
- Duplicado tras reiniciar la API: 1 sola fila.

---

## Etapa 4 — Integraciones obligatorias · 1 persona · media — [⏳ PENDIENTE]
**Objetivo:** que SOAP, REST y mensajería sean reales en la demo (G1, Eje C, checklist del TP).

| Tarea | Archivos | Ref. | Estado |
|---|---|---|:---:|
| Servicio `soap-mock` en el compose, a partir del servidor que ya usa `soap-contract.e2e-spec.ts`, y `PAYMENTS_WSDL_URL` apuntando a él | `docker-compose.yml`, nuevo `infra/soap-mock/` | P-15 | ⏳ Pendiente |
| Mock REST de geocodificación en el compose, con test de timeout | `docker-compose.yml`, `events.service.ts` | E3-04 | ⏳ Pendiente |
| Exchange `topic` con 2 colas suscriptas (notificaciones y auditoría) | `broker-topology.service.ts`, `outbox.module.ts`, nuevo consumidor | P-14 | ⏳ Pendiente |
| Fallback de pago: 503/504 con `Retry-After`, mensaje propio y la orden queda pendiente | `orders.service.ts`, `problem-details.filter.ts` | P-17 | ⏳ Pendiente |
| Endurecer el parser del cliente `soap` y probar XXE contra el mock | `payments.service.ts` | E3-03 | ⏳ Pendiente |

**Criterio de salida:**
- El log de arranque dice "SOAP Client initialized".
- Un pago cruza el servicio SOAP.
- Un evento publicado llega a 2 consumidores.
- El timeout responde 504 con la orden en `pending`.

---

## Etapa 5 — Web conectada al backend · 1 persona de frontend desde el día 1 · grande — [⏳ PENDIENTE / EN PARALELO]
**Objetivo:** demo en vivo real (G7).

| Tarea | Archivos | Estado |
|---|---|:---:|
| Cliente API para órdenes, pago, entradas y check-in | `apps/web/src/api/orders.ts`, `tickets.ts`, `checkin.ts` (nuevos) | ⏳ Pendiente |
| Checkout: `POST /orders` con `Idempotency-Key`, luego `POST /orders/:id/pay`. Mostrar los errores Problem Details (402, 409, 504) | `CheckoutPage.tsx` | ⏳ Pendiente |
| "Mis entradas" y "Mis compras" desde `GET /tickets/me` y `GET /orders` | `MyTicketsPage.tsx`, `PurchasesPage.tsx` | ⏳ Pendiente |
| Staff y organizador: `POST /check-in/:id/scan` | `StaffPortal.tsx`, `OrgCheckIn.tsx` | ⏳ Pendiente |
| Quitar el selector "Resultado de demostración"; los rechazos se prueban con las tarjetas del mock SOAP | `CheckoutPage.tsx` | ⏳ Pendiente |
| Reescribir A3 y A6 para que verifiquen la respuesta de la API y validen desde otro contexto de navegador | `critical-flows.spec.ts` | ⏳ Pendiente |

**Criterio de salida:**
- Una compra en la web crea orden y entradas en la base.
- El staff valida esa entrada desde otro navegador.
- El segundo escaneo responde 409.

**Plan B si no llega:** dejar la web como está, declararlo en el informe como limitación y hacer la demo del flujo por la colección Postman contra el stack real.

---

## Etapa 6 — Umbrales de testing · QA · media — [⏳ PENDIENTE]
**Objetivo:** cumplir el Eje B con métricas defendibles.

| Tarea | Ref. | Estado |
|---|---|:---:|
| SonarCloud en el CI, con captura del Quality Gate | B-04 | ⏳ Pendiente |
| `coverage.include: ['src/**']` sin bajar del 80/70 | P-19 | ⏳ Pendiente |
| Stryker sobre inventory y events; matar mutantes vivos de `order-state.ts` hasta ≥ 60 % | B-03 | ⏳ Pendiente |
| k6: agregar crear orden y pagar al escenario | C-10 | ⏳ Pendiente |
| ZAP activo autenticado sobre la API y baseline sobre la web en el CI | D-08 | ⏳ Pendiente |
| Newman: casos para las 8 rutas que hoy no tienen éxito y error | B-06 | ⏳ Pendiente |
| Tests de las etapas 2 a 4: concurrencia, rollback forzado, reinicio de la API | — | ⏳ Pendiente |

**Criterio de salida:**
- Pipeline ≤ 15 min.
- Quality Gate aprobado.
- Mutación ≥ 60 % en cada archivo de dominio.
- p95 < 500 ms con escritura.

---

## Etapa 7 — Documentación e informe honesto · QA + 1 · media — [⏳ PENDIENTE]
**Objetivo:** G9, G8 y la documentación final.

| Tarea | Ref. | Estado |
|---|---|:---:|
| Reescribir el informe de testing con números reales del CI nuevo. Quitar "sin mocks", "6 jobs" anterior y SEC-09; reabrir EVH-102 y cerrarlo con el test nuevo | P-04 | ⏳ Pendiente |
| Registro de defectos: los de esta auditoría, cada uno con pasos, esperado/obtenido, estado y causa raíz | E3-21 | ⏳ Pendiente |
| Especificación de casos completa, con ≥ 40 % negativos | DOC-06 | ⏳ Pendiente |
| Matriz de trazabilidad con columnas de caso y de defecto | E3-20 | ⏳ Pendiente |
| Documento técnico y ARCHITECTURE alineados con el código, con diagramas de secuencia de SOAP, REST y mensajería | E2-24, DOC-02 | ⏳ Pendiente |
| ADR 007 y 008 corregidos; la IA, o con proveedor detrás de una interfaz, o descripta como motor de reglas | E2-13, E2-14 | ⏳ Pendiente |
| Declaración de IA actualizada al día de la entrega, incluida esta auditoría y los commits con autor "Claude" | G8 | ⏳ Pendiente |
| Limpiar rutas viejas y enlaces `file:///`; nombre real del QA; PDF con número de grupo | P-21 | ⏳ Pendiente |

**Criterio de salida:** cada afirmación del informe tiene un run o un test que la respalda.

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
- [ ] De la etapa 3: transacción del pago y sobreventa.
- [ ] Etapa 5, o su plan B declarado.
- [ ] Etapa 7 sin recortes: la honestidad del informe es eliminatoria.
- [ ] Etapa 8.
