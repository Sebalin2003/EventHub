# ADR-003: Implementación del Patrón Factory para la Creación Consistente de Eventos

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-15 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
La entidad `Event` en EventHub es una estructura compleja que involucra múltiples propiedades obligatorias y opcionales: títulos, descripción, fechas de inicio y fin, cálculo de duración, ubicación física y virtual, geolocalización (latitud/longitud), organizador propietario, estado del ciclo de vida (`DRAFT`, `PUBLISHED`, `CANCELLED`, `FINISHED`), capacidad máxima, y colección de tipos de entradas (`TicketType`).

Instanciar directamente la entidad `new Event()` de forma manual en múltiples partes de la aplicación (en `EventsService`, en los seeds de base de datos `EventSeed`, y en los tests) provocaba:
1. Duplicación de lógica de inicialización y defaults inconsistentes.
2. Dificultad para aplicar reglas de construcción transversales (como asegurar que un evento creado siempre inicie en estado borrador `DRAFT` y con contadores de registrados en cero).
3. Violación del Principio de Responsabilidad Única.

## Decisión
Se implementó el **Patrón Creacional Factory Method / Factory (GoF)** a través de la clase `EventFactory` en `apps/api/src/modules/events/event.factory.ts`.

1. **Responsabilidad de `EventFactory`:**
   Centralizar la instanciación de objetos de dominio `Event`, garantizando que todos los campos requeridos y valores por defecto queden asignados de manera coherente antes de su persistencia.

2. **Inyección en el Servicio de Dominio:**
   `EventsService` inyecta `EventFactory` mediante el contenedor IoC de NestJS:
   ```typescript
   @Injectable()
   export class EventsService {
     constructor(
       private readonly eventDao: EventDao,
       private readonly eventFactory: EventFactory,
       // ...
     ) {}
   }
   ```
   Al crearse un evento por parte de un organizador (`createOwned`), el servicio delega la construcción a `this.eventFactory.createEvent(...)`.

## Consecuencias y Beneficios
- **Punto Único de Construcción:** Cualquier cambio en la estructura de inicialización de los eventos se modifica exclusivamente en `EventFactory`.
- **Desacoplamiento:** Aísla a los controladores y casos de uso de la representación interna de la entidad `Event`.
- **Facilidad de Testing:** Facilita la creación de stubs y mocks en pruebas unitarias del servicio de eventos.

## Evidencia en Código y Pruebas
- Código fuente: `apps/api/src/modules/events/event.factory.ts`
- Uso en el servicio: `apps/api/src/modules/events/events.service.ts`
- Pruebas unitarias: `apps/api/src/modules/events/event.factory.spec.ts`

