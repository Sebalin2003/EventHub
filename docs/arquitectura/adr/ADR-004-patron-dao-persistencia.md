# ADR-004: Implementación del Patrón DAO (Data Access Object) para el Desacoplamiento de Persistencia

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-16 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
En arquitecturas basadas en TypeORM, es común inyectar directamente `Repository<Entity>` en los servicios de negocio (`@InjectRepository(Event) private readonly repo: Repository<Event>`). Sin embargo, esta práctica introduce problemas de diseño:
1. **Acoplamiento Directo al ORM:** Cualquier cambio en la API del ORM o un eventual reemplazo de tecnología de persistencia impacta directamente en las capas de dominio y aplicación.
2. **Consultas Complejas y Repetidas:** Lógicas como la resolución dual de identificadores (UUID estándar v4 vs. identificadores legados del seed como `e1`, `e2` utilizados por la interfaz web) o filtros de visibilidad pública de eventos terminan duplicadas en múltiples métodos del servicio.
3. **Dificultad de Testing:** Mockear la interfaz completa de `Repository<T>` de TypeORM requiere configurar cadenas complejas de `createQueryBuilder`, `find`, `findOneOrFail`, etc., haciendo los tests frágiles y verbosos.

## Decisión
Se implementó el **Patrón Estructural / Persistencia DAO (Data Access Object)** en los módulos principales del backend:
- `UserDao` en `apps/api/src/modules/identity/user.dao.ts`
- `EventDao` en `apps/api/src/modules/events/event.dao.ts`
- `InventoryDao` en `apps/api/src/modules/inventory/inventory.dao.ts`
- `FavoriteDao` en `apps/api/src/modules/favorites/favorite.dao.ts`

### Principales Funcionalidades Encapsuladas en los DAOs:
1. **Resolución Transparente de Identificadores:**
   `EventDao.findOne(id)` detecta automáticamente si el identificador provisto cumple el formato UUID mediante expresión regular o si corresponde a un `legacyId` (`e1`, `e2`, etc.), abstrayendo esta particularidad del resto de la aplicación.
2. **Reglas de Consulta Reutilizables:**
   Métodos semánticos como `findVisible()` (que filtra automáticamente borradores no publicados), `findByOrganizer(organizerId)`, o `findByEmail(email)` centralizan las condiciones de búsqueda SQL.
3. **Mapeo de Errores a Excepciones HTTP Estándar:**
   Cuando una entidad no existe, el DAO lanza inmediatamente `NotFoundException` (HTTP 404 Problem Details), evitando chequeos nulos repetitivos en la capa de servicios.

## Consecuencias y Beneficios
- **Desacoplamiento Estricto:** La capa de negocio (`EventsService`, `IdentityService`, etc.) solo interactúa con contratos limpios de los DAOs, sin conocer las clases internas ni los QueryBuilders de TypeORM.
- **Mantenibilidad:** La coexistencia de UUIDs y códigos legados de demostración se resuelve en un único punto del sistema.
- **Testabilidad Óptima:** Los tests unitarios de los servicios mockean fácilmente interfaces concisas con métodos como `findOne`, `findAll` y `save`.

## Evidencia en Código y Pruebas
- Implementaciones DAO:
  - `apps/api/src/modules/events/event.dao.ts`
  - `apps/api/src/modules/identity/user.dao.ts`
  - `apps/api/src/modules/inventory/inventory.dao.ts`
  - `apps/api/src/modules/favorites/favorite.dao.ts`
- Pruebas unitarias:
  - `apps/api/src/modules/events/event.dao.spec.ts`
  - `apps/api/src/modules/identity/user.dao.spec.ts`
  - `apps/api/src/modules/inventory/inventory.dao.spec.ts`

