# Guía para Levantar el Proyecto Localmente (Sin Docker)

Este documento detalla los pasos para ejecutar el proyecto **EvenHub** en tu máquina local sin depender de contenedores Docker. El proyecto está dividido en dos aplicaciones (frontend y backend) ubicadas en la carpeta `apps`.

## Requisitos Previos

Al no usar Docker, debes tener instalados los siguientes servicios en tu máquina local para que la API funcione correctamente:

1. **PostgreSQL** (versión 15+)
   - Debe estar corriendo en el puerto por defecto `5432`.
   - Crea un usuario: `user`
   - Contraseña del usuario: `password`
   - Crea una base de datos vacía llamada: `evenhub`

2. **RabbitMQ** (versión 3+)
   - Debe estar corriendo en los puertos `5672` (AMQP) y `15672` (Management).
   - Usa las credenciales por defecto: `user` / `password`.

---

## 1. Instalación de Dependencias

El proyecto utiliza `pnpm` como gestor de paquetes. 

1. Abre una terminal en la raíz del proyecto (`EventHub-main`).
2. Si no tienes `pnpm` instalado globalmente, puedes instalar dependencias usando `npx`:
   ```bash
   npx pnpm install
   ```
   *(Nota: si ya instalaste `pnpm` globalmente con `npm install -g pnpm`, puedes ejecutar simplemente `pnpm install`)*.

---

## 2. Configuración de Variables de Entorno

La API necesita saber cómo conectarse a tus servicios locales.
Se ha configurado un archivo `.env` en la ruta `apps/api/.env` con el siguiente contenido:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=evenhub
RABBITMQ_URL=amqp://user:password@localhost:5672
PORT=3000
```
*Si cambiaste alguna credencial o puerto en tus instalaciones de PostgreSQL o RabbitMQ, actualiza este archivo con los datos correctos.*

---

## 3. Ejecutar la Aplicación

Puedes levantar la aplicación en dos modos:

### Modo 1: Solo el Frontend (Modo Demo)
El frontend de EvenHub está preparado para funcionar como una demo aislada usando `localStorage` si no requiere datos del backend de inmediato. Para probar la interfaz rápidamente:

1. Abre una terminal en la raíz del proyecto.
2. Inicia el servidor de desarrollo del frontend:
   ```bash
   npx pnpm --filter @evenhub/web dev
   ```
3. Visita la URL que te indique la terminal (usualmente `http://localhost:5173`).

### Modo 2: Frontend y Backend Completos
Si necesitas que la base de datos y la mensajería funcionen:

1. Asegúrate de que los servicios PostgreSQL y RabbitMQ estén iniciados en tu PC.
2. Abre **una primera terminal** en la raíz del proyecto y levanta la API:
   ```bash
   npx pnpm --filter api start:dev
   ```
3. Abre **una segunda terminal** en la raíz del proyecto y levanta el Frontend:
   ```bash
   npx pnpm --filter @evenhub/web dev
   ```

Con ambos corriendo, la web consumirá los datos provistos por la API local.
