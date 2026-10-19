# EventHub — Estado unificado del proyecto

**Fecha de relevamiento:** 19/10/2026
**Base:** `main` @ `d9655b7` ("Correcciones a referencias realizadas")
**Branch:** `avances-octavio`

Este documento junta en un solo lugar la información que hoy está repartida entre `README.md`, `ESTADO_PROYECTO.md`, `ENTREGA_PARCIAL_2.md`, `documento_tecnico_eventhub.md` y `documento_diseño_api.md`, y la corrige según el código actual. Todo lo que dice "verificado" se probó contra la API levantada con PostgreSQL 16 y RabbitMQ 3, usando `curl`.

> Los documentos anteriores siguen en el repo. Donde contradicen a este, vale este (detalle en la [sección 9](#9-qué-quedó-desactualizado-en-los-documentos-anteriores)).

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura y stack](#2-arquitectura-y-stack)
3. [Cómo levantar el proyecto](#3-cómo-levantar-el-proyecto)
4. [Estado por módulo del backend](#4-estado-por-módulo-del-backend)
5. [Integraciones: RabbitMQ, SOAP y geocoding](#5-integraciones-rabbitmq-soap-y-geocoding)
6. [Patrones de diseño, stateful/stateless y seguridad](#6-patrones-de-diseño-statefulstateless-y-seguridad)
7. [Frontend: qué usa la API y qué es demo local](#7-frontend-qué-usa-la-api-y-qué-es-demo-local)
8. [Errores encontrados](#8-errores-encontrados)
9. [Qué quedó desactualizado en los documentos anteriores](#9-qué-quedó-desactualizado-en-los-documentos-anteriores)
10. [Guion de demo con curl (verificado)](#10-guion-de-demo-con-curl-verificado)
11. [Próximos pasos sugeridos](#11-próximos-pasos-sugeridos)

---

## 1. Resumen ejecutivo

**Funciona (verificado):**

- Login con JWT contra PostgreSQL (`POST /auth/login`), con contraseñas hasheadas con scrypt.
- Catálogo de eventos desde PostgreSQL, con un seed idempotente de 20 eventos y 8 usuarios.
- CRUD de eventos del organizador vía API (`/organizer/events`), siempre que se envíe `duration`.
- Publicación de eventos: emite `event.created` a RabbitMQ, el consumidor lo recibe y guarda una fila en `notifications`.
- Favoritos protegidos con JWT. Aceptan tanto el `legacyId` (`e1`) como el UUID del evento.
- Inventario con HOLD temporales (stateful, en memoria) y commit persistido. La restricción por rol funciona (`401` sin token, `403` para un asistente).
- Build y tests: API `build` OK y 8 tests OK. Web `tsc` OK, `build` OK y 8 tests OK.

**No funciona o funciona a medias:**

- `POST /orders` y `GET /orders` devuelven **500**, porque se usa `req.user.id` y el token trae `sub`. Con ese cambio de una línea, `order.created` llega bien (verificado).
- **Desde la web no se puede crear ni publicar un evento en la base**, y la UI muestra "publicado" igual. Hay varias causas encadenadas (ver [B2–B6](#81-bloqueantes-para-la-demo-desde-la-web)).
- Checkout, órdenes, tickets, pagos, reembolsos y check-in **de la web** siguen siendo 100 % `localStorage` (`demoStore.ts`). El front no llama a `/orders`, `/payments`, `/tickets`, `/check-in` ni `/inventory`.
- Varios endpoints no tienen autenticación: `/events` (POST, PATCH y DELETE), `/tickets`, `/payments` y `/check-in`.
- Payments (SOAP) y Check-in son *stubs*: siempre aprueban.

**Para la demo:** usar Postman o curl con el [guion de la sección 10](#10-guion-de-demo-con-curl-verificado). El paso de órdenes necesita el arreglo de B1.

---

## 2. Arquitectura y stack

Es un monolito modular en un monorepo pnpm.

```text
EventHub/
├── apps/web/    React 19 + TypeScript + Vite 8 + Tailwind 4 (proxy /api → :3000)
├── apps/api/    NestJS 12 + TypeORM 1 + PostgreSQL + @nestjs/microservices (RMQ) + soap
├── infra/       docker-compose: postgres:15, rabbitmq:3-management, api
└── *.md         documentación
```

Flujos:

```text
HTTP:      React → Vite proxy (/api) → Controller → Service → DAO / Repository → PostgreSQL
Async:     EventsService / OrdersService ──emit──▶ RabbitMQ (notifications_queue)
                                                   └──▶ NotificationsController (@EventPattern, mismo proceso)
                                                        └──▶ NotificationsService → tabla notifications
SOAP:      PaymentsController → PaymentsService → SoapAdapter → SoapClientService (WSDL placeholder)
REST ext.: EventsService.createForOrganizer → Nominatim (OpenStreetMap) para lat/lon
```

La API corre como **aplicación híbrida**: HTTP en `:3000` más un consumidor RMQ (`main.ts`). El productor y el consumidor viven en el mismo proceso.

---

## 3. Cómo levantar el proyecto

### Opción A: todo con Docker Compose

```bash
docker compose -f infra/docker-compose.yml up -d --build   # postgres + rabbitmq + api
pnpm install
pnpm --filter @evenhub/web dev                             # http://localhost:5173
```

### Opción B: infraestructura en Docker y API local

```bash
docker compose -f infra/docker-compose.yml up -d postgres rabbitmq
pnpm install
# Los defaults de la API (postgres/postgres/eventhub) NO coinciden con el compose (user/password/evenhub):
export DB_HOST=localhost DB_PORT=5432 DB_USERNAME=user DB_PASSWORD=password DB_DATABASE=evenhub
export RABBITMQ_URL=amqp://user:password@localhost:5672
pnpm --filter api start:dev
pnpm --filter @evenhub/web dev
```

En PowerShell: `$env:DB_USERNAME='user'`, etc.

### Variables de entorno de la API

| Variable | Default en código | Valor en docker-compose |
|---|---|---|
| `DB_HOST` | `localhost` | `postgres` |
| `DB_PORT` | `5432` | `5432` |
| `DB_USERNAME` | `postgres` | `user` |
| `DB_PASSWORD` | `postgres` | `password` |
| `DB_DATABASE` | `eventhub` | `evenhub` |
| `RABBITMQ_URL` | `amqp://user:password@localhost:5672` | `amqp://user:password@rabbitmq:5672` |
| `JWT_SECRET` | `development-secret` | *(no se define)* |
| `NODE_ENV` | — | *(no se define; con `production` se desactiva `synchronize` y no hay migraciones)* |
| `PORT` | `3000` | `3000` |

Panel de RabbitMQ (solo con la imagen `-management` del compose): http://localhost:15672 (`user` / `password`).

### Usuarios del seed (contraseña de todos: `password`)

| Email | Rol |
|---|---|
| `maria@eventhub.com.ar` | attendee |
| `javier@eventhub.com.ar` | attendee |
| `lucia@email.com.ar` | attendee |
| `marcos@email.com.ar` | attendee |
| `eventos@eventhub.com.ar` | organizer (dueño de los 20 eventos del seed) |
| `hola@comunidaddigital.ar` | organizer (sin eventos) |
| `staff@eventhub.com.ar` | staff |
| `admin@eventhub.com.ar` | admin |

> `POST /auth/register` siempre crea usuarios `attendee`: el campo `role` se ignora (verificado).

### Verificación

```bash
pnpm --filter api build && pnpm --filter api test && pnpm --filter api lint
pnpm --filter @evenhub/web exec tsc --noEmit && pnpm --filter @evenhub/web test && pnpm --filter @evenhub/web build
```

Resultado al 19/10:

- API: build OK, 8/8 tests y lint con 3 *warnings* (variables sin usar en `payments.service.ts` y `events.service.ts`).
- Web: `tsc` OK, build OK y 8/8 tests.
- `test:e2e` necesita PostgreSQL y RabbitMQ. Además, `tsc` sobre `test/` falla porque no encuentra `supertest/types`.

---

## 4. Estado por módulo del backend

| Módulo | Endpoints | Auth | Persistencia | ¿Lo usa la web? | Estado |
|---|---|---|---|---|---|
| **Identity** | `POST /auth/register`, `POST /auth/login` | — | `users` | Sí (solo la pestaña de login real) | ✅ Funciona. No valida el body: `{}` da 500. |
| **Events (público)** | `GET /events`, `GET /events/:id`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id` | **Ninguna** | `events` | `GET` sí | ⚠️ El GET funciona. POST, PATCH y DELETE están abiertos a cualquiera (S1). |
| **Events (organizador)** | `GET/POST /organizer/events`, `PATCH /organizer/events/:id`, `POST …/:id/publish`, `POST …/:id/cancel` | JWT + rol `organizer` | `events` | Sí, pero falla (B2–B6) | ⚠️ Funciona por curl si se manda `duration` y el UUID. |
| **Favorites** | `GET /me/favorites`, `PUT/DELETE /me/favorites/:eventId` | JWT | `favorites` | Sí | ✅ Funciona. Un id inválido da 500 en vez de 404. |
| **Inventory** | `GET /inventory/:eventId`, `PUT /inventory/:eventId` (admin/organizer), `POST …/holds`, `DELETE …/holds/:holdId`, `POST …/holds/:holdId/commit` | JWT (+ rol en PUT) | `inventory` + HOLD en memoria | No | ⚠️ Funciona, pero arranca en 0 para todo evento (L1) y no verifica que el evento sea del organizador (S8). |
| **Orders** | `POST /orders`, `GET /orders`, `GET /orders/:id` | JWT | `orders`, `order_items` | No | ❌ 500 por `req.user.id` (B1). Confía en el precio que manda el cliente (S5). |
| **Payments** | `POST /payments` | **Ninguna** | — | No | ⚠️ Stub: siempre devuelve `true` (S3, L10). |
| **Tickets** | `POST /tickets`, `GET /tickets/user/:userId`, `PATCH /tickets/:id/cancel` | **Ninguna** | `tickets` | No | ⚠️ Funciona, pero sin auth ni vínculo con órdenes (S2, L2). |
| **Check-in** | `POST /check-in/:ticketId/scan` | **Ninguna** | — | No | ❌ Stub: siempre `success: true` (S4, L12). |
| **Notifications** | Consumidor RMQ: `event.created`, `order.created` | — | `notifications` | — | ✅ Funciona. Los destinatarios están hardcodeados (L3). |

---

## 5. Integraciones: RabbitMQ, SOAP y geocoding

| Integración | Tipo | Implementación real | Estado |
|---|---|---|---|
| **RabbitMQ** | Asincrónica (cola punto a punto `notifications_queue`, durable) | Productores: `EventsService.publishOwned` (`event.created`) y `OrdersService.create` (`order.created`). Consumidor: `NotificationsController`, en el mismo proceso. | ✅ `event.created` verificado de punta a punta. `order.created` también, con el arreglo de B1. |
| **SOAP (pagos legado)** | Sincrónica | `SoapClientService` crea el cliente contra un WSDL público de ejemplo (`NumberConversion.wso`). `SoapAdapter` implementa `PaymentGateway`. | ⚠️ La llamada real está comentada: devuelve `{status:'OK'}` siempre, incluso sin WSDL. Si el WSDL no responde, loguea un ERROR al arrancar. |
| **Geocoding REST** | Sincrónica | `fetch` a Nominatim al crear un evento con `location`. | ⚠️ Funciona si hay salida a internet. No manda `User-Agent` (Nominatim lo exige), no tiene timeout y bloquea la creación. Si falla, guarda `lat/lon = null` en silencio. |

---

## 6. Patrones de diseño, stateful/stateless y seguridad

| Patrón | Dónde | Comentario para la defensa |
|---|---|---|
| **DAO** | `UserDao`, `EventDao`, `FavoriteDao`, `InventoryDao` | Desacoplan TypeORM de la lógica de negocio. Orders y Tickets usan `Repository` directo, sin DAO. |
| **Strategy** | `HashStrategy` → `ScryptHashStrategy` (token `HASH_STRATEGY`) | Permite cambiar el algoritmo de hash sin tocar `IdentityService`. |
| **Factory** | `EventFactory.createEvent` | Por ahora solo hace `Object.assign`, pero es el punto único de construcción. |
| **Adapter** | `SoapAdapter implements PaymentGateway` | Traduce la respuesta SOAP a un `boolean`. La interfaz no se inyecta por DI: se instancia con `new`. |
| **Publish/Subscribe (Observer)** | `ClientProxy.emit` y `@EventPattern` | Desacopla las notificaciones del flujo principal. |
| **Inyección de dependencias** | Todo Nest | — |

- **Stateful:** `InventoryService` guarda los HOLD en un `Map`, con un temporizador iniciado en `onModuleInit` y limpiado en `onModuleDestroy`. Los mutadores están serializados con una cola de promesas, que evita sobreventa dentro de la instancia (cubierto por tests). Los HOLD se pierden al reiniciar y no escalan a varias instancias.
- **Stateless:** `EventsService` consulta siempre PostgreSQL.
- **Seguridad declarativa:** `JwtAuthGuard` (Bearer, payload en `req.user` con `sub`, `email` y `role`) más `@Roles(...)` / `RolesGuard`. Se aplica en `/organizer/events`, `/inventory`, `/me/favorites` y `/orders`. No se aplica en `/events` (escritura), `/payments`, `/tickets` ni `/check-in`.

---

## 7. Frontend: qué usa la API y qué es demo local

| Función | Fuente real |
|---|---|
| Catálogo de eventos | `GET /api/events`. Si falla, usa el seed local. Los eventos que existen solo en local **se conservan** junto a los de la API (`demoStore.ts:194`). |
| Login | Pestaña **"Iniciar sesión"**: `POST /api/auth/login` y guarda el JWT. Pestaña **"Demostración"** (la que aparece por defecto): **no habla con la API ni obtiene token**. |
| Favoritos | API si hay token. Sin token manda `Bearer null` → 401 → se ignora. |
| Crear, editar, publicar y cancelar eventos | Intenta la API si hay token; si falla, **traga el error y guarda local** (ver B2–B6). |
| HOLD, checkout, pago, órdenes, tickets, reembolsos, check-in, auditoría | **Solo `localStorage`** (`demoStore.ts`). |

---

## 8. Errores encontrados

Leyenda: ✔ = reproducido con curl o en logs · 📖 = por lectura de código.

### 8.1 Bloqueantes para la demo desde la web

**B1. ✔ Crear o listar órdenes da 500**

- **Dónde:** `apps/api/src/modules/orders/orders.controller.ts:13`, `:19` y `:25`.
- **Causa:** se usa `req.user.id`, pero el JWT trae `sub` (`identity.service.ts`). Por eso:
  - `POST` falla con `null value in column "userId"`.
  - `GET` falla con `Undefined value encountered in property 'Order.userId' of a where condition`.
- **Arreglo:** reemplazar `req.user.id` por `req.user.sub` en los 3 métodos. Con eso `order.created` llega bien (verificado).

**B2. ✔ Crear un evento desde la web da 500 (falta `duration`)**

- **Dónde:** `apps/web/src/api/events.ts:107` (`toApiEvent`).
- **Causa:** el front no manda `duration`, y en la entidad la columna es `int NOT NULL`. Error: `null value in column "duration" of relation "events"`.
- **Arreglo:** calcular `duration` en el backend, en `createForOrganizer` y `updateOwned`, a partir de `date` y `endDate`, como ya hace el seed. Otra opción es mandarla desde `toApiEvent`.

**B3. ✔ "Publicar" y "Cancelar" fallan sin avisar y muestran éxito igual**

- **Dónde:** `apps/web/src/components/organizer/OrganizerPortal.tsx:54-62`.
- **Causa:** el código hace `publishEvent(id).catch(() => undefined)`, después actualiza el estado local y muestra el toast "Evento publicado." sin esperar la respuesta.
- **Lo mismo en el wizard:** `CreateEventWizard.tsx:146` tiene `catch { /* backend offline */ }` y guarda el evento local como si nada.
- **Por qué parece publicado:** como `LOAD_EVENTS` conserva los eventos que existen solo en local, el evento "publicado" aparece en ese navegador pero no está en la base.
- **Arreglo:** hacer `await` de la llamada, mostrar un toast de error si falla y actualizar el estado con la respuesta de la API.

**B4. ✔ Editar, publicar o cancelar los 20 eventos del seed da 500 (id `e1` en lugar de UUID)**

- **Dónde:** `apps/web/src/api/events.ts` (`mapApiEvent` usa `legacyId ?? id`) y `apps/api/src/modules/events/event.dao.ts` (`findOne` por UUID).
- **Causa:** el front llama a `/organizer/events/e1/publish` y PostgreSQL responde `invalid input syntax for type uuid: "e1"`.
- **Arreglo:** que `EventDao.findOne` también resuelva por `legacyId`, como ya hace `FavoritesService`. Otra opción es que el front guarde el UUID para las llamadas a la API.

**B5. 📖 El login "Demostración" no tiene JWT, así que nada se persiste**

- **Dónde:** `LoginPage.tsx:24` (modo por defecto `'demo'`) y `CreateEventWizard.tsx` (`if (accessToken())`).
- **Causa:** con el login de demostración el wizard ni siquiera intenta llamar a la API. Solo la pestaña de login real obtiene token.
- **Problema relacionado:** el organizador del seed del front (`eventos@rioplata.com.ar`) no existe en el backend; allá es `eventos@eventhub.com.ar`.

**B6. ✔ Crear un evento ya "publicado" saltea `/publish`, así que no se emite `event.created`**

- **Dónde:** `toApiEvent` manda `status: 'published'` y el backend lo acepta en `createForOrganizer` (`status: data.status ?? DRAFT`).
- **Arreglo:** ignorar `status` en create y update, y obligar a usar `POST /publish`.

### 8.2 Seguridad

| # | Problema | Evidencia |
|---|---|---|
| S1 | ✔ `POST /events`, `PATCH /events/:id` y `DELETE /events/:id` **no tienen guard**. Cualquiera puede crear, modificar o borrar eventos, y elegir el `organizerId`. | Sin token: crear → 201, PATCH → 200, DELETE → 200. |
| S2 | ✔ `/tickets` no tiene auth. Se pueden emitir tickets para cualquier `userId`, listar los tickets de otro usuario (`GET /tickets/user/:userId`, un IDOR) y cancelar tickets ajenos. | `POST /tickets` sin token → 201. |
| S3 | ✔ `POST /payments` no tiene auth ni validación. Acepta `amount: -5` y devuelve `true`. El número de tarjeta viaja en el body sin tratamiento. | — |
| S4 | ✔ `POST /check-in/:ticketId/scan` no tiene auth y valida cualquier string. | `ticketId=cualquiera` → `success: true`. |
| S5 | ✔ **Orders confía en el cliente:** usa `unitPrice` y `quantity` del body, no verifica que el `ticketType` exista ni que haya stock o un HOLD. | Una orden con `quantity: -3` y `unitPrice: 0.01` quedó con `total: -0.03`. |
| S6 | ✔ No hay `ValidationPipe` global en `main.ts`, así que los decoradores de `CreateOrderDto` no hacen nada y los bodies no se validan. | `POST /auth/register {}` → 500 (`Cannot read properties of undefined (reading 'trim')`). |
| S7 | ✔ Asignación masiva en `createForOrganizer` y `updateOwned` (`Object.assign(event, data)`): el organizador puede fijar `featured`, `registered`, `status`, `ticketTypes[].sold`, etc. | Se creó un evento con `featured: true` y `registered: 9999`. |
| S8 | ✔ `PUT /inventory/:eventId`: **cualquier** organizador puede cambiar el inventario de un evento ajeno, y tampoco se valida que el evento exista. | El organizador 2 modificó el inventario de un evento del organizador 1 → 200. |
| S9 | 📖 `JWT_SECRET` tiene como default `development-secret` y el compose no lo define. | — |
| S10 | ✔ `GET /events` y `GET /events/:id` devuelven también los borradores y los cancelados. El front los filtra, pero la API los expone. | — |

### 8.3 Lógica e integración

| # | Problema | Dónde |
|---|---|---|
| L1 | ✔ Al crear un evento no se crea su inventario, así que todo evento arranca con `available: 0` y `POST /holds` da 409 hasta que alguien hace `PUT /inventory`. El inventario tampoco se relaciona con `capacity` ni con `ticketTypes`, y el commit no actualiza `registered` ni `sold`. `GET /inventory/no-existe` responde 200 con 0. | `inventory.service.ts`, `events.service.ts` |
| L2 | 📖 El flujo de compra está desconectado: Orders, Inventory, Payments y Tickets no se encadenan. La orden queda `pending` para siempre (nadie la pasa a `PAID`) y los tickets se emiten a mano. | `orders.service.ts`, `payments.service.ts`, `tickets.service.ts` |
| L3 | ✔ Los destinatarios de las notificaciones están hardcodeados: `organizador@eventhub.com` en `publishOwned`, y `order.created` no incluye `userEmail`, así que siempre se usa `user@example.com`. | `events.service.ts:95`, `orders.service.ts:43` |
| L4 | 📖 `publishOwned` no verifica el estado: re-publicar emite `event.created` otra vez, y un evento cancelado se puede volver a publicar. | `events.service.ts:86` |
| L5 | ✔ Los ids con formato inválido dan **500** en lugar de 404 o 400: `GET /events/abc`, `PUT /me/favorites/zzz`. | Falta `ParseUUIDPipe` o un manejo del `QueryFailedError`. |
| L6 | 📖 Se pierde la modalidad "híbrido": el enum `EventModality` no la tiene, el seed la convierte en `in_person` y el front la vuelve `presencial`. | `event.entity.ts`, `event.seed.ts:75`, `api/events.ts` |
| L7 | 📖 Se pierde la ciudad al mapear (`city: ''` en `api/events.ts:76`), y la lista del organizador muestra "Recinto, " con la coma colgando. | `api/events.ts`, `OrgEvents.tsx` |
| L8 | 📖 Hack de ids de organizador en el front: los usuarios `organizer` se mapean a `u3` o `u4` según si el nombre empieza con "Río Plata", tanto en `auth.ts:22` como en `api/events.ts:80`. Un tercer organizador se mezcla con `u4`. | `api/auth.ts`, `api/events.ts` |
| L9 | 📖 Geocoding sin `User-Agent` ni timeout (ver sección 5). | `events.service.ts:52` |
| L10 | 📖 SOAP es un placeholder: el WSDL no es de pagos y la llamada está comentada, así que siempre aprueba. | `payments.service.ts` |
| L11 | 📖 Los HOLD están en memoria: se pierden al reiniciar y no funcionan con más de una instancia. Es una limitación de diseño, conviene mencionarla en la defensa. | `inventory.service.ts` |
| L12 | 📖 Check-in no busca el ticket, no cambia su estado a `SCANNED` y no detecta tickets ya usados. | `check-in.controller.ts` |

### 8.4 Infraestructura y tooling

| # | Problema |
|---|---|
| I1 | Los defaults de la API (`postgres/postgres/eventhub`) no coinciden con el compose (`user/password/evenhub`), y no existe un `.env.example`. |
| I2 | Hay gestores de paquetes mezclados: `pnpm-lock.yaml`, un `package-lock.json` vacío en la raíz y otro `package-lock.json` en `apps/api`, que es el que usa el `Dockerfile` (`npm install`). |
| I3 | Con `NODE_ENV=production` se desactiva `synchronize` y no hay migraciones, así que no se crearían las tablas. |
| I4 | `test/app.e2e-spec.ts` no tipa (`supertest/types`) y depende de una base de datos real. |
| I5 | El nombre del proyecto no es consistente: "EvenHub" en el README, el paquete `@evenhub/web` y la base `evenhub`, contra "EventHub" en el repo. |

---

## 9. Qué quedó desactualizado en los documentos anteriores

| Documento | Lo que dice | Realidad al 19/10 |
|---|---|---|
| `README.md` | Usuarios demo `maria@eventHub.com`, `org@techmadrid.es`, etc. | Los usuarios son los de la [sección 3](#usuarios-del-seed-contraseña-de-todos-password). |
| `README.md` | "Integraciones REST/SOAP reales" fuera de alcance. | Existen RabbitMQ (real), SOAP (stub) y geocoding (real). |
| `ESTADO_PROYECTO.md` | Marca como hecho "[x] Integración en Frontend: consumir todo el flujo protegido de compra". | Falso: la compra sigue siendo local. |
| `ESTADO_PROYECTO.md` | Marca Check-in como hecho. | Es un stub. |
| `ESTADO_PROYECTO.md` | Marca como pendientes SOAP, productores y consumidores RabbitMQ y el documento de diseño. | Están implementados (SOAP como stub) y el documento existe (`documento_diseño_api.md`). |
| `documento_tecnico_eventhub.md` (10/09) | "RabbitMQ no tiene productores ni consumidores", "no existen endpoints de Orders/Payments/Tickets/CheckIn", "Adapter no implementado". | Ya existen. Ver secciones 4–6. |
| `documento_diseño_api.md` | "Se utilizan Guards para asegurar la compra de un ticket o la administración de eventos". | `/payments`, `/tickets`, `/check-in` y la escritura en `/events` no tienen guard, y Orders da 500. |
| `ENTREGA_PARCIAL_2.md` | Publica `InventoryService` en la cola `event_notifications`, con un notificador externo. | Publican `EventsService` (al **publicar**) y `OrdersService`, en la cola `notifications_queue`. El consumidor es el mismo proceso NestJS. |
| `ARCHITECTURE.md` | Prefijo `/api/v1`, OpenAPI, `/health/*`, *worker* separado, outbox. | No está implementado. Las rutas reales son las de la sección 4, sin prefijo (el `/api` lo agrega el proxy de Vite). |
| `guia_estudio_defensa.md` | Ejemplo de DAO con "Mongoose/MongoDB". | El proyecto usa TypeORM y PostgreSQL. |

---

## 10. Guion de demo con curl (verificado)

Requiere `jq`. Si usás Postman, son las mismas requests; guardá los tokens en variables del entorno.

```bash
B=http://localhost:3000

# 1) Login organizador y asistente
OTOK=$(curl -s -XPOST $B/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"eventos@eventhub.com.ar","password":"password"}' | jq -r .accessToken)
TOK=$(curl -s -XPOST $B/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"maria@eventhub.com.ar","password":"password"}' | jq -r .accessToken)

# 2) Catálogo
curl -s $B/events | jq '.[0:3] | map({id, legacyId, title, status})'

# 3) Seguridad declarativa: 401 sin token, 403 con rol incorrecto
curl -s -o /dev/null -w '%{http_code}\n' $B/organizer/events                            # 401
curl -s -o /dev/null -w '%{http_code}\n' $B/organizer/events -H "Authorization: Bearer $TOK"  # 403

# 4) Crear un evento como borrador (¡incluir duration!) y publicarlo → event.created en RabbitMQ
EV=$(curl -s -XPOST $B/organizer/events -H "Authorization: Bearer $OTOK" -H 'Content-Type: application/json' \
  -d '{"title":"Demo EventHub","description":"Evento de demo","category":"taller","modality":"in_person",
       "date":"2026-12-01T10:00:00.000Z","endDate":"2026-12-01T12:00:00.000Z","duration":120,
       "venue":"UADE","location":"Lima 775, CABA","capacity":100}' | jq -r .id)
curl -s -XPOST $B/organizer/events/$EV/publish -H "Authorization: Bearer $OTOK" | jq '{id, status}'
#   → En el log de la API: "Received event.created" y "Notification persisted"

# 5) Inventario (stateful): cargar stock, crear un HOLD y confirmarlo
curl -s -XPUT $B/inventory/$EV -H "Authorization: Bearer $OTOK" -H 'Content-Type: application/json' -d '{"available":100}'
HOLD=$(curl -s -XPOST $B/inventory/$EV/holds -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"quantity":2}' | jq -r .id)
curl -s $B/inventory/$EV -H "Authorization: Bearer $TOK"      # available 98, held 2
curl -s -XPOST $B/inventory/$EV/holds/$HOLD/commit -H "Authorization: Bearer $TOK" | jq .status   # "committed"

# 6) Favoritos (acepta legacyId o UUID)
curl -s -XPUT $B/me/favorites/e2 -H "Authorization: Bearer $TOK" | jq .   # 409 si ya estaba en favoritos
curl -s $B/me/favorites -H "Authorization: Bearer $TOK" | jq 'map(.event.title)'

# 7) Orden → order.created en RabbitMQ   ⚠️ requiere el arreglo B1 (req.user.sub)
curl -s -XPOST $B/orders -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d "{\"items\":[{\"eventId\":\"$EV\",\"ticketType\":\"General\",\"quantity\":2,\"unitPrice\":15000}]}" | jq '{id,total,status}'

# 8) Pago (adapter SOAP, stub) y emisión de tickets
curl -s -XPOST $B/payments -H 'Content-Type: application/json' -d '{"amount":30000,"card":"4111111111111111"}'   # true
curl -s -XPOST $B/tickets -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"demo\",\"eventId\":\"$EV\",\"userId\":\"demo\",\"quantity\":2}" | jq 'map(.code)'
```

Para mostrar la cola en vivo: http://localhost:15672 → Queues → `notifications_queue`.
También se puede consultar la tabla: `docker exec -it evenhub_db psql -U user -d evenhub -c 'select subject, "to", "createdAt" from notifications order by "createdAt" desc limit 5;'`

---

## 11. Próximos pasos sugeridos

Están ordenados por impacto y esfuerzo.

1. **B1:** `req.user.id` → `req.user.sub` en `orders.controller.ts`. Es una línea por método.
2. **B2 y B6:** calcular `duration` en el backend e ignorar `status` en create y update.
3. **B3:** hacer `await` y mostrar el error en `handlePublish`, `handleDelete` y en el wizard, sin éxito optimista.
4. **B4:** que `EventDao.findOne` también acepte `legacyId`.
5. **S1–S4:** poner `@UseGuards(JwtAuthGuard, RolesGuard)` en la escritura de `/events` (o eliminarla, porque ya existe `/organizer/events`), en `/tickets` (usando `req.user.sub` en lugar de `:userId`), en `/payments` y en `/check-in` (rol `staff`).
6. **S6:** agregar `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` en `main.ts` y DTOs para eventos y auth (esto también resuelve S7).
7. **S5 y L2:** que la orden tome el precio de `event.ticketTypes`, consuma un HOLD y pase a `PAID` cuando el pago se aprueba, y que se emitan los tickets en ese momento.
8. **L1:** crear el registro de inventario al crear el evento (`available = capacity`).
9. Reemplazar `README.md` y `ESTADO_PROYECTO.md` con el contenido de este documento, o dejarlos apuntando acá.
