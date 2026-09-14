# Documento Técnico: Arquitectura e Ingeniería de Software de EventHub

**Proyecto:** EventHub  
**Materia:** Desarrollo de Aplicaciones 2 — UADE  
**Versión:** 2.1 — Implementación actual  
**Fecha:** 10 de septiembre de 2026

## 1. Introducción

EventHub es una plataforma web para descubrir eventos, administrar un catálogo y gestionar usuarios, favoritos y disponibilidad. El proyecto está organizado como un monorepo administrado con pnpm. La solución contiene una aplicación web React y una API NestJS. PostgreSQL proporciona persistencia y Docker Compose permite reproducir el entorno local.

El documento describe el código implementado actualmente. Las funciones que todavía pertenecen a la demo local se identifican como limitaciones y no se presentan como funcionalidades del backend.

## 2. Arquitectura general

EventHub utiliza un monolito modular. NestJS se ejecuta como un único backend, dividido en módulos de negocio independientes. Esta decisión evita la complejidad inicial de los microservicios y permite aplicar separación de responsabilidades, inyección de dependencias y capas claramente identificables.

La estructura principal es:

```text
EventHub/
├── apps/web/       Frontend React, TypeScript y Vite
├── apps/api/       API NestJS, TypeORM y PostgreSQL
├── infra/          Docker Compose: PostgreSQL y RabbitMQ
├── pnpm-workspace.yaml
└── documentación técnica
```

El flujo integrado es:

```text
React → Vite proxy (/api) → Controllers NestJS → Services → DAO/TypeORM → PostgreSQL
```

El frontend no accede directamente a la base. Vite redirige `/api` a `http://localhost:3000`. NestJS configura TypeORM desde las variables `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`.

Docker Compose utiliza PostgreSQL 15 y RabbitMQ 3. PostgreSQL se configura con usuario `user`, contraseña `password` y base `evenhub`. RabbitMQ está disponible para una evolución futura, pero actualmente no tiene productores ni consumidores implementados.

## 3. Componentes y arquitectura en capas

### 3.1 Identity

Identity gestiona usuarios y autenticación.

```text
LoginPage / auth.ts → IdentityController → IdentityService → UserDao → User/PostgreSQL
```

El controller expone `POST /auth/register` y `POST /auth/login`. El service normaliza emails, evita duplicados, verifica contraseñas y genera JWT. `UserDao` encapsula el acceso al repositorio TypeORM y `User` representa la tabla `users`.

Las contraseñas no se guardan en texto plano. `ScryptHashStrategy` genera un salt aleatorio y almacena `salt:hash` usando la función `scrypt` de Node.js. Los usuarios iniciales se crean desde el seed con la contraseña de desarrollo `password`; en PostgreSQL se conserva únicamente el hash.

### 3.2 Events

Events administra el catálogo de eventos.

```text
events.ts → EventsController → EventsService → EventDao/EventFactory → Event/PostgreSQL
```

Sus endpoints son `GET /events`, `GET /events/:id`, `POST /events`, `PATCH /events/:id` y `DELETE /events/:id`. El service aplica las operaciones de negocio y delega la persistencia en `EventDao`. `EventFactory` centraliza la creación de entidades.

La entidad `Event` contiene título, descripción, categoría, modalidad, fechas, ubicación, capacidad, estado, organizador, imagen, registros y tipos de entrada en JSONB. `legacyId` conserva identificadores de la demo como `e1`, mientras que PostgreSQL utiliza UUID como clave primaria.

`EventSeed` carga veinte eventos y los usuarios iniciales. La carga es idempotente: verifica el `legacyId` antes de insertar y no duplica datos al reiniciar el backend.

### 3.3 Favorites

Favorites permite administrar favoritos por usuario.

```text
favorites.ts → FavoritesController → FavoritesService → FavoriteDao → Favorite/PostgreSQL
```

Sus endpoints son `GET /me/favorites`, `PUT /me/favorites/:eventId` y `DELETE /me/favorites/:eventId`. El módulo está protegido por JWT. El usuario se obtiene desde el claim `sub`, no desde un header manipulable. La entidad posee una restricción única para evitar duplicar la relación entre usuario y evento.

El frontend utiliza `apps/web/src/api/favorites.ts`. Cuando existe un JWT, carga, agrega y elimina favoritos desde la API. El estado local solo funciona como fallback para la demostración offline.

### 3.4 Inventory

Inventory administra disponibilidad por evento.

```text
InventoryController → InventoryService → InventoryDao → Inventory/PostgreSQL
```

Sus endpoints son `GET /inventory/:eventId` y `PUT /inventory/:eventId`. La entidad almacena `eventId`, cantidad disponible y fecha de actualización. `InventoryDao` crea o actualiza el registro existente, por lo que la disponibilidad permanece después de reiniciar la API.

Los tres componentes principales con capas completas son Identity, Events y Favorites. Inventory agrega una cuarta implementación persistente y sirve como evidencia de estado y autorización.

## 4. Componentes stateful y stateless

### Stateful: Inventory

Inventory mantiene un estado de negocio persistente: la disponibilidad de entradas. El estado se almacena en PostgreSQL y no en un `Map` local. Por eso cualquier instancia del backend puede consultar el mismo valor.

`InventoryService` implementa `OnModuleInit` y `OnModuleDestroy`. En `OnModuleInit` marca el servicio como inicializado; en `OnModuleDestroy` cambia su estado a cerrado. Estos callbacks demuestran que NestJS administra el ciclo de vida del provider.

### Stateless: Events

Events es stateless en ejecución. `EventsService` no conserva eventos en memoria entre solicitudes; cada operación consulta o modifica PostgreSQL a través de `EventDao`. Events también implementa `OnModuleInit` y registra la inicialización del servicio mediante el logger de NestJS.

La distinción es clara: Inventory administra disponibilidad persistente como estado de negocio, mientras Events procesa solicitudes consultando siempre la fuente de datos.

## 5. Patrones de diseño aplicados

### DAO

`UserDao`, `EventDao`, `FavoriteDao` e `InventoryDao` encapsulan TypeORM. Los services no ejecutan consultas directamente. Este patrón reduce el acoplamiento entre negocio y persistencia y facilita cambiar o simular el acceso a datos en pruebas.

### Strategy

`HashStrategy` define las operaciones `hashPassword` y `validPassword`. `ScryptHashStrategy` es la implementación concreta inyectada por NestJS mediante el token `HASH_STRATEGY`. Identity puede cambiar el algoritmo sin modificar el service.

### Factory

`EventFactory` crea entidades Event. El controller no instancia entidades y el service no necesita conocer detalles de construcción. Actualmente la factory es simple, pero establece un punto único para futuras reglas de creación.

### Inyección de dependencias

NestJS administra controllers, services, DAOs, factories y guards mediante inyección de dependencias. Esto permite aplicar los patrones anteriores sin acoplar cada clase a una implementación concreta.

### Patrones no implementados

Adapter, Facade, Transactional Outbox y mensajería RabbitMQ están previstos en la arquitectura futura, pero no se declaran implementados porque no existen actualmente en el código. Payments, Orders, Tickets y CheckIn también permanecen como módulos base o funcionalidades locales de la demo.

## 6. Seguridad declarativa

Identity genera un JWT después de validar el email y el hash de contraseña. El token incluye `sub`, `email` y `role`.

`JwtAuthGuard` extrae `Authorization: Bearer <token>`, verifica la firma y coloca el payload en `request.user`. La ausencia o invalidez del token produce `401 Unauthorized`.

La autorización se implementa mediante `@Roles(...)` y `RolesGuard`. La operación sensible es `PUT /inventory/:eventId`, declarada de esta forma:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ORGANIZER)
```

El comportamiento verificado es:

- Sin token: `401`.
- Usuario `ATTENDEE`: `403 Forbidden`.
- Usuario `ORGANIZER` o `ADMIN`: operación permitida.

Favorites requiere autenticación, pero cada usuario solo opera sobre sus propios favoritos mediante el claim `sub`.

## 7. Frontend e integración

El frontend activo se encuentra únicamente en `apps/web`. `apps/web/src/api/events.ts` carga el catálogo desde `/api/events` y adapta el modelo backend al modelo visual de React. `auth.ts` realiza el login real y guarda el JWT. `favorites.ts` consume las rutas protegidas de favoritos.

El catálogo se carga desde PostgreSQL cuando Docker y el backend están activos. Si el backend no está disponible, el frontend puede usar el estado demo local como fallback. Esta compatibilidad permite mostrar la interfaz sin infraestructura, pero no reemplaza la persistencia real.

Órdenes, tickets, pagos, reembolsos, check-in, holds y auditoría todavía se mantienen en `localStorage` dentro de `demoStore.ts`. Esas funciones no deben interpretarse como módulos backend terminados.

## 8. Infraestructura y ejecución

Instalar dependencias:

```powershell
pnpm install
```

Levantar PostgreSQL y RabbitMQ:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Iniciar la API:

```powershell
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_USERNAME='user'
$env:DB_PASSWORD='password'
$env:DB_DATABASE='evenhub'
pnpm --filter api start:dev
```

Iniciar el frontend en otra terminal:

```powershell
pnpm --filter @evenhub/web dev
```

La API queda en `http://localhost:3000` y el frontend normalmente en `http://localhost:5173`. Si el puerto está ocupado, Vite informa otro puerto disponible.

## 9. Verificación

Backend:

```powershell
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api lint
```

Frontend:

```powershell
pnpm --filter @evenhub/web exec tsc --noEmit
pnpm --filter @evenhub/web test
pnpm --filter @evenhub/web build
```

Se verificaron el login real contra PostgreSQL, la carga de eventos, favoritos autenticados, persistencia de Inventory, rechazo de `ATTENDEE` con `403` y autorización de `ORGANIZER`. Los tests del frontend cubren las reglas del store demo.

## 10. Limitaciones y evolución

La aplicación no posee todavía entidades y endpoints backend para Orders, Payments, Tickets y CheckIn. RabbitMQ está disponible en Docker, pero no tiene consumidores ni productores. Tampoco existe despliegue cloud público. Estas funcionalidades pueden incorporarse posteriormente sin cambiar la separación modular actual.

## Conclusión

La versión actual de EventHub cumple una arquitectura monorepo modular con frontend React, API NestJS y persistencia PostgreSQL. Identity, Events y Favorites tienen capas de presentación, negocio y datos integradas con el frontend. Inventory añade persistencia, lifecycle y control de disponibilidad.

DAO, Strategy y Factory están implementados y justificados. JWT proporciona autenticación y `RolesGuard` aplica autorización declarativa en una operación sensible. Docker Compose permite ejecutar PostgreSQL y RabbitMQ de forma reproducible, mientras que el documento distingue claramente las capacidades reales de las funcionalidades que aún pertenecen a la demo local.
