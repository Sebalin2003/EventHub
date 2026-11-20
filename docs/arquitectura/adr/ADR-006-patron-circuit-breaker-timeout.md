# ADR-006: Implementación del Patrón Circuit Breaker y Timeout de 5s para Resiliencia en Pagos

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-25 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
Las dependencias externas síncronas —particularmente la pasarela de pagos legada SOAP— representan un punto crítico de falla. Si el servidor SOAP externo se degrada, queda inaccesible o responde con demoras prolongadas:
1. Las peticiones HTTP entrantes quedan colgadas esperando la respuesta, agotando los sockets y recursos del servidor Node.js (agotamiento de event loop o descriptores de archivo).
2. La experiencia del usuario se deteriora gravemente con tiempos de espera indefinidos.
3. El sistema continúa bombardeando al servicio externo fallido con nuevas solicitudes, impidiendo su recuperación (efecto cascada).

El requerimiento de resiliencia del TP (Eje C) exige:
> "Timeout de 5 segundos con fallback. Circuit breaker que abra tras fallas consecutivas y evite hilos/peticiones colgadas."

## Decisión
Se implementó el **Patrón Circuit Breaker (Cortacircuito)** junto con un **Timeout Estricto de 5 Segundos** en `PaymentsService` (`apps/api/src/modules/payments/payments.service.ts`).

1. **Timeout Estricto de 5 Segundos (5000 ms):**
   - Implementado mediante `Promise.race` entre la llamada de red y una promesa de timeout (`setTimeout` con `.unref()`):
     ```typescript
     const timeout = new Promise<never>((_, reject) => {
       timer = setTimeout(() => reject(new Error('SOAP_GATEWAY_TIMEOUT')), 5000);
     });
     ```
   - Si la llamada excede los 5 segundos, se corta inmediatamente la espera, se cancela el timer y se retorna un resultado tipado con código `GATEWAY_TIMEOUT`.

2. **Patrón Circuit Breaker con Tres Estados:**
   - `CLOSED` (Estado Normal): Todas las peticiones fluyen hacia la pasarela. Cada éxito resetea el contador de fallas consecutivas.
   - `OPEN` (Abierto): Tras **3 fallos consecutivos** (`failureThreshold = 3`), el circuito se abre. Todas las peticiones subsiguientes son cortadas de inmediato en milisegundos sin intentar comunicarse con el servicio externo, devolviendo una respuesta de fallback.
   - `HALF_OPEN` (Medio Abierto): Transcurrido un período de enfriamiento de **30 segundos** (`cooldownMs = 30000`), el circuito permite pasar una petición de prueba. Si es exitosa, el circuito vuelve a `CLOSED`; si falla, regresa a `OPEN`.

3. **Estrategia de Fallback Comunicada:**
   Cuando el circuito está abierto o la llamada sufre un timeout, el servicio retorna:
   ```typescript
   {
     success: false,
     code: 'CIRCUIT_BREAKER_OPEN' | 'GATEWAY_TIMEOUT',
     reason: 'La pasarela de pagos se encuentra temporalmente fuera de servicio...',
     fallback: true
   }
   ```
   Esto evita que la orden quede colgada o en un estado intermedio inconsistente: la orden se cancela de forma controlada y se libera el HOLD de inventario (mecanismo de compensación).

## Consecuencias y Beneficios
- **Protección del Sistema:** La API responde en menos de 5 segundos en el peor de los casos y en < 5 ms cuando el cortacircuito está abierto.
- **Fail-Fast:** No se desperdician recursos en solicitudes condenadas a fallar.
- **Auto-recuperación:** El sistema sondea automáticamente el estado del servicio externo en `HALF_OPEN` para reanudar el procesamiento normal en cuanto el servicio se restablece.

## Evidencia en Código y Pruebas
- Código fuente: `apps/api/src/modules/payments/payments.service.ts`
- Pruebas unitarias: `apps/api/src/modules/payments/payments.service.spec.ts` (verificación de corte a los 5s, apertura tras 3 fallos y transición a HALF_OPEN tras cooldown)
- Pruebas E2E de contrato: `apps/api/test/soap-contract.e2e-spec.ts` (servidor simulado con demora de 6s que dispara el timeout y circuit breaker)

