# Documento Técnico de Arquitectura e Ingeniería de Software: EventHub

**Proyecto:** EventHub  
**Materia:** Desarrollo de Aplicaciones 2 — UADE  
**Versión:** 2.0  
**Estado:** Implementación actual verificada  
**Fecha:** 10 de septiembre de 2026

## 1. Introducción y alcance

EventHub es una plataforma web para descubrir eventos, administrar un catálogo, gestionar usuarios y conservar favoritos. El proyecto se organiza como un monorepo administrado con pnpm y contiene una aplicación web React y una API NestJS. La persistencia principal del backend se realiza con PostgreSQL y los servicios de infraestructura se ejecutan localmente mediante Docker Compose.

El objetivo de esta versión es integrar el catálogo de eventos, la identidad de usuarios, los favoritos y la disponibilidad de inventario entre frontend, backend y base de datos. La aplicación mantiene todavía algunas funciones de demostración en el navegador, especialmente compras, tickets, pagos, reembolsos y check-in. Es importante distinguir esas funciones locales de las que ya tienen persistencia real.

El sistema actual se divide en dos aplicaciones:

- `apps/web`: SPA desarrollada con React 19, TypeScript y Vite.
- `apps/api`: API REST desarrollada con NestJS, TypeORM y PostgreSQL.

La infraestructura se define en `infra/docker-compose.yml` y contiene PostgreSQL 15 y RabbitMQ 3 con interfaz de administración. RabbitMQ está preparado para futuras integraciones, pero actualmente no existe código de productores o consumidores que lo utilice.

## 2. Arquitectura general

EventHub utiliza un monolito modular. Esto significa que el backend se ejecuta como un único proceso NestJS, pero sus responsabilidades se separan en módulos de dominio. Esta decisión reduce la complejidad operativa de los microservicios y permite mantener límites claros entre las funcionalidades.

El flujo integrado actual es:

```text
Navegador React
      |
      | HTTP /api
      v
Vite Proxy
      |
      v
API NestJS
      |
      +--> Controllers
      +--> Services
      +--> DAO / TypeORM
      |
      v
PostgreSQL
```

El frontend no se conecta directamente a PostgreSQL. Las peticiones pasan por la API. Vite tiene configurado un proxy que transforma `/api/...` en peticiones hacia `http://localhost:3000/...`. Por ejemplo:

```text
GET /api/events
        |
        v
GET http://localhost:3000/events
```

La configuración de TypeORM se encuentra en `apps/api/src/app.module.ts`. Las variables de entorno disponibles son `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_DATABASE`. En el entorno Docker utilizado para desarrollo se emplean `localhost`, `5432`, `user`, `password` y `evenhub`.

## 3. Componentes implementados y capas

La aplicación tiene cuatro componentes backend funcionales. Tres de ellos cumplen con una estructura de presentación, negocio y datos: Identity, Events y Favorites. Inventory también tiene controller, service, DAO y entidad, y se utiliza para demostrar persistencia de disponibilidad y lifecycle.

### 3.1 Identity

Identity administra los usuarios y la autenticación.

```text
LoginPage / API client
        |
        v
IdentityController
        |
        v
IdentityService
        |
        +--> UserDao
        +--> HashStrategy
        +--> JwtService
        |
        v
User entity / PostgreSQL
```

La capa de presentación está formada por `IdentityController`, que expone:

- `POST /auth/register`
- `POST /auth/login`

La capa de negocio es `IdentityService`. Se ocupa de normalizar el email, evitar usuarios duplicados, hashear contraseñas, verificar credenciales y generar el token JWT.

La capa de datos está representada por `UserDao`, `User` y el repositorio TypeORM. `User` contiene email, contraseña hasheada, rol, nombre y fechas de creación y actualización.

Las contraseñas no se guardan en texto plano. `ScryptHashStrategy` genera un salt aleatorio y calcula un hash mediante la función `scrypt` de Node.js. El valor almacenado tiene el formato:

```text
salt:hash
```

Los usuarios de prueba se crean mediante `EventSeed` con la contraseña inicial `password`. En PostgreSQL solo se guarda el hash generado.

### 3.2 Events

Events administra el catálogo de eventos y es el componente más completo del sistema.

```text
Frontend events.ts
        |
        v
EventsController
        |
        v
EventsService
        |
        +--> EventFactory
        +--> EventDao
        |
        v
Event entity / PostgreSQL
```

La capa de presentación expone:

- `GET /events`
- `GET /events/:id`
- `POST /events`
- `PATCH /events/:id`
- `DELETE /events/:id`

La capa de negocio está en `EventsService`. El service coordina la creación, consulta, actualización y eliminación. No realiza consultas SQL directamente: delega la persistencia en `EventDao`.

La capa de datos contiene la entidad `Event` y `EventDao`. La entidad almacena título, descripción, modalidad, fechas, capacidad, ubicación, estado, organizador, imagen, categoría, cantidad registrada y tipos de entrada en formato JSONB.

El backend conserva un `legacyId`, como `e1` o `e5`, para mantener la compatibilidad con los identificadores usados por la interfaz original. El UUID continúa siendo la clave primaria real de PostgreSQL.

`EventSeed` carga en PostgreSQL los veinte eventos iniciales de la demo. El proceso es idempotente: antes de insertar un evento busca su `legacyId` y no vuelve a insertarlo si ya existe.

### 3.3 Favorites

Favorites permite que un usuario autenticado marque y desmarque eventos.

```text
PublicPortal / favorites.ts
        |
        v
FavoritesController
        |
        v
FavoritesService
        |
        +--> FavoriteDao
        +--> EventDao
        |
        v
Favorite entity / PostgreSQL
```

Sus endpoints son:

- `GET /me/favorites`
- `PUT /me/favorites/:eventId`
- `DELETE /me/favorites/:eventId`

`FavoritesController` está protegido con `JwtAuthGuard`. El usuario se obtiene desde el claim `sub` del token y no desde un header enviado por el cliente. Esto evita que un usuario pueda modificar los favoritos de otra persona alterando un identificador en la petición.

`FavoritesService` contiene las reglas de negocio: no permite duplicar un favorito y devuelve un error si se intenta quitar uno inexistente. `FavoriteDao` consulta y modifica la entidad `Favorite`, que tiene una restricción única sobre `userId` y `eventId`.

El frontend utiliza `apps/web/src/api/favorites.ts`. Cuando existe un JWT, carga, agrega y elimina favoritos desde la API. El estado local se conserva para permitir el modo demo sin backend.

### 3.4 Inventory

Inventory administra la disponibilidad por evento. La primera versión utilizaba un `Map` en memoria; esa implementación fue reemplazada por persistencia PostgreSQL para que el estado no se pierda al reiniciar la API.

```text
InventoryController
        |
        v
InventoryService
        |
        v
InventoryDao
        |
        v
Inventory entity / PostgreSQL
```

Sus endpoints son:

- `GET /inventory/:eventId`
- `PUT /inventory/:eventId`

La entidad `Inventory` contiene `eventId`, `available` y `updatedAt`. `InventoryDao` busca y actualiza el registro correspondiente. Si el registro ya existe, lo actualiza; de lo contrario, lo crea.

La operación `PUT /inventory/:eventId` requiere un JWT y autorización con rol `ADMIN` u `ORGANIZER`. Un usuario `ATTENDEE` recibe `403 Forbidden`.

## 4. Componentes stateful y stateless

### 4.1 Componente stateful: Inventory

Inventory es stateful porque mantiene un estado de negocio persistente: la cantidad disponible por evento. El estado reside en PostgreSQL, no en una variable local del proceso. Esto permite que una nueva instancia del backend lea el mismo valor y evita perder la disponibilidad cuando se reinicia NestJS.

Además, `InventoryService` implementa los callbacks de lifecycle de NestJS:

```typescript
export class InventoryService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    this.initialized = true;
  }

  onModuleDestroy() {
    this.initialized = false;
  }
}
```

`OnModuleInit` marca que el servicio está listo para operar. `OnModuleDestroy` libera el estado de lifecycle cuando NestJS cierra el módulo. La persistencia de negocio se conserva en PostgreSQL mediante `InventoryDao`.

### 4.2 Componente stateless: Events

Events se comporta como componente stateless en ejecución. `EventsService` no mantiene una colección de eventos en memoria entre solicitudes. Cada operación consulta o actualiza PostgreSQL a través de `EventDao`. Por eso dos instancias del backend podrían procesar solicitudes diferentes consultando la misma fuente persistente.

Events también implementa `OnModuleInit` y registra la inicialización del servicio. El callback evidencia que el contenedor NestJS administra el ciclo de vida del provider:

```typescript
onModuleInit() {
  this.logger.log('Events service initialized');
}
```

La diferencia entre ambos componentes es que Events no conserva estado propio en memoria, mientras que Inventory administra la disponibilidad persistente como estado de negocio.

## 5. Patrones de diseño aplicados

### 5.1 DAO

El patrón DAO está implementado en `UserDao`, `EventDao`, `FavoriteDao` e `InventoryDao`. Cada DAO encapsula el acceso a TypeORM y evita que los servicios conozcan detalles del repositorio.

Por ejemplo, `EventsService` utiliza:

```typescript
return this.eventDao.findAll();
```

El service no construye consultas ni accede directamente al repositorio. La ventaja es separar las reglas de negocio de la persistencia y facilitar pruebas o cambios de almacenamiento.

### 5.2 Strategy

`HashStrategy` define el contrato para generar y verificar contraseñas. `ScryptHashStrategy` es la implementación actual.

```typescript
export interface HashStrategy {
  hashPassword(password: string): string;
  validPassword(password: string, stored: string): boolean;
}
```

NestJS inyecta la implementación mediante el token `HASH_STRATEGY`. Si en el futuro se necesitara otra estrategia de hashing, IdentityService podría conservarse sin modificar su lógica principal.

### 5.3 Factory

`EventFactory` centraliza la creación de objetos `Event`. `EventsService` solicita al factory una entidad nueva y luego la entrega al DAO:

```typescript
const event = this.eventFactory.createEvent(data);
return this.eventDao.save(event);
```

El patrón evita que el controller o el service conozcan detalles de instanciación de la entidad. La factory actual es simple porque el modelo todavía no necesita variantes complejas.

### 5.4 Inyección de dependencias como soporte arquitectónico

NestJS utiliza inversión de control e inyección de dependencias para construir controllers, services, DAOs, guards y factories. No se presenta como uno de los tres patrones principales exigidos, pero es una decisión transversal que permite aplicar DAO y Strategy sin acoplar las clases a implementaciones concretas.

### Patrones no implementados

El documento no considera implementados Adapter, Facade, Transactional Outbox ni comunicación RabbitMQ. RabbitMQ está disponible en Docker como infraestructura futura, pero el código actual no registra productores ni consumidores. Las integraciones REST de pagos y SOAP de recinto son parte del diseño futuro, no de la implementación actual.

## 6. Seguridad declarativa

La autenticación se realiza mediante JWT. `IdentityService` genera el token después de validar email y contraseña. El token contiene el identificador del usuario, su email y su rol:

```typescript
{
  sub: user.id,
  email: user.email,
  role: user.role
}
```

`JwtAuthGuard` extrae el token desde:

```text
Authorization: Bearer <token>
```

Luego verifica su firma usando el `JwtModule` y coloca el payload en `request.user`. Si falta el token o es inválido, responde `401 Unauthorized`.

La autorización por rol se implementa mediante dos elementos declarativos:

- `@Roles(...)`, que define los roles permitidos.
- `RolesGuard`, que compara el rol del usuario autenticado con los metadatos de la ruta.

La operación sensible es:

```typescript
@Put(':eventId')
@Roles(UserRole.ADMIN, UserRole.ORGANIZER)
```

El controller usa ambos guards:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
```

El comportamiento verificado es:

- Sin token: `401 Unauthorized`.
- Token de `ATTENDEE`: `403 Forbidden`.
- Token de `ORGANIZER` o `ADMIN`: operación permitida.

Favorites también requiere autenticación, aunque no restringe la operación por un rol específico porque cada usuario puede administrar sus propios favoritos.

## 7. Frontend, integración y datos locales

El frontend activo se encuentra únicamente en `apps/web`. La copia antigua ubicada en la raíz fue eliminada para evitar dos aplicaciones React diferentes.

El frontend utiliza tres clientes API:

- `api/events.ts`: carga y adapta eventos desde `/api/events`.
- `api/auth.ts`: realiza login y guarda el JWT.
- `api/favorites.ts`: consulta, agrega y elimina favoritos autenticados.

El adaptador de eventos transforma el modelo del backend al modelo visual de React. Por ejemplo, convierte `published` en `publicado`, `in_person` en `presencial` y usa `legacyId` para mantener compatibilidad con las órdenes demo.

La aplicación sigue utilizando `localStorage` para algunas funciones que aún no tienen backend: órdenes, tickets, pagos, reembolsos, check-in, holds y auditoría. Esto está documentado como alcance pendiente, no como persistencia real de producción.

El frontend tiene un fallback local para mostrar la demo si el backend no está disponible. Cuando PostgreSQL y NestJS están activos, el catálogo de eventos se carga desde la API. La autenticación manual y los favoritos autenticados utilizan el backend.

## 8. Infraestructura y ejecución

Docker Compose levanta:

```text
PostgreSQL: localhost:5432
RabbitMQ AMQP: localhost:5672
RabbitMQ Management: localhost:15672
```

Las credenciales de desarrollo son:

```text
PostgreSQL user: user
PostgreSQL password: password
PostgreSQL database: evenhub
RabbitMQ user: user
RabbitMQ password: password
```

Pasos para ejecutar el sistema completo:

### 8.1 Instalar dependencias

```powershell
pnpm install
```

### 8.2 Levantar infraestructura

```powershell
docker compose -f infra/docker-compose.yml up -d
```

### 8.3 Iniciar el backend

En una terminal:

```powershell
$env:DB_HOST='localhost'
$env:DB_PORT='5432'
$env:DB_USERNAME='user'
$env:DB_PASSWORD='password'
$env:DB_DATABASE='evenhub'
pnpm --filter api start:dev
```

La API queda disponible en `http://localhost:3000`. Al iniciar, TypeORM sincroniza las entidades en desarrollo y `EventSeed` carga usuarios y eventos iniciales.

### 8.4 Iniciar el frontend

En otra terminal:

```powershell
pnpm --filter @evenhub/web dev
```

La aplicación queda disponible normalmente en `http://localhost:5173`. Si el puerto está ocupado, Vite elige otro y lo informa en la terminal.

## 9. Verificación y pruebas

El backend tiene pruebas unitarias y una prueba e2e que inicializa `AppModule` y verifica una respuesta HTTP. Los comandos son:

```powershell
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter api lint
```

El frontend tiene pruebas Vitest para las reglas del store demo y un typecheck/build:

```powershell
pnpm --filter @evenhub/web exec tsc --noEmit
pnpm --filter @evenhub/web test
pnpm --filter @evenhub/web build
```

Durante la verificación funcional se comprobaron estos flujos:

- `GET /events` devuelve eventos cargados desde PostgreSQL.
- Login de un usuario sembrado devuelve JWT.
- Un usuario autenticado puede consultar y modificar sus favoritos.
- Inventory conserva la disponibilidad al escribir y leer desde PostgreSQL.
- Un `ATTENDEE` recibe `403` al intentar actualizar Inventory.
- Un `ORGANIZER` puede ejecutar la misma operación.
- React accede al backend mediante el proxy `/api`.

Una advertencia conocida es la deprecación reportada por la versión de `pg`; no impide la ejecución ni altera el resultado de las pruebas.

## 10. Limitaciones y evolución

La implementación actual no incluye todavía:

- Entidades y endpoints reales de Orders.
- Persistencia backend para Payments.
- Emisión y consulta de Tickets desde la API.
- Check-in persistido en PostgreSQL.
- Consumidores y productores RabbitMQ.
- Integraciones externas REST o SOAP.
- Despliegue público en Railway, Supabase o una plataforma cloud.

Estas funciones permanecen en la demo frontend o en módulos NestJS vacíos. La arquitectura deja puntos de extensión, pero el documento distingue explícitamente la propuesta futura del código que ya fue implementado.

## Conclusión

EventHub cuenta actualmente con una arquitectura monorepo modular, cuatro componentes backend funcionales y tres componentes con integración frontend, backend y PostgreSQL: Identity, Events y Favorites. Inventory agrega persistencia y seguridad por rol, además de evidencias de lifecycle administrado por NestJS.

Los patrones DAO, Strategy y Factory están implementados y justificados. JWT proporciona autenticación y `RolesGuard` implementa autorización declarativa en una operación sensible. PostgreSQL y RabbitMQ se ejecutan de forma reproducible mediante Docker Compose.

La principal limitación es que las compras y operaciones posteriores al catálogo todavía pertenecen a la demo local. Esta limitación está documentada para que la evaluación pueda distinguir los componentes terminados de las funcionalidades planificadas.
