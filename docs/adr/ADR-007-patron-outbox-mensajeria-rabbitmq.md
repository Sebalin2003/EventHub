# ADR-007: Implementación del Patrón Transactional Outbox y Mensajería Resiliente con RabbitMQ

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-28 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
EventHub requiere notificar eventos de negocio clave de forma asíncrona (como `event.created` al publicar un evento, `order.created` al iniciar una compra y `order.paid` al confirmarse el pago) para no penalizar el tiempo de respuesta HTTP de los usuarios.

Sin embargo, publicar directamente sobre un broker de mensajería (RabbitMQ) desde el hilo HTTP introduce riesgos severos:
1. **Falta de Atomicidad (Dual-Write Problem):** Si la transacción en PostgreSQL tiene éxito pero la llamada de red a RabbitMQ falla (o viceversa), el sistema queda en estado inconsistente.
2. **Caída del Broker:** Si RabbitMQ se detiene o se reinicia durante la operación, los mensajes en vuelo se pierden o la petición HTTP del usuario falla con 500.
3. **Mensajes Duplicados:** En redes no confiables o tras reconexiones, RabbitMQ puede entregar el mismo mensaje más de una vez (garantía *at-least-once*), disparando correos duplicados.
4. **Mensajes Venenosos (Poison Pills):** Mensajes con formatos inválidos o destinatarios erróneos pueden provocar loops infinitos de reintentos y bloquear la cola.

## Decisión
Se implementó el **Patrón Transactional Outbox** junto con una arquitectura de mensajería altamente resiliente:

1. **Tabla y Entidad `OutboxMessage` en PostgreSQL:**
   - Ubicación: `apps/api/src/common/broker/outbox-message.entity.ts`.
   - Cuando ocurre una acción de negocio (ej. publicar evento o crear orden), el mensaje se persiste dentro de la misma transacción en la tabla `outbox_messages` con estado `PENDING`.

2. **Dispatcher Asíncrono (`OutboxService`):**
   - Un proceso periódico sondea los mensajes `PENDING`, los publica a RabbitMQ con timeout de 3 segundos y, únicamente cuando el broker acusa recibo (ACK), actualiza su estado a `SENT` con timestamp.
   - **Garantía ante caída del Broker:** Si RabbitMQ se apaga, la API continúa respondiendo HTTP 201/200 al usuario. Los mensajes quedan encolados de forma durable en PostgreSQL como `PENDING`. Al reconectarse el broker, el dispatcher los despacha automáticamente sin intervención manual ni pérdida de datos (evidencia en `docs/evidencias/broker-recovery.json`).

3. **Consumidores Idempotentes:**
   - `NotificationsService` mantiene una clave de deduplicación determinista (`deduplicationKey` basada en ID de mensaje o entidad).
   - Si un mensaje con el mismo identificador ya fue procesado, se registra una advertencia y se descarta inmediatamente (`DUPLICATE_SKIPPED`) sin emitir correos duplicados ni duplicar filas en la tabla `notifications`.

4. **Dead Letter Queue (DLQ) y Topología Durable:**
   - La cola principal `notifications_queue` se configura como durable con Dead Letter Exchange `eventhub.dlx`.
   - Si un mensaje falla tras 3 reintentos (`maxRetries = 3`), se enruta automáticamente a la cola de mensajes muertos `notifications_dlq` con cabecera `x-death`, quedando disponible para auditoría y reprocesamiento.

## Consecuencias y Beneficios
- **Cero Pérdida de Mensajes:** La persistencia local previa en PostgreSQL garantiza confiabilidad absoluta ante caídas temporales del broker de mensajería.
- **Idempotencia Garantizada (Eje C):** La entrega repetida de mensajes es inocua para el sistema.
- **Aislamiento de Errores:** Mensajes malformados son aislados en DLQ sin bloquear el flujo de mensajes válidos.

## Evidencia en Código y Pruebas
- Entidad y Servicio Outbox: `apps/api/src/common/broker/outbox-message.entity.ts` y `outbox.service.ts`
- Servicio de Notificaciones: `apps/api/src/modules/notifications/notifications.service.ts`
- Pruebas unitarias: `apps/api/src/common/broker/outbox.service.spec.ts` y `apps/api/src/modules/notifications/notifications.service.spec.ts`
- Prueba de integración real con caída de RabbitMQ: `apps/api/scripts/broker-resilience-evidence.mjs` y `docs/evidencias/broker-recovery.json`
- Pruebas E2E de integración real: `apps/api/test/integration-real-deps.e2e-spec.ts` (verificación de duplicados, DLQ con `x-death` y reproceso)

