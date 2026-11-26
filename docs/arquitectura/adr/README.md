# Registro de Decisiones de Arquitectura (ADR) — EventHub

Este directorio contiene los **Architecture Decision Records (ADRs)** del proyecto EventHub, documentando las decisiones de diseño arquitectónico y los patrones de software implementados en el código conforme a los requerimientos de la cátedra de *Desarrollo de Aplicaciones II (UADE)*.

---

## Índice de ADRs

| ADR | Patrón / Decisión | Módulo Principal | Estado | Requerimiento Asociado |
|---|---|---|:---:|---|
| [ADR-001](ADR-001-patron-state-ordenes-409.md) | **Patrón State** en la Entidad Central (`Order`) | `orders/state` | **Aceptado** | 2.ª Entrega Parcial / Eje B (Transición inválida devuelve HTTP 409) |
| [ADR-002](ADR-002-patron-strategy-hashing.md) | **Patrón Strategy** para Hashing de Contraseñas | `identity` | **Aceptado** | 2.ª Entrega Parcial / Eje D (Cifrado adaptativo scrypt) |
| [ADR-003](ADR-003-patron-factory-eventos.md) | **Patrón Factory** para Creación Consistente de Eventos | `events` | **Aceptado** | 2.ª Entrega Parcial (Construcción controlada de entidades) |
| [ADR-004](ADR-004-patron-dao-persistencia.md) | **Patrón DAO (Data Access Object)** para Persistencia | `events`, `identity`, `inventory`, `favorites` | **Aceptado** | 2.ª Entrega Parcial (Desacoplamiento de ORM y soporte dual UUID/legacyId) |
| [ADR-005](ADR-005-patron-adapter-pasarela-soap.md) | **Patrón Adapter** para Pasarela de Pagos Legada (SOAP/WSDL) | `payments` | **Aceptado** | 3er Checkpoint / Eje C (Manejo de Faults sin XML crudo y protección XXE) |
| [ADR-006](ADR-006-patron-circuit-breaker-timeout.md) | **Patrón Circuit Breaker** y Timeout de 5s | `payments` | **Aceptado** | 3er Checkpoint / Eje C (Resiliencia ante caídas externas y fallback) |
| [ADR-007](ADR-007-patron-outbox-mensajeria-rabbitmq.md) | **Patrón Transactional Outbox** y Mensajería Resiliente | `common/broker`, `notifications` | **Aceptado** | 3er Checkpoint / Eje C (Sin pérdida ante caída de broker, consumidor idempotente y DLQ) |
| [ADR-008](ADR-008-patron-gateway-inteligencia-artificial.md) | **Patrón Gateway / Facade** para Asistente de IA | `ai` | **Aceptado** | 3er Checkpoint / Eje E (Inyección directa/indirecta, guardrails temáticos y fallback) |

---

## Estructura de cada ADR
Cada registro sigue el formato estándar:
1. **Título e Identificador**
2. **Estado:** Aceptado e Implementado
3. **Fecha de Decisión**
4. **Contexto y Planteamiento del Problema**
5. **Decisión de Diseño y Patrón Aplicado**
6. **Consecuencias y Beneficios**
7. **Evidencia en Código y Pruebas Automatizadas**

