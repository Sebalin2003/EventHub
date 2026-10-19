# EventHub — Estado unificado del proyecto

**Última actualización:** 19/10/2026
**Base:** `main` @ `d9655b7` + correcciones de la branch `avances-octavio`

Este documento junta en un solo lugar la información que hoy está repartida entre `README.md`, `ESTADO_PROYECTO.md`, `ENTREGA_PARCIAL_2.md`, `documento_tecnico_eventhub.md` y `documento_diseño_api.md`, y la corrige según el código actual.

Todo lo que dice "verificado" se probó levantando la API con PostgreSQL 16 y RabbitMQ 3: los endpoints con `curl` y el frontend con un navegador automatizado (Playwright).

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
8. [Errores encontrados y su estado](#8-errores-encontrados-y-su-estado)
9. [Qué quedó desactualizado en los documentos anteriores](#9-qué-quedó-desactualizado-en-los-documentos-anteriores)
10. [Guion de demo con curl (verificado)](#10-guion-de-demo-con-curl-verificado)
11. [Pendientes](#11-pendientes)

---

## 1. Resumen ejecutivo

**Funciona (verificado):**

- **Login** con JWT contra PostgreSQL. Los perfiles de la pestaña "Demostración" también obtienen un JWT real si la API está levantada; si no, siguen en modo demo local.
- **Catálogo** de eventos desde PostgreSQL. Los borradores no se publican en el catálogo: solo los ve su organizador.
- **Eventos desde la web:** crear, editar, publicar y cancelar se guardan en la base. Si el backend responde con error, la UI lo muestra y no marca nada como "publicado".
- **Publicación:** al publicar se emite `event.created` a RabbitMQ con el email real del organizador, y la notificación se guarda en la tabla `notifications`.
- **Flujo de compra completo por API:**
  1. `POST /orders` toma un HOLD de inventario y calcula los precios en el servidor, y se emite `order.created`.
  2. `POST /orders/:id/pay` cobra mediante el adapter SOAP.
  3. Al aprobarse el pago se confirma el HOLD, se registra la venta en el evento, se emiten los tickets y se emite `order.paid`.
- **Rechazos:** un pago rechazado o un HOLD vencido cancelan la orden y liberan el cupo.
- **Check-in real:** distingue entrada válida, ya utilizada, inválida y de otro evento.
- **Seguridad:** todos los endpoints que modifican datos exigen JWT y el rol correcto. Hay validación global de los bodies, y los ids inválidos dan 404 o 400 en lugar de 500.
- **Build, tests y lint:** sin errores ni warnings.
  - API: `tsc` OK (incluye los tests e2e), build OK, 10/10 tests y lint sin warnings.
  - Web: `tsc` OK, build OK y 8/8 tests.

**Sigue pendiente** (detalle en la [sección 11](#11-pendientes)):

- El checkout, los tickets, el check-in y los reembolsos **de la interfaz web** siguen usando `localStorage`; la API ya los soporta.
- SOAP sigue siendo un mock, porque no hay un servicio legado real.
- Los HOLD viven en memoria.

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
HTTP:    React → Vite proxy (/api) → ValidationPipe → Guards → Controller → Service → DAO / Repository → PostgreSQL

Compra:  POST /orders ──▶ InventoryService.createHold (stateful) ──▶ Order PENDING ──emit──▶ order.created
         POST /orders/:id/pay ──▶ PaymentsService → SoapAdapter → SoapClientService
                              ├─ rechazado → libera HOLD, Order CANCELLED (402)
                              └─ aprobado  → commitHold → Order PAID → EventsService.registerSale
                                             → TicketsService.emit ──emit──▶ order.paid

Async:   EventsService / OrdersService ──emit──▶ RabbitMQ (notifications_queue)
                                                └──▶ NotificationsController (@EventPattern, mismo proceso)
                                                     └──▶ NotificationsService → tabla notifications

REST:    EventsService → Nominatim (OpenStreetMap) para lat/lon al crear un evento o cambiar su ubicación
```

La API corre como **aplicación híbrida**: HTTP en `:3000` más un consumidor RMQ (`main.ts`).

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
cp apps/api/.env.example apps/api/.env   # los defaults ya coinciden con el compose
pnpm --filter api start:dev
pnpm --filter @evenhub/web dev
```

### Variables de entorno de la API (`apps/api/.env.example`)

| Variable | Default en código | docker-compose |
|---|---|---|
| `DB_HOST` | `localhost` | `postgres` |
| `DB_PORT` | `5432` | `5432` |
| `DB_USERNAME` | `user` | `user` |
| `DB_PASSWORD` | `password` | `password` |
| `DB_DATABASE` | `evenhub` | `evenhub` |
| `RABBITMQ_URL` | `amqp://user:password@localhost:5672` | `amqp://user:password@rabbitmq:5672` |
| `JWT_SECRET` | `development-secret`, con un warning al arrancar. **Obligatorio si `NODE_ENV=production`.** | `${JWT_SECRET:-eventhub-dev-secret-cambiar}` |
| `PAYMENTS_WSDL_URL` | WSDL público de ejemplo | — |
| `PORT` | `3000` | `3000` |

Panel de RabbitMQ (solo con la imagen `-management` del compose): http://localhost:15672 (`user` / `password`).

> Si tenés una base de una versión anterior, al arrancar se crean solas las columnas nuevas (`synchronize`). El seed completa `city` y la modalidad "híbrido" en los eventos que ya existían.

### Usuarios del seed (contraseña de todos: `password`)

| Email | Rol | Perfil "Demostración" |
|---|---|---|
| `maria@eventhub.com.ar` | attendee | Asistente |
| `javier@eventhub.com.ar` | attendee | — |
| `lucia@email.com.ar` | attendee | — |
| `marcos@email.com.ar` | attendee | — |
| `eventos@eventhub.com.ar` | organizer (dueño de los 20 eventos del seed) | Organizador |
| `hola@comunidaddigital.ar` | organizer (sin eventos) | — |
| `staff@eventhub.com.ar` | staff | Staff |
| `admin@eventhub.com.ar` | admin | Administrador |

`POST /auth/register` siempre crea usuarios `attendee`: el campo `role` se ignora.

### Verificación

```bash
pnpm --filter api exec tsc --noEmit && pnpm --filter api build && pnpm --filter api test && pnpm --filter api lint
pnpm --filter @evenhub/web exec tsc --noEmit && pnpm --filter @evenhub/web test && pnpm --filter @evenhub/web build
```

`test:e2e` necesita PostgreSQL y RabbitMQ levantados.

---

## 4. Estado por módulo del backend

Todas las rutas aceptan, en `:eventId`, tanto el UUID como el `legacyId` del seed (`e1`, `e2`...).

| Módulo | Endpoints | Auth | Estado |
|---|---|---|---|
| **Identity** | `POST /auth/register`, `POST /auth/login` | — | ✅ Body validado (email, password de 6 caracteres o más). |
| **Events (público)** | `GET /events`, `GET /events/:id` | — | ✅ Solo eventos publicados, cancelados o finalizados. |
| **Events (admin)** | `POST /events` (requiere `organizerId`), `PATCH /events/:id`, `DELETE /events/:id` | JWT + `admin` | ✅ |
| **Events (organizador)** | `GET/POST /organizer/events`, `PATCH /organizer/events/:id`, `POST …/:id/publish`, `POST …/:id/cancel` | JWT + `organizer` (dueño) | ✅ Siempre se crea como borrador y `duration` se calcula sola. Publicar exige ser borrador y tener tipos de entrada; cancelar dos veces da 409. |
| **Favorites** | `GET /me/favorites`, `PUT/DELETE /me/favorites/:eventId` | JWT | ✅ |
| **Inventory** | `GET /inventory/:eventId`, `PUT /inventory/:eventId`, `POST …/holds`, `DELETE …/holds/:holdId`, `POST …/holds/:holdId/commit` | JWT (`PUT`: admin o el organizador dueño) | ✅ Arranca en `capacidad − registrados`. Si el evento no existe da 404. |
| **Orders** | `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/pay`, `POST /orders/:id/cancel` | JWT | ✅ Precios del servidor, HOLD de 5 min, pago, emisión de tickets. |
| **Payments** | `POST /payments` → `{ approved }` | JWT | ⚠️ Adapter SOAP con mock: aprueba si `amount > 0` y la tarjeta pasa Luhn. |
| **Tickets** | `GET /tickets/me`, `PATCH /tickets/:id/cancel` (dueño o admin), `GET /tickets/user/:userId` (admin), `POST /tickets` (admin) | JWT | ✅ Se emiten al pagar una orden. |
| **Check-in** | `POST /check-in/:ticketIdOCodigo/scan` con body opcional `{ eventId }` | JWT + `staff`, `organizer` o `admin` | ✅ Devuelve `ENTRADA_VALIDA`, `ENTRADA_YA_UTILIZADA`, `ENTRADA_INVALIDA` o `ENTRADA_EVENTO_INCORRECTO`. |
| **Notifications** | Consumidor RMQ: `event.created`, `order.created`, `order.paid` | — | ✅ Usa los emails reales del organizador y del comprador. |

---

## 5. Integraciones: RabbitMQ, SOAP y geocoding

| Integración | Tipo | Implementación | Estado |
|---|---|---|---|
| **RabbitMQ** | Asincrónica, cola punto a punto `notifications_queue` (durable) | Productores: `EventsService.publishOwned` (`event.created`) y `OrdersService` (`order.created`, `order.paid`). Consumidor: `NotificationsController`. | ✅ Verificado de punta a punta. |
| **SOAP (pagos legado)** | Sincrónica | `SoapClientService` (cliente `soap`, WSDL configurable con `PAYMENTS_WSDL_URL`). `SoapAdapter implements PaymentGateway`. | ⚠️ La llamada real está comentada porque no hay WSDL de pagos. El mock es determinista: aprueba `4111 1111 1111 1111` y rechaza `4111 1111 1111 1112`. Si el WSDL no responde, loguea un *warning* y no un error. |
| **Geocoding REST** | Sincrónica | `fetch` a Nominatim con `User-Agent` y timeout de 3 s, al crear un evento o cambiar su ubicación. | ✅ Si falla, guarda `lat/lon = null` y loguea un *warning*. |

---

## 6. Patrones de diseño, stateful/stateless y seguridad

| Patrón | Dónde | Comentario para la defensa |
|---|---|---|
| **DAO** | `UserDao`, `EventDao`, `FavoriteDao`, `InventoryDao` | Desacoplan TypeORM de la lógica de negocio. `EventDao.findOne` resuelve tanto UUID como `legacyId`. |
| **Strategy** | `HashStrategy` → `ScryptHashStrategy` (token `HASH_STRATEGY`) | Permite cambiar el algoritmo de hash sin tocar `IdentityService`. |
| **Factory** | `EventFactory.createEvent` | Es el punto único de construcción de `Event`. |
| **Adapter** | `SoapAdapter implements PaymentGateway` | Traduce la respuesta SOAP a un `boolean` para `OrdersService`. |
| **Publish/Subscribe** | `ClientProxy.emit` y `@EventPattern` | Desacopla las notificaciones del flujo principal. |
| **DTO + validación declarativa** | `ValidationPipe({ whitelist: true })` y DTOs con `class-validator` | El cliente no puede fijar `status`, `featured`, `registered`, `sold` ni precios. |

- **Stateful:** `InventoryService` mantiene los HOLD en un `Map`. Un temporizador se inicia en `onModuleInit` y se limpia en `onModuleDestroy`, y las operaciones que modifican el inventario se ejecutan en serie para evitar sobreventa. Los HOLD se pierden al reiniciar la API (limitación conocida).
- **Stateless:** `EventsService` no guarda estado entre requests.
- **Seguridad declarativa:** `JwtAuthGuard` (Bearer, con `sub`, `email` y `role` en `req.user`) más `@Roles(...)` / `RolesGuard`. Las verificaciones de "dueño del recurso" se hacen en los services: eventos e inventario del organizador, órdenes, tickets y HOLD del usuario.

---

## 7. Frontend: qué usa la API y qué es demo local

| Función | Fuente |
|---|---|
| Login (ambas pestañas) | `POST /api/auth/login` y guarda el JWT. La pestaña "Demostración" usa las credenciales del seed; sin backend, sigue en modo local. |
| Catálogo | `GET /api/events`. Sin backend usa el seed local. |
| Eventos del organizador (incluye borradores) | `GET /api/organizer/events` |
| Crear, editar, publicar y cancelar eventos | API, esperando la respuesta. Si falla, muestra un toast de error. Sin token, solo local. |
| Favoritos | API si hay token. |
| HOLD, checkout, pago, órdenes, tickets, reembolsos, check-in, auditoría | **Todavía `localStorage`** (`demoStore.ts`). La API ya tiene estos endpoints: ver [pendientes](#11-pendientes). |

> Si en un navegador quedaron eventos "fantasma" de pruebas anteriores (creados cuando la API fallaba en silencio), usá **Restablecer demo** en la pantalla de login.

---

## 8. Errores encontrados y su estado

Leyenda:

- ✅ Corregido y verificado (curl o navegador).
- ⏳ Pendiente.

### 8.1 Bloqueantes para la demo desde la web

**B1. ✅ Crear o listar órdenes daba 500**

- **Causa:** `orders.controller.ts` usaba `req.user.id`, y el JWT trae `sub`.
- **Arreglo:** se usa `req.user.sub`, y `req.user.email` para la notificación.

**B2. ✅ Crear un evento desde la web daba 500 por falta de `duration`**

- **Arreglo:** `duration` es opcional. Si no se envía, el backend la calcula a partir de `date` y `endDate` (60 min si no hay fin), y valida que `endDate` sea posterior a `date`.

**B3. ✅ "Publicar" y "Cancelar" fallaban sin avisar y mostraban éxito igual**

- **Arreglo:** `OrganizerPortal` y `CreateEventWizard` esperan la respuesta de la API, muestran el mensaje del backend si falla y solo actualizan la UI cuando la operación fue exitosa.

**B4. ✅ Editar, publicar o cancelar los eventos del seed daba 500 (id `e1` en lugar de UUID)**

- **Arreglo:** `EventDao.findOne` resuelve tanto el UUID como el `legacyId`.

**B5. ✅ El login "Demostración" no obtenía JWT, así que nada se guardaba**

- **Arreglo:** el login de demostración inicia sesión en la API con el usuario del seed.
- **Relacionado:** se corrigió el email del organizador del seed del front (`eventos@eventhub.com.ar`), que no coincidía con el del backend.

**B6. ✅ Crear un evento ya "publicado" salteaba `/publish`, así que no se emitía `event.created`**

- **Arreglo:** el backend siempre crea borradores. El wizard llama a `/publish` cuando se elige "Publicar".

### 8.2 Seguridad

| # | Problema | Estado |
|---|---|---|
| S1 | `POST`, `PATCH` y `DELETE /events` no tenían guard. | ✅ Ahora son solo para admin (sin token: 401; como asistente: 403). |
| S2 | `/tickets` no tenía auth: cualquiera emitía tickets o veía los de otro usuario (IDOR). | ✅ `GET /tickets/me` usa el token. Ver los tickets de otro usuario o emitirlos a mano es solo para admin, y cancelar exige ser el dueño o admin. |
| S3 | `/payments` no tenía auth y aceptaba montos negativos. | ✅ Exige JWT, valida `amount > 0` y el formato de la tarjeta. |
| S4 | `/check-in` no tenía auth y aceptaba cualquier string. | ✅ Exige JWT y rol `staff`, `organizer` o `admin`, y valida el ticket de verdad. |
| S5 | Las órdenes confiaban en el precio y la cantidad que mandaba el cliente. | ✅ El precio sale del tipo de entrada del evento. Se valida que la cantidad esté entre 1 y 20, que el tipo exista, que haya stock y que el evento esté publicado. |
| S6 | No había `ValidationPipe`, así que los DTO no validaban nada. | ✅ Hay `ValidationPipe` global con `whitelist` y DTOs para auth, eventos, inventario, órdenes, pagos, tickets y check-in. |
| S7 | Asignación masiva: el organizador podía fijar `featured`, `registered`, `status` o `sold`. | ✅ El `whitelist` descarta esos campos y lo vendido se conserva al editar. Tampoco se puede bajar el cupo por debajo de lo vendido. |
| S8 | Cualquier organizador podía cambiar el inventario de un evento ajeno. | ✅ Solo puede hacerlo el dueño del evento o un admin. |
| S9 | `JWT_SECRET` tenía un default y el compose no lo definía. | ✅ El compose lo define, la API avisa al arrancar sin él y en producción es obligatorio. |
| S10 | `GET /events` mostraba los borradores. | ✅ El catálogo público excluye borradores, y `GET /events/:id` de un borrador da 404. |

### 8.3 Lógica e integración

| # | Problema | Estado |
|---|---|---|
| L1 | El inventario arrancaba en 0 y no se vinculaba con el evento. | ✅ Se inicializa en `capacidad − registrados`, y una venta pagada actualiza `registered` y `sold`. |
| L2 | El flujo Orders → Inventory → Payments → Tickets estaba desconectado. | ✅ Se encadenó: HOLD, pago, commit, venta y tickets. |
| L3 | Los destinatarios de las notificaciones estaban hardcodeados. | ✅ Se usan los emails reales del organizador y del comprador. |
| L4 | Se podía re-publicar un evento (emitiendo `event.created` de nuevo) o publicar uno cancelado. | ✅ Solo se publican borradores. Cancelar un evento ya cancelado o finalizado da 409. |
| L5 | Los ids inválidos daban 500. | ✅ Dan 404 (eventos y favoritos) o 400 (`ParseUUIDPipe` en órdenes). |
| L6 | Se perdía la modalidad "híbrido". | ✅ Se agregó `EventModality.HYBRID`, mapeado de ida y vuelta en el front. |
| L7 | Se perdía la ciudad. | ✅ Se agregó la columna `city`; `location` conserva "dirección, ciudad" para geocodificar. |
| L8 | Había un hack de ids de organizador según el nombre "Río Plata". | ✅ Los usuarios se mapean por email y los eventos por el nombre del organizador del seed; si no hay coincidencia, se usa el UUID. |
| L9 | El geocoding no mandaba `User-Agent` ni tenía timeout. | ✅ |
| L10 | SOAP es un placeholder que siempre aprobaba. | ⏳ Sigue siendo un mock (ahora determinista, con Luhn). Falta un WSDL real de pagos. |
| L11 | Los HOLD están en memoria. | ⏳ Es una limitación de diseño, conviene mencionarla en la defensa. |
| L12 | Check-in era un stub. | ✅ |
| — | **(Nuevo)** El formulario de edición no mostraba las fechas de eventos de la API, porque `datetime-local` no acepta ISO con `Z`. | ✅ Se convierten a hora local y se envían en ISO UTC. |

### 8.4 Infraestructura y tooling

| # | Problema | Estado |
|---|---|---|
| I1 | Los defaults de la API no coincidían con el compose y no había `.env.example`. | ✅ Se alinearon y se agregó `apps/api/.env.example`. |
| I2 | Hay gestores de paquetes mezclados (pnpm y dos `package-lock.json`; el `Dockerfile` usa npm). | ⏳ |
| I3 | Con `NODE_ENV=production` se desactiva `synchronize` y no hay migraciones. | ⏳ |
| I4 | `tsc` fallaba en `test/app.e2e-spec.ts` (`supertest/types`). | ✅ (el e2e sigue necesitando una base real). |
| I5 | El nombre no es consistente: "EvenHub" y "EventHub". | ⏳ |

---

## 9. Qué quedó desactualizado en los documentos anteriores

| Documento | Lo que dice | Realidad |
|---|---|---|
| `README.md` | Usuarios demo `maria@eventHub.com`, `org@techmadrid.es`, etc.; compras solo locales; integraciones fuera de alcance. | Los usuarios son los de la [sección 3](#usuarios-del-seed-contraseña-de-todos-password). La compra existe por API, aunque la UI todavía no la usa. |
| `ESTADO_PROYECTO.md` | Marca como hecho "[x] Integración en Frontend: consumir todo el flujo protegido de compra". | Falso: el checkout de la UI sigue siendo local (ver la [sección 7](#7-frontend-qué-usa-la-api-y-qué-es-demo-local)). |
| `ESTADO_PROYECTO.md` | Marca como pendientes SOAP, RabbitMQ y el documento de diseño. | Están implementados (SOAP como mock) y el documento existe. |
| `documento_tecnico_eventhub.md` (10/09) | "RabbitMQ no tiene productores ni consumidores", "no existen endpoints de Orders, Payments, Tickets ni CheckIn", "Adapter no implementado". | Ya existen. Ver secciones 4–6. |
| `documento_diseño_api.md` | Los guards protegen la compra y la administración de eventos. | Ahora sí es cierto, con estas correcciones. |
| `ENTREGA_PARCIAL_2.md` | Publica `InventoryService` en la cola `event_notifications`, con un notificador externo. | Publican `EventsService` y `OrdersService`, en la cola `notifications_queue`. El consumidor es el mismo proceso NestJS. |
| `ARCHITECTURE.md` | Prefijo `/api/v1`, OpenAPI, `/health/*`, worker separado, outbox. | No está implementado. Las rutas reales son las de la sección 4, sin prefijo (el `/api` lo agrega el proxy de Vite). |
| `guia_estudio_defensa.md` | Ejemplo de DAO con "Mongoose/MongoDB". | El proyecto usa TypeORM y PostgreSQL. |

---

## 10. Guion de demo con curl (verificado)

Requiere `jq`. Si usás Postman, son las mismas requests; guardá los tokens en variables del entorno.

```bash
B=http://localhost:3000
J='Content-Type: application/json'
login() { curl -s -XPOST $B/auth/login -H "$J" -d "{\"email\":\"$1\",\"password\":\"password\"}" | jq -r .accessToken; }

# 1) Login de los tres roles
OTOK=$(login eventos@eventhub.com.ar)   # organizador
TOK=$(login maria@eventhub.com.ar)      # asistente
STAFF=$(login staff@eventhub.com.ar)    # staff

# 2) Catálogo público
curl -s $B/events | jq 'map({id, legacyId, title, status}) | .[0:3]'

# 3) Seguridad declarativa: 401 sin token, 403 con rol incorrecto
curl -s -o /dev/null -w '%{http_code}\n' -XPOST $B/organizer/events                              # 401
curl -s -o /dev/null -w '%{http_code}\n' $B/organizer/events -H "Authorization: Bearer $TOK"      # 403

# 4) Crear un evento (queda en borrador; duration se calcula sola) y publicarlo → event.created
EV=$(curl -s -XPOST $B/organizer/events -H "Authorization: Bearer $OTOK" -H "$J" -d '{
  "title":"Demo EventHub","description":"Evento de demo","category":"taller","modality":"in_person",
  "date":"2026-12-01T10:00:00.000Z","endDate":"2026-12-01T12:00:00.000Z",
  "venue":"UADE","location":"Lima 775, CABA","city":"CABA","capacity":100,
  "ticketTypes":[{"name":"General","price":15000,"totalQuantity":100}]}' | jq -r .id)
curl -s -XPOST $B/organizer/events/$EV/publish -H "Authorization: Bearer $OTOK" | jq '{id, status, duration}'
#   → Log de la API: "Received event.created" y "Notification persisted"

# 5) Inventario (stateful): arranca en la capacidad
curl -s $B/inventory/$EV -H "Authorization: Bearer $TOK"           # available 100

# 6) Orden: el precio lo pone el servidor y toma un HOLD → order.created
ORD=$(curl -s -XPOST $B/orders -H "Authorization: Bearer $TOK" -H "$J" \
  -d "{\"items\":[{\"eventId\":\"$EV\",\"ticketType\":\"General\",\"quantity\":2}]}" | jq -r .id)
curl -s $B/inventory/$EV -H "Authorization: Bearer $TOK"           # available 98, held 2

# 7) Pago rechazado (tarjeta inválida): 402, orden cancelada, HOLD liberado
curl -s -XPOST $B/orders/$ORD/pay -H "Authorization: Bearer $TOK" -H "$J" -d '{"card":"4111111111111112"}' | jq .message

# 8) Nueva orden y pago aprobado → tickets emitidos + order.paid
ORD=$(curl -s -XPOST $B/orders -H "Authorization: Bearer $TOK" -H "$J" \
  -d "{\"items\":[{\"eventId\":\"$EV\",\"ticketType\":\"General\",\"quantity\":2}]}" | jq -r .id)
CODE=$(curl -s -XPOST $B/orders/$ORD/pay -H "Authorization: Bearer $TOK" -H "$J" -d '{"card":"4111111111111111"}' \
  | tee /dev/stderr | jq -r '.tickets[0].code')
curl -s $B/tickets/me -H "Authorization: Bearer $TOK" | jq 'map({code, status})'

# 9) Check-in con staff: válida → ya utilizada
curl -s -XPOST $B/check-in/$CODE/scan -H "Authorization: Bearer $STAFF" -H "$J" -d "{\"eventId\":\"$EV\"}" | jq .result
curl -s -XPOST $B/check-in/$CODE/scan -H "Authorization: Bearer $STAFF" | jq .result

# 10) Favoritos (aceptan legacyId) y estado final del evento
curl -s -XPUT $B/me/favorites/e2 -H "Authorization: Bearer $TOK" | jq .eventId   # 409 si ya estaba
curl -s $B/events/$EV | jq '{registered, ticketTypes: [.ticketTypes[] | {name, sold}]}'
```

Para mostrar la cola en vivo: http://localhost:15672 → Queues → `notifications_queue`.
También se puede consultar la tabla: `docker exec -it evenhub_db psql -U user -d evenhub -c 'select subject, "to", "createdAt" from notifications order by "createdAt" desc limit 5;'`

---

## 11. Pendientes

Están ordenados por impacto.

1. **Conectar el checkout de la web con la API:**
   - `POST /orders` + `POST /orders/:id/pay` en `CheckoutPage`;
   - `GET /orders` y `GET /tickets/me` en "Mis compras" y "Mis entradas";
   - `POST /check-in/:code/scan` en `StaffPortal` y `OrgCheckIn`.

   Hoy esas pantallas usan `demoStore.ts`.
2. **Reembolsos por API:** no existen todavía en el backend (solo en la demo local). Al cancelar un evento, el backend no anula las órdenes pagadas.
3. **SOAP real:** reemplazar el mock cuando haya un WSDL de pagos (`PAYMENTS_WSDL_URL`).
4. **Persistir los HOLD** (por ejemplo en PostgreSQL o Redis) para que sobrevivan a reinicios y funcionen con varias instancias.
5. **Migraciones TypeORM** en lugar de `synchronize` (I3), y unificar en pnpm (I2).
6. Reemplazar `README.md` y `ESTADO_PROYECTO.md` con el contenido de este documento, o dejarlos apuntando acá.
