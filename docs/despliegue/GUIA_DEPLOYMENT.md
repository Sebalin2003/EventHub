# Guía Completa de Despliegue: Todo en Railway (Backend + Frontend + Base de Datos)

Esta guía explica paso a paso cómo desplegar la plataforma **EventHub completa en [Railway](https://railway.app)**:
- **Base de Datos:** PostgreSQL 15 gestionado en Railway.
- **Backend API:** NestJS en Railway (`apps/api`).
- **Broker (Opcional):** RabbitMQ en Railway.
- **Frontend Web:** React 19 + Vite en Railway (`apps/web`).

Tener todo en un único proyecto de Railway simplifica la administración, centraliza métricas y logs en un solo panel y permite conectar los servicios mediante variables dinámicas.

---

## 🏗️ Topología del Proyecto en Railway

```mermaid
flowchart TD
    Client["Navegador / Usuario"] -->|HTTPS| Web["eventhub-web<br/>(Railway Service: apps/web)"]
    Web -->|HTTPS / REST / JWT| API["eventhub-api<br/>(Railway Service: apps/api)"]
    
    subgraph Red Privada Railway (.railway.internal)
        API -->|TCP 5432: DATABASE_URL| Postgres[("PostgreSQL 15<br/>Railway Database")]
        API -.->|AMQP 5672: RABBITMQ_URL| RabbitMQ["RabbitMQ Broker<br/>Docker Service"]
    end
    
    API -.->|SOAP/WSDL| SOAP["Pasarela de Pagos Legada"]
```

---

## 🚀 Paso 1: Crear el Proyecto en Railway

1. Ingresa a [Railway](https://railway.app) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **+ New Project**.
3. Selecciona **Empty Project**. Esto creará un lienzo en blanco para tu proyecto.

---

## 🗄️ Paso 2: Agregar la Base de Datos PostgreSQL

1. En el lienzo del proyecto, presiona `Ctrl + K` (o haz clic en **+ Create**).
2. Selecciona **Database** $\rightarrow$ **Add PostgreSQL**.
3. Railway creará la base de datos en pocos segundos.
4. *(Recomendado)* Haz clic sobre la tarjeta de PostgreSQL y en **Settings** renómbrala a `Postgres`.
5. Railway genera automáticamente la variable `${{Postgres.DATABASE_URL}}` en su red privada interna.

---

## 🐇 Paso 3: (Opcional) Agregar el Broker RabbitMQ

Si deseas activar la mensajería asíncrona real y la cola de mensajes muertos (Dead Letter Queue):

1. Presiona `Ctrl + K` $\rightarrow$ selecciona **Docker Image**.
2. Escribe: `rabbitmq:3-management-alpine` y presiona Enter.
3. Haz clic en la tarjeta creada y ve a la pestaña **Variables**:
   - `RABBITMQ_DEFAULT_USER`: `user`
   - `RABBITMQ_DEFAULT_PASS`: `password`
4. En **Settings**, renombra el servicio a `RabbitMQ`.
5. En la sección **Networking**, haz clic en **Add Port** e ingresa el puerto `5672` (AMQP).

---

## 🔌 Paso 4: Desplegar el Backend API (`apps/api`)

1. En el lienzo, haz clic en **+ Create** $\rightarrow$ **GitHub Repo**.
2. Selecciona tu repositorio: `EventHub`.
3. Haz clic sobre la tarjeta del nuevo servicio y abre la pestaña **Settings**:
   - **Service Name:** `eventhub-api`.
   - **Root Directory:** `apps/api` *(¡indispensable para que Railway compile el backend!)*.
   - El archivo [apps/api/railway.json](file:///C:/Users/jazmin/OneDrive/Documentos/EVENTHUB/EventHub-main/EventHub-main/apps/api/railway.json) ya incluido en el proyecto configura automáticamente el builder Nixpacks y el healthcheck en `/events`.
4. Ve a la pestaña **Variables** y agrega:

| Variable | Valor en Railway | Propósito |
|---|---|---|
| `NODE_ENV` | `production` | Optimización y modo producción. |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Conexión privada directa a PostgreSQL. |
| `DB_SYNCHRONIZE` | `true` | Crea automáticamente las tablas de EventHub al iniciar. |
| `DB_SSL` | `false` | En la red interna de Railway la conexión no requiere SSL. |
| `JWT_SECRET` | `mi-clave-super-secreta-eventhub-2026` | Firma de tokens JWT para autenticación. |
| `PAYMENTS_WSDL_URL` | `https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL` | Contrato WSDL del cliente SOAP. |
| `RABBITMQ_URL` | `amqp://user:password@${{RabbitMQ.RAILWAY_PRIVATE_DOMAIN}}:5672` | *(Solo si agregaste RabbitMQ en el paso 3)* |
| `FRONTEND_URL` | `https://...` *(se completa tras el paso 5)* | Autorización de origen para CORS. |

5. **Generar URL pública para la API:**
   - En **Settings** $\rightarrow$ sección **Networking**.
   - Haz clic en **Generate Domain**.
   - Railway te generará una URL pública (ejemplo: `https://eventhub-api-production.up.railway.app`).
   - **Copia esta URL**, la necesitarás de inmediato para el frontend.

---

## 🌐 Paso 5: Desplegar el Frontend Web (`apps/web`) en Railway

1. En el mismo proyecto de Railway, haz clic nuevamente en **+ Create** $\rightarrow$ **GitHub Repo**.
2. Vuelve a seleccionar el repositorio `EventHub`.
3. Haz clic sobre la nueva tarjeta y ve a la pestaña **Settings**:
   - **Service Name:** `eventhub-web`.
   - **Root Directory:** `apps/web` *(¡fundamental para compilar el frontend!)*.
   - El archivo [apps/web/railway.json](file:///C:/Users/jazmin/OneDrive/Documentos/EVENTHUB/EventHub-main/EventHub-main/apps/web/railway.json) ya preconfigura `npm install && npm run build` y ejecuta `serve -s dist -l $PORT` (con soporte para SPA y React Router).
4. Ve a la pestaña **Variables**:

> [!IMPORTANT]
> En Vite / React, las variables `VITE_*` se compilan dentro de los archivos estáticos de JavaScript durante el build. Por eso, debes configurar esta variable **antes** o redéployar tras asignarla:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | Pega la URL pública generada para tu API en el paso anterior **sin barra final** (ej. `https://eventhub-api-production.up.railway.app`). |

5. **Generar URL pública para el Frontend:**
   - En **Settings** $\rightarrow$ sección **Networking**.
   - Haz clic en **Generate Domain**.
   - Railway te generará una URL pública (ejemplo: `https://eventhub-web-production.up.railway.app`).
   - Copia esta URL del frontend.

---

## 🔒 Paso 6: Cerrar la Configuración de CORS en la API

1. Vuelve al servicio `eventhub-api` en Railway.
2. En la pestaña **Variables**, edita o añade:
   - `FRONTEND_URL`: Pega la URL pública de tu frontend (ej. `https://eventhub-web-production.up.railway.app`).
3. Railway redesplegará la API en pocos segundos.

> [!NOTE]
> La API de EventHub incluye en su configuración de seguridad autorización por defecto para todos los dominios terminados en `.railway.app` y `.up.railway.app`.

---

## ✅ Paso 7: Comprobación de Punta a Punta

Una vez que ambos servicios muestren el indicador verde (**Active**):

1. **Probar el Healthcheck del Backend:**
   Abre en el navegador:
   `https://tu-api.up.railway.app/events`
   Deberás recibir el JSON con los eventos del seed de la base de datos.

2. **Acceder a la Aplicación Web:**
   Abre la URL pública de tu frontend (`https://tu-web.up.railway.app`).
   - El catálogo de eventos se cargará en tiempo real desde la API de NestJS en PostgreSQL.
   - Ve a **Iniciar sesión** $\rightarrow$ pestaña **Demostración**.
   - Prueba iniciar sesión con cualquiera de los perfiles:
     - **Asistente:** `maria@eventhub.com.ar` / `password`
     - **Organizador:** `eventos@eventhub.com.ar` / `password`
     - **Staff:** `staff@eventhub.com.ar` / `password`
     - **Admin:** `admin@eventhub.com.ar` / `password`
   - Prueba publicar un evento como organizador o comprar entradas como asistente para comprobar que el flujo transaccional con reservas HOLD funciona en la nube.

---

## 🔧 Preguntas Frecuentes y Solución de Problemas

- **Al recargar una página secundaria da error 404:**
  El paquete `serve` configurado en `apps/web/package.json` con la bandera `-s` (*single page app*) redirige automáticamente todas las rutas internas a `index.html`.
- **El frontend no carga los eventos:**
  Abre la consola de desarrollador del navegador (`F12` $\rightarrow$ pestaña Network) y verifica que las peticiones se estén enviando a la URL pública de la API y devuelvan `200`. Si sale `localhost:3000`, significa que `VITE_API_URL` no estaba definida al momento de hacer el build: en Railway, ve a `eventhub-web` $\rightarrow$ pestaña **Deployments** $\rightarrow$ haz clic en los tres puntos $\rightarrow$ **Redeploy**.
- **La API dice que no puede conectar a PostgreSQL:**
  Verifica que la variable `DATABASE_URL` sea `${{Postgres.DATABASE_URL}}` y que `DB_SSL` esté en `false` para conexiones internas de Railway.
- **Límite de uso o créditos:**
  Railway ofrece créditos mensuales en su plan Starter/Hobby para mantener ambos servicios y la base de datos funcionando 24/7 sin suspensiones.
