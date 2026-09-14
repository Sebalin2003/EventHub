# Estado del Proyecto: Backend y Monorepo

## ¿Qué hicimos?
- **Estructuración Monorepo:** Se migró el frontend original (Vite + React) a la carpeta `apps/web`. Se configuró `pnpm-workspace.yaml` para gestionar múltiples paquetes.
- **Instalación y Configuración del Backend:**
  - Se creó un proyecto NestJS desde cero en `apps/api`.
  - Se instalaron las dependencias para base de datos: `@nestjs/typeorm`, `typeorm` y `pg` (PostgreSQL).
  - Se generó la estructura base de los 9 módulos definidos en la arquitectura: `identity`, `events`, `inventory`, `orders`, `payments`, `tickets`, `check-in`, `favorites`, `notifications`.
- **Infraestructura (Docker):** Se creó el archivo `infra/docker-compose.yml` para desplegar localmente **PostgreSQL** (base de datos) y **RabbitMQ** (broker de mensajería).
- **Herramientas Adicionales:** Se instaló e integró la extensión **Ponytail** en `.agents` para reglas y directrices de código.

## ¿Qué falta hacer?
- [x] **Configuración de TypeORM:** Modificar `app.module.ts` en el backend para establecer la conexión con PostgreSQL leyendo variables de entorno.
- [x] **Desarrollo de Módulos (Capa Datos):** Crear las entidades (`Entities`) iniciales para los módulos principales (como Usuarios y Eventos).
- [x] **Desarrollo de Módulos (Capa Negocio/Controlador):** Programar la lógica de autenticación (Identity) y la gestión básica de eventos (Events).
- [x] **Aplicar al menos 3 patrones de diseño distintos** (por ejemplo, DAO, Facade, Adapter, Factory o Strategy).
- [x] **Integración Frontend-Backend:** Configurar los endpoints base en `apps/api` y comprobar que `apps/web` puede realizar peticiones exitosas.
- [x] **Pruebas de Infraestructura:** Levantar `docker-compose up` y verificar la conectividad de los servicios (Postgres/RabbitMQ) desde el backend NestJS.

## Arquitectura implementada

- **Capas:** Identity, Events y Favorites tienen controller, service y DAO/repository. Events agrega además una factory para construir entidades.
- **Strategy:** `HashStrategy` abstrae el hash de contraseñas y utiliza `ScryptHashStrategy` como implementación.
- **Stateful:** `InventoryService` mantiene disponibilidad en memoria y limpia su estado al destruirse.
- **Lifecycle:** Inventory implementa `OnModuleInit` y `OnModuleDestroy`; Events implementa `OnModuleInit`.
- **Seguridad declarativa:** `JwtAuthGuard` valida tokens Bearer en Inventory y Favorites. `RolesGuard` protege `PUT /inventory/:eventId`, permitido solo para `ADMIN` y `ORGANIZER`.
- **Validación:** el build, los tests unitarios y el test e2e del API pasan con PostgreSQL levantado mediante Docker.
- **Migración frontend-backend:** el catálogo de eventos se inicializa en PostgreSQL mediante `EventSeed` y React lo consume desde `/api/events`, con fallback local si el backend no está disponible.
- **Favorites e Inventory:** Favorites consume el API protegido desde React; Inventory persiste disponibilidad en PostgreSQL mediante entidad, DAO y service con lifecycle.
