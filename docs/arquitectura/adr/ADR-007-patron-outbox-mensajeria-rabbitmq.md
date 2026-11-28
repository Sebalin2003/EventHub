# ADR-007: Implementación del Patrón Transactional Outbox y Mensajería Resiliente con RabbitMQ

## Estado
**Aceptado e Implementado, con límite de confirmación del publicador**

## Fecha
2026-10-28 (Revisado al 28/11/2026)

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

2. **Dispatcher asíncrono (`OutboxService`):**
   - Un proceso periódico sondea lotes de hasta 50 mensajes `PENDING`. El timeout configurado por defecto es de 3 segundos.
   - Si la publicación arroja un error, el registro permanece `PENDING`, aumenta `attempts` y se vuelve a intentar en un ciclo posterior.
   - Si `TopicPublisherService.publish` retorna, el outbox marca el registro `SENT`. El publicador usa un canal AMQP normal, no publisher confirms: `SENT` no acredita un ACK del broker ni una garantía absoluta de entrega.
   - La prueba de caída/recovery demuestra que los registros pendientes sobreviven a la indisponibilidad probada y que el dispatcher intenta publicarlos al volver el broker; no demuestra cero pérdida ante cualquier fallo o caída de proceso.

3. **Consumidores Idempotentes:**
   - `NotificationsService` mantiene una clave de deduplicación determinista (`deduplicationKey` basada en ID de mensaje o entidad).
   - Si un mensaje con el mismo identificador ya fue procesado, se registra una advertencia y se descarta inmediatamente (`DUPLICATE_SKIPPED`) sin emitir correos duplicados ni duplicar filas en la tabla `notifications`.

4. **Dead Letter Queue (DLQ) y topología durable:**
   - La topología declara colas durables con Dead Letter Exchange; los mensajes publicados se marcan persistentes.
   - La evidencia E2E verifica el enrutamiento a DLQ y el reproceso. La durabilidad de la cola y del mensaje no equivale a confirmación del publicador.

## Consecuencias y Beneficios
- **Recuperación ante interrupciones probadas:** el outbox persiste junto con la operación de negocio y reintenta los mensajes que continúan `PENDING`. Sin publisher confirms no se afirma entrega garantizada ni cero pérdida.
- **Idempotencia del consumidor (Eje C):** la deduplicación persistente reduce efectos duplicados ante una entrega repetida.
- **Aislamiento de Errores:** Mensajes malformados son aislados en DLQ sin bloquear el flujo de mensajes válidos.

## Evidencia en Código y Pruebas
- Entidad y Servicio Outbox: `apps/api/src/common/broker/outbox-message.entity.ts` y `outbox.service.ts`
- Servicio de Notificaciones: `apps/api/src/modules/notifications/notifications.service.ts`
- Pruebas unitarias: `apps/api/src/common/broker/outbox.service.spec.ts` y `apps/api/src/modules/notifications/notifications.service.spec.ts`
- Prueba de integración real con caída de RabbitMQ: `apps/api/scripts/broker-resilience-evidence.mjs` y `docs/evidencias/broker-recovery.json`
- Pruebas E2E de integración real: `apps/api/test/integration-real-deps.e2e-spec.ts` (verificación de duplicados, DLQ con `x-death` y reproceso)

