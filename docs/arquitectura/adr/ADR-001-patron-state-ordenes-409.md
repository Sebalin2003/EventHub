# ADR-001: Implementación del Patrón State en la Entidad Central (Order) con HTTP 409 ante Transiciones Inválidas

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-18 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
EventHub maneja como entidad central del negocio la **Orden de Compra (`Order`)**. Las órdenes transitan por múltiples estados a lo largo de su ciclo de vida:
- `PENDING`: Orden creada, con retención temporal de cupo (HOLD de 5 minutos en inventario) a la espera del pago.
- `PAID`: Pago aprobado por la pasarela bancaria, HOLD confirmado, venta consolidada y entradas/tickets emitidos.
- `CANCELLED`: Orden cancelada por vencimiento del tiempo de reserva, por rechazo del medio de pago o por acción explícita del usuario/organizador.
- `REFUNDED`: Orden pagada sobre la cual se solicitó y procesó una devolución o reembolso.

En la arquitectura previa, la lógica de validación de transiciones de estado se encontraba dispersa en condicionales `if-else` o `switch` dentro de `OrdersService`. Esto generaba acoplamiento, riesgo de incoherencias concurrentes y respuestas HTTP inconsistentes (como errores 500 o silenciosos 200 con estados corruptos) cuando se intentaba ejecutar una acción no válida sobre un estado determinado (por ejemplo, intentar pagar una orden ya cancelada, o reembolsar una orden pendiente no pagada).

El requerimiento de la cátedra exige:
> "Patrones implementados en el código, cada uno con su ADR. El patrón State en la entidad central tiene que devolver 409 ante una transición inválida."

## Decisión
Se decidió implementar formalmente el **Patrón de Diseño Comportamental State (GoF)** en el módulo de órdenes (`apps/api/src/modules/orders/state/order-state.ts`).

1. **Definición de la Interfaz del Estado (`IOrderState`):**
   ```typescript
   export interface IOrderState {
     readonly status: OrderStatus;
     pay(): OrderStatus;
     cancel(): OrderStatus;
     refund(): OrderStatus;
   }
   ```

2. **Implementación de Clases de Estado Concretas:**
   - `PendingOrderState`:
     - `pay()`: Transiciona a `OrderStatus.PAID`.
     - `cancel()`: Transiciona a `OrderStatus.CANCELLED`.
     - `refund()`: **Inválido** $\rightarrow$ Arroja `ConflictException` (HTTP 409).
   - `PaidOrderState`:
     - `pay()`: **Inválido** (ya pagada) $\rightarrow$ Arroja `ConflictException` (HTTP 409).
     - `cancel()`: **Inválido** (debe reembolsarse) $\rightarrow$ Arroja `ConflictException` (HTTP 409).
     - `refund()`: Transiciona a `OrderStatus.REFUNDED`.
   - `CancelledOrderState`:
     - `pay()`, `cancel()`, `refund()`: **Inválidos** $\rightarrow$ Arrojan `ConflictException` (HTTP 409).
   - `RefundedOrderState`:
     - `pay()`, `cancel()`, `refund()`: **Inválidos** $\rightarrow$ Arrojan `ConflictException` (HTTP 409).

3. **Mapeo a HTTP 409 Conflict y Problem Details (RFC 9457):**
   Toda transición inválida arroja `ConflictException` de NestJS. El filtro global `ProblemDetailsFilter` intercepta esta excepción y genera una respuesta estándar `application/problem+json` con:
   - `status`: `409`
   - `title`: `Conflict`
   - `detail`: Descripción explícita de la regla de negocio violada (ej. *"Transición inválida de estado: No se puede reembolsar una orden que se encuentra en estado PENDING"*).

4. **Factoría de Estados (`createOrderState`):**
   Permite instanciar la clase de estado adecuada a partir del enum persistido en la base de datos `OrderStatus`.

## Consecuencias y Beneficios
- **Encapsulamiento y Cohesión:** Cada estado es responsable de sus propias reglas de negocio y transiciones permitidas.
- **Cumplimiento Estricto de HTTP 409:** Ante cualquier operación no permitida en el estado actual, el cliente recibe un error 409 con detalle descriptivo en formato RFC 9457, eliminando errores 500 no controlados.
- **Extensibilidad:** Si se agregan nuevos estados (ej. `DISPUTED` o `PARTIALLY_REFUNDED`), basta con implementar una nueva clase sin modificar el resto de los estados existentes (Principio Open/Closed).
- **Testabilidad y Mutation Testing:** La máquina de estados cuenta con suite unitaria dedicada (`order-state.spec.ts`) y alcanzó una tasa de muerte de mutantes (mutation score) superior al 76% en Stryker.

## Evidencia en Código y Pruebas
- Código fuente: `apps/api/src/modules/orders/state/order-state.ts`
- Uso en el servicio: `apps/api/src/modules/orders/orders.service.ts`
- Pruebas unitarias: `apps/api/src/modules/orders/order-state.spec.ts` (14 aserciones sobre todas las transiciones válidas e inválidas)
- Pruebas de integración E2E: `apps/api/test/integration-real-deps.e2e-spec.ts` (validación de HTTP 409 real contra base de datos y respuesta JSON)

