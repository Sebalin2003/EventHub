# Diseño de la API REST, SOAP y Mensajería (RabbitMQ)

Este documento describe la arquitectura implementada para la Actividad Final Integradora — Clase 10, cubriendo la exposición de la API REST, su conexión con servicios legados SOAP y el flujo asincrónico mediante mensajería.

## 1. Arquitectura General
El backend de EventHub (basado en NestJS) está estructurado en módulos, y se encarga de:
1. **Exponer endpoints RESTful** consumidos por el cliente frontend (React).
2. **Integrar un servicio SOAP** (`PaymentsService`) usando el cliente `soap` para procesar pagos de manera síncrona.
3. **Emitir y consumir eventos asincrónicos** a través de RabbitMQ para las notificaciones (Emails).

## 2. API REST
Los controladores de la aplicación se agrupan por dominio:
- `EventsController` y `OrganizerEventsController`: Gestión del catálogo de eventos y CRUD para organizadores.
- `OrdersController`: Manejo de compras de tickets, cálculo de totales.
- `PaymentsController`: Procesamiento de pagos (proxy al servicio SOAP).

Se utilizan **Guards** (e.g. `JwtAuthGuard`, `RolesGuard`) para asegurar los endpoints de la API (por ejemplo, la compra de un ticket o administración de eventos).

## 3. Integración SOAP (Pasarela de Pagos)
- **Implementación:** Se agregó el paquete `soap` y se creó el `SoapClientService` en el módulo de pagos.
- **Flujo:** Cuando un usuario intenta realizar un pago a través del `PaymentsController`, el controlador invoca al `PaymentsService`. Éste, usando el patrón **Adapter**, traduce la solicitud al `SoapClientService`, que finalmente realiza el request al endpoint WSDL (legado) y procesa la respuesta XML retornando un estado (`OK` o `ERROR`).

## 4. Mensajería Asincrónica (RabbitMQ)
Para evitar bloqueos en el flujo principal y garantizar un sistema reactivo y distribuido, se implementó el patrón Publicador-Suscriptor con `@nestjs/microservices`.

### 4.1. Productores
Los servicios principales emiten eventos a la cola `notifications_queue`:
- `EventsService`: Al publicar un evento (estado `PUBLISHED`), emite `event.created`.
- `OrdersService`: Al crear una orden de compra exitosamente, emite `order.created`.

### 4.2. Consumidores
- El `NotificationsController` está suscrito a los patrones `event.created` y `order.created` usando el decorador `@EventPattern`.
- Al recibir el mensaje desde RabbitMQ, procesa la carga útil e invoca al `NotificationsService`.
- El servicio simula el envío del correo electrónico y **persiste la notificación en la base de datos PostgreSQL** (tabla `notifications`) como registro de auditoría, asegurando trazabilidad de las alertas.

## 5. Despliegue e Infraestructura
Toda la infraestructura se define en `infra/docker-compose.yml`, que ahora orquesta:
- **Postgres:** Almacenamiento persistente relacional.
- **RabbitMQ:** Message broker para los eventos asíncronos.
- **API NestJS:** Se ejecuta en su contenedor Dockerizada, conectándose transparentemente a las bases de datos y colas por medio de la red interna de Docker.
