# Guía Completa de Despliegue: Render (Backend) + Cloudflare Pages (Frontend)

Esta guía detalla el paso a paso para desplegar **EventHub** en producción utilizando la infraestructura en la nube:
- **Backend API & Base de Datos:** [Render](https://render.com) (Web Service NestJS + Managed PostgreSQL).
- **Frontend Web:** [Cloudflare Pages](https://pages.cloudflare.com) (Vite + React 19 SPA).

---

## 1. Despliegue del Backend en Render

Render permite desplegar el backend y la base de datos PostgreSQL de dos formas: **automática con Blueprint** o **manual paso a paso**.

### Opción A: Despliegue Automático con Blueprint (`render.yaml`)

El repositorio incluye el archivo [render.yaml](file:///C:/Users/jazmin/OneDrive/Documentos/EVENTHUB/EventHub-main/EventHub-main/render.yaml) preconfigurado.

1. Inicia sesión en tu cuenta de [Render Dashboard](https://dashboard.render.com/).
2. Haz clic en **New +** $\rightarrow$ **Blueprint**.
3. Conecta tu repositorio de GitHub `EventHub`.
4. Render detectará automáticamente `render.yaml` y te mostrará los dos recursos a crear:
   - **eventhub-db:** Base de datos PostgreSQL gestionada (plan Free).
   - **eventhub-api:** Web Service de Node.js (plan Free).
5. Haz clic en **Apply**. Render creará la base de datos, inyectará `DATABASE_URL` y levantará la API automáticamente.

---

### Opción B: Despliegue Manual Paso a Paso en Render

Si prefieres configurarlo manualmente desde el dashboard:

#### Paso 1: Crear la Base de Datos PostgreSQL en Render
1. En Render Dashboard: **New +** $\rightarrow$ **PostgreSQL**.
2. Completa los datos:
   - **Name:** `eventhub-db`
   - **Database:** `evenhub`
   - **User:** `user`
   - **Region:** Elige la más cercana (ej. Oregon o Frankfurt).
   - **Plan:** Free.
3. Haz clic en **Create Database**.
4. Una vez creada, copia el valor de **Internal Database URL** (o External si te conectas desde fuera de Render).

#### Paso 2: Crear el Web Service de la API en Render
1. En Render Dashboard: **New +** $\rightarrow$ **Web Service**.
2. Selecciona tu repositorio GitHub `EventHub`.
3. Configura los parámetros principales:
   - **Name:** `eventhub-api`
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Plan:** Free
4. En la sección **Environment Variables**, agrega:

| Variable | Valor Recomendado / Descripción |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (o déjalo vacío, Render inyecta su propio puerto) |
| `JWT_SECRET` | Genera una cadena aleatoria segura (ej. `mi-clave-secreta-prod-2026`) |
| `DATABASE_URL` | Pega el enlace de conexión de tu base de datos Render |
| `DB_SYNCHRONIZE` | `true` (crea las tablas automáticamente al iniciar) |
| `DB_SSL` | `true` |
| `FRONTEND_URL` | La URL de tu Cloudflare Pages (ej. `https://eventhub.pages.dev`) |
| `PAYMENTS_WSDL_URL` | `https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL` |
| `RABBITMQ_URL` | *(Opcional)* URL de CloudAMQP o dejar vacío para que use el outbox/fallback local |

5. En **Health Check Path**, configura: `/events`
6. Haz clic en **Create Web Service**.
7. Una vez finalizado el build, copia la URL asignada a tu backend (ej. `https://eventhub-api.onrender.com`).

---

## 2. Despliegue del Frontend en Cloudflare Pages

Cloudflare Pages ofrece hosting global ultrarrápido, certificados SSL automáticos y CDN perimetral para aplicaciones Vite/React.

### Paso 1: Conectar el Repositorio a Cloudflare Pages
1. Inicia sesión en [Cloudflare Dashboard](https://dash.cloudflare.com/) y entra a **Workers & Pages**.
2. Haz clic en **Create application** $\rightarrow$ pestaña **Pages** $\rightarrow$ **Connect to Git**.
3. Selecciona tu repositorio de GitHub `EventHub`.

### Paso 2: Configurar el Build de Cloudflare Pages
Configura los campos de compilación:
- **Project name:** `eventhub-web` (o el nombre que prefieras).
- **Production branch:** `main`.
- **Framework preset:** `Vite` (o `None`).
- **Root directory:** `apps/web`
- **Build command:** `pnpm run build` (o `npm run build`)
- **Build output directory:** `dist`

### Paso 3: Variables de Entorno del Frontend
En la sección **Environment variables (production)**, agrega:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | La URL completa de tu backend en Render **sin barra al final** (ej. `https://eventhub-api.onrender.com`) |
| `NODE_VERSION` | `22` (para asegurar compatibilidad con Node 22) |

### Paso 4: Desplegar
1. Haz clic en **Save and Deploy**.
2. Cloudflare clonará el repositorio, compilará el frontend con Tailwind y publicará la aplicación.
3. El archivo [apps/web/public/_redirects](file:///C:/Users/jazmin/OneDrive/Documentos/EVENTHUB/EventHub-main/EventHub-main/apps/web/public/_redirects) incluido en el proyecto (`/* /index.html 200`) garantiza que el enrutamiento SPA de React funcione al recargar cualquier página interna sin dar error 404.

---

## 3. Conexión y Verificación de Extremo a Extremo

Una vez que ambos servicios están activos:

1. **Configurar CORS en Render:**
   En el servicio `eventhub-api` de Render, asegúrate de que la variable `FRONTEND_URL` coincida con el dominio asignado por Cloudflare Pages (ej. `https://eventhub-web.pages.dev`). La API de EventHub acepta automáticamente cualquier subdominio de `.pages.dev`.

2. **Probar la Conectividad:**
   - Abre la URL de Cloudflare Pages en el navegador.
   - Deberías ver el catálogo de eventos cargado desde la base de datos de Render.
   - Ve a la pestaña **Iniciar sesión** $\rightarrow$ **Demostración** y prueba ingresar como:
     - Asistente: `maria@eventhub.com.ar` / `password`
     - Organizador: `eventos@eventhub.com.ar` / `password`
     - Staff: `staff@eventhub.com.ar` / `password`
     - Admin: `admin@eventhub.com.ar` / `password`
   - Si el backend responde correctamente, el token JWT se almacena y podrás crear eventos, filtrar catálogo, gestionar órdenes y reservar inventario.

---

## 4. Solución de Problemas Comunes

- **Error de CORS en la consola del navegador:**
  Verifica que `FRONTEND_URL` en Render contenga la URL exacta de Cloudflare Pages (incluyendo `https://` y sin barra al final `/`).
- **Error 404 al recargar páginas secundarias en Cloudflare:**
  El archivo `_redirects` en `apps/web/public/` resuelve esto redirigiendo todas las rutas a `/index.html`.
- **La API no conecta a PostgreSQL en Render:**
  Verifica que `DATABASE_URL` esté configurado y que `DB_SSL=true`. Render exige SSL para conexiones gestionadas.
- **Tardanza en la primera petición (Cold Start):**
  En el plan Free de Render, las aplicaciones que no reciben tráfico durante 15 minutos entran en reposo ("spin down"). La primera petición puede demorar ~45 segundos en reactivar el contenedor.
