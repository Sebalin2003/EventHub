# Manual de Usuario — EventHub

**Versión:** 1.0 (entrega de testing — 07/11/2026)
**Aplicación:** EventHub — plataforma de publicación de eventos y venta de entradas
**URL local:** http://localhost:5173

Este manual permite ejecutar las tareas principales del sistema sin conocimientos previos. Cada tarea indica los pasos exactos y el resultado que debe observarse. Si el resultado no coincide, se registra un defecto de documentación indicando la tarea y el paso.

---

## 1. Requisitos previos

1. Tener Docker Desktop iniciado.
2. Abrir una terminal en la raíz del repositorio y ejecutar:

   ```bash
   docker compose up -d --build --wait
   ```

3. Esperar a que los cuatro contenedores queden `healthy`:

   ```bash
   docker ps
   ```

   Deben aparecer `eventhub_db`, `eventhub_broker`, `eventhub_api` y `eventhub_web` con estado `(healthy)`.

4. Abrir el navegador en **http://localhost:5173**.

> La aplicación usa datos de demostración guardados en el navegador (`localStorage`). Si una tarea no muestra el estado esperado porque se ejecutó antes, usar **Restablecer demo** en la pantalla de inicio de sesión y volver a empezar.

---

## 2. Credenciales y datos de prueba

### 2.1 Acceso rápido (demostración)

En la pantalla **Iniciar sesión** → pestaña **Demostración**, elegir un perfil y presionar **Entrar como …**:

| Perfil | Uso |
|---|---|
| Asistente | Comprar entradas, ver favoritos, entradas y compras |
| Organizador | Crear y publicar eventos, ver ventas y asistentes |
| Staff | Validar entradas en la puerta |
| Administrador | Ver usuarios, organizadores, eventos y auditoría |

### 2.2 Acceso con credenciales reales (API)

En la pantalla **Iniciar sesión** → pestaña **Con credenciales**, usar:

| Rol | Email | Contraseña |
|---|---|---|
| Asistente | `maria@eventhub.com.ar` | `password` |
| Organizador | `eventos@eventhub.com.ar` | `password` |
| Staff | `staff@eventhub.com.ar` | `password` |
| Administrador | `admin@eventhub.com.ar` | `password` |

El login con credenciales se valida contra la API real y devuelve un JWT. El login por demostración también obtiene un JWT real, pero asocia el perfil a los datos demo precargados.

### 2.3 Datos precargados útiles

- **Evento para comprar:** «E-commerce para Emprendimientos» (online, 12/11/2026).
- **Evento para check-in:** «Argentina Tech Summit 2026».
- **Entradas para check-in:** `TKT-001`, `TKT-002`, `TKT-003` (activas) y `TKT-004` (ya utilizada).
- **Tarjeta de prueba:** `4242 4242 4242 4242`, nombre `MARIA GONZALEZ`, vencimiento `12/30`, CVV `123`.
- **Resultado del pago:** en el checkout hay un selector **Resultado de la demo** con las opciones **Aprobado** y **Rechazado**.

---

## 3. Tareas del asistente

### Tarea A1 — Iniciar sesión

1. En http://localhost:5173, presionar **Iniciar sesión** (arriba a la derecha).
2. Elegir la pestaña **Con credenciales**.
3. Completar email `maria@eventhub.com.ar` y contraseña `password`.
4. Presionar **Iniciar sesión**.

**Resultado esperado:** vuelve al catálogo, aparece el nombre **María** en la barra superior y se ven los enlaces **Mis favoritos**, **Mis entradas** y **Mis compras**. En la barra se muestra el nombre del usuario autenticado.

**Error esperado:** con una contraseña incorrecta se muestra un mensaje de error y no se inicia sesión.

### Tarea A2 — Explorar, filtrar y buscar eventos

1. Presionar **Explorar** en la barra superior.
2. En el selector **Categoría**, elegir **Webinar**.

**Resultado esperado:** se muestran 2 eventos y el contador dice «2 eventos».

3. En el campo **Buscar**, escribir `E-commerce`.

**Resultado esperado:** queda 1 evento y el contador dice «1 evento».

4. Presionar la tarjeta del evento **E-commerce para Emprendimientos**.

**Resultado esperado:** se abre el detalle con el título, la fecha, la ubicación, la sección **Entradas** y el botón **Elegir entradas**.

### Tarea A3 — Guardar un favorito

1. Estando en el detalle de un evento, presionar el botón de favorito (corazón).
2. Ir a **Mis favoritos** en la barra superior.

**Resultado esperado:** el evento aparece en la lista de favoritos.

3. Recargar la página (F5) y volver a **Mis favoritos**.

**Resultado esperado:** el favorito sigue presente (persistencia en el almacenamiento local y, con sesión real, en la API).

### Tarea A4 — Comprar una entrada (flujo completo)

1. Explorar y abrir el evento **E-commerce para Emprendimientos**.
2. Presionar **Elegir entradas**.
3. En **Checkout**, seleccionar el tipo de entrada (por ejemplo, la primera opción).
4. Presionar **+** (Añadir una entrada) hasta que la cantidad sea **2**.
5. Presionar **Reservar y continuar**.

**Resultado esperado:** se muestra el paso **Medio de pago** y un temporizador de reserva (5 minutos).

6. Con **Tarjeta** seleccionada, completar:
   - Número: `4242 4242 4242 4242`
   - Nombre: `MARIA GONZALEZ`
   - Vencimiento: `12/30`
   - CVV: `123`
7. Verificar que **Resultado de la demo** esté en **Aprobado**.
8. Presionar **Confirmar compra — $ …**.

**Resultado esperado:** se abre la pantalla **Compra confirmada**, con el número de orden y 2 entradas emitidas.

9. Presionar **Ver mis entradas**.

**Resultado esperado:** se abre **Mis entradas** y aparece la entrada del evento comprado.

### Tarea A5 — Ver el detalle de una entrada y descargarla

1. Ir a **Mis entradas**.
2. Presionar una entrada para expandirla.

**Resultado esperado:** se muestran el código, el estado y el código QR.

3. Presionar el botón de descarga.

**Resultado esperado:** se descarga un archivo PNG con la entrada. Si el navegador bloquea la descarga, aparece una notificación de error sin romper la pantalla.

### Tarea A6 — Provocar un pago rechazado (camino alternativo)

1. Repetir los pasos 1 a 7 de la tarea A4.
2. En **Resultado de la demo**, elegir **Rechazado**.
3. Presionar **Confirmar compra**.

**Resultado esperado:** se muestra «El pago fue rechazado…», no se emite ninguna entrada y la reserva temporal se libera. Se puede volver a intentar.

---

## 4. Tareas del organizador

### Tarea O1 — Crear y publicar un evento

1. Iniciar sesión con el perfil **Organizador** (o `eventos@eventhub.com.ar` / `password`).
2. En el portal, presionar **+ Nuevo evento** (o **Crear evento**).
3. Completar el asistente de 5 pasos:
   - **Paso 1 — Información:** título, descripción, fecha y hora de inicio y de fin. Presionar **Siguiente →**.
   - **Paso 2 — Ubicación:** nombre del lugar, dirección, ciudad y capacidad. Presionar **Siguiente →**.
   - **Paso 3 — Entradas:** nombre del tipo de entrada, precio, cantidad y descripción. Presionar **Siguiente →**.
   - **Paso 4 — Configuración:** dejar los valores por defecto. Presionar **Siguiente →**.
   - **Paso 5 — Publicación:** revisar la vista previa y presionar **Publicar evento →**.
4. Ir a **Eventos** en el menú lateral.

**Resultado esperado:** el evento aparece en **Mis eventos** con el estado **Publicado** y el título exacto ingresado.

### Tarea O2 — Ver ventas y asistentes

1. En el portal del organizador, presionar **Ventas**.

**Resultado esperado:** se listan las órdenes con fecha, comprador, evento, cantidad y total; el total general coincide con la suma de las órdenes mostradas.

2. Presionar **Asistentes**.

**Resultado esperado:** se listan los asistentes de los eventos del organizador.

### Tarea O3 — Cerrar sesión

1. Presionar **Cerrar sesión** al pie del menú lateral.

**Resultado esperado:** vuelve a la pantalla de inicio de sesión y desaparecen las opciones privadas.

---

## 5. Tareas del staff

### Tarea S1 — Validar una entrada

1. Iniciar sesión con el perfil **Staff** (o `staff@eventhub.com.ar` / `password`).
2. En **Seleccionar evento**, presionar **Argentina Tech Summit 2026**.
3. En el campo **Escanear código QR o introducir ID**, escribir `TKT-001`.
4. Presionar **Validar**.

**Resultado esperado:** se muestra **Entrada válida**, el nombre del asistente y el evento. El contador de ingresados aumenta.

### Tarea S2 — Detectar el doble uso

1. Sin salir de la pantalla anterior, volver a escribir `TKT-001`.
2. Presionar **Validar**.

**Resultado esperado:** se muestra **Entrada ya utilizada** y no se incrementa el contador de ingresados.

### Tarea S3 — Probar una entrada inválida

1. Escribir `TKT-NO-EXISTE`.
2. Presionar **Validar**.

**Resultado esperado:** se muestra **Entrada inválida**.

> Para repetir las tareas S1 y S2 desde cero, usar **Restablecer demo** en la pantalla de inicio de sesión. El check-in del frontend usa el almacenamiento local de la demostración.

---

## 6. Tareas del administrador

### Tarea AD1 — Consultar usuarios y auditoría

1. Iniciar sesión con el perfil **Administrador** (o `admin@eventhub.com.ar` / `password`).
2. Presionar **Usuarios** en el menú lateral.

**Resultado esperado:** se listan los usuarios con su rol y estado.

3. Presionar **Auditoría**.

**Resultado esperado:** se muestra el **Registro de auditoría** con las acciones del sistema.

4. Presionar **Eventos** y luego **Organizadores**.

**Resultado esperado:** se listan todos los eventos y todos los organizadores.

---

## 7. Tareas transversales

### Tarea T1 — Cambiar el idioma

1. En la barra superior, usar el selector de idioma y elegir **English**.
2. Verificar que los textos de navegación cambian (por ejemplo, **Home**, **Explore**).
3. Volver a **Español**.

**Resultado esperado:** la interfaz cambia de idioma sin recargar ni perder la sesión.

### Tarea T2 — Verificar el diseño responsive

1. Abrir las herramientas del navegador (F12) y activar el modo dispositivo.
2. Probar los anchos **360 px**, **768 px** y **1280 px** en: inicio, explorar, detalle de evento y portal del organizador.

**Resultado esperado:** el contenido se reacomoda, no aparece una barra de desplazamiento horizontal y todos los controles siguen siendo accesibles. En 360 px la navegación se ofrece mediante el selector **Navegación principal**.

### Tarea T3 — Recargar en medio de una operación

1. Iniciar una compra y llegar al paso **Medio de pago**.
2. Recargar la página (F5).

**Resultado esperado:** la aplicación vuelve a un estado consistente. Si la reserva temporal sigue vigente, se conserva; si venció, se informa y se libera el inventario. No se emite una orden duplicada.

### Tarea T4 — Volver atrás durante el checkout

1. Iniciar una compra y llegar al paso **Medio de pago**.
2. Presionar el botón **Cancelar y volver** (o el enlace del breadcrumb).

**Resultado esperado:** se libera la reserva temporal, se vuelve al detalle del evento y las entradas vuelven a estar disponibles.

---

## 8. Mensajes y problemas frecuentes

| Situación | Mensaje / comportamiento esperado | Qué hacer |
|---|---|---|
| Contraseña incorrecta | Error de credenciales, la sesión no se inicia | Verificar email y contraseña; usar `password` |
| La reserva temporal vence | «La reserva temporal venció…» y se vuelve al paso 1 | Volver a seleccionar entradas |
| Pago rechazado | «El pago fue rechazado…» y se libera la reserva | Revisar el selector de resultado y reintentar |
| Entrada ya utilizada | «Entrada ya utilizada» | Usar otra entrada o restablecer la demo |
| Evento sin stock | El tipo de entrada figura como no disponible | Elegir otro tipo de entrada u otro evento |
| No se ven datos demo | Catálogo vacío o estados inesperados | Presionar **Restablecer demo** y volver a iniciar sesión |
| El puerto 5173 no responde | El navegador no carga la aplicación | Ejecutar `docker compose up -d --build --wait` y verificar `docker ps` |

---

## 9. Registro de la prueba del manual

| Fecha | Tarea elegida | Ejecutada por | Resultado | Defecto de documentación |
|---|---|---|---|---|
| Pendiente | — | Docente | Pendiente de ejecución en clase | — |

> La prueba del manual consiste en que el docente elige una tarea al azar y la ejecuta siguiendo exclusivamente este documento. Cualquier paso ambiguo o resultado distinto se registra como defecto de documentación en la tabla anterior y en Jira.
