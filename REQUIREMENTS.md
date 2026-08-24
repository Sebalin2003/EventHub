# Requisitos de EvenHub

## 1. Propósito

Este documento define el comportamiento esperado de EvenHub y los criterios verificables con los que se considerará completa cada función. Complementa `PRODUCT.md` y `DESIGN.md`: el primero define el producto y sus usuarios; el segundo define cómo debe verse y comportarse visualmente.

## 2. Alcance

EvenHub permite descubrir y comprar entradas, administrar favoritos, órdenes y tickets, seleccionar asientos cuando corresponda y solicitar cancelaciones o reembolsos. También permite a organizadores operar eventos y ventas, al staff validar accesos y a administradores supervisar la plataforma.

La implementación se divide en dos etapas:

- **Frontend actual:** experiencia navegable con datos locales, persistencia limitada al navegador y servicios simulados.
- **Sistema integrado:** backend, base de datos, autenticación real, pagos externos, mensajería, integraciones SOAP/REST y transacciones.

## 3. Fuentes y convención

Los identificadores `RF03`, `RF06` y `RF15` conservan la numeración indicada por el material funcional mencionado por el usuario. El resto de la numeración organiza el alcance visible en el prototipo local y deberá reconciliarse si se incorpora posteriormente el JSON funcional original.

Prioridades:

- **Must:** necesario para el alcance comprometido.
- **Should:** importante, pero puede entregarse después del flujo principal.
- **Could:** mejora opcional.

## 4. Actores

| Actor | Responsabilidad |
|---|---|
| Visitante | Explorar eventos y consultar detalles; debe autenticarse para guardar, comprar o administrar información personal. |
| Asistente | Comprar entradas, administrar favoritos, órdenes, tickets y solicitudes de reembolso. |
| Organizador | Crear eventos, administrar inventario y localidades, consultar ventas y asistentes. |
| Staff | Validar entradas y registrar resultados de check-in para eventos autorizados. |
| Administrador | Supervisar usuarios, organizadores, eventos y registros de auditoría. |
| Sistema de pago | Autorizar, rechazar y reembolsar pagos mediante una integración REST. |
| Sistema legado | Intercambiar información mediante SOAP en el escenario aprobado para el TP. |

## 5. Requisitos funcionales

### RF01 — Autenticación y autorización

**Prioridad:** Must

El sistema debe permitir iniciar y cerrar sesión y restringir las operaciones según el rol del usuario.

**Criterios de aceptación:**

- Un visitante puede explorar eventos sin autenticarse.
- Guardar favoritos, comprar, consultar órdenes y descargar entradas requiere una sesión de asistente.
- Organizador, staff y administrador solo pueden acceder a las funciones autorizadas para su rol.
- Cerrar sesión elimina el acceso a información privada sin borrar los datos persistidos del usuario.

### RF02 — Exploración y búsqueda de eventos

**Prioridad:** Must

El sistema debe mostrar eventos publicados y permitir buscar, filtrar y ordenar los resultados.

**Criterios de aceptación:**

- Solo los eventos publicados aparecen en la experiencia pública.
- La búsqueda contempla al menos título, ciudad y organizador.
- Se puede filtrar por categoría y modalidad y ordenar por fecha, popularidad o precio.
- Una búsqueda sin coincidencias muestra un estado vacío con una acción para recuperar resultados.

### RF03 — Favoritos con persistencia

**Prioridad:** Must

El asistente debe poder guardar y quitar eventos mediante un control de corazón y consultar el listado `Mis favoritos`.

**Criterios de aceptación:**

- El corazón comunica visual y textualmente si el evento está guardado.
- El control es operable con teclado y expone un nombre accesible como `Guardar en favoritos` o `Quitar de favoritos`.
- Los favoritos se conservan después de recargar o reabrir la aplicación.
- La lista está asociada al usuario autenticado y no se mezcla con la de otros usuarios.
- Guardar o quitar un evento genera una notificación global.
- Si un visitante intenta guardar un evento, el sistema solicita autenticación y conserva el contexto del evento.

### RF04 — Detalle de evento

**Prioridad:** Must

El sistema debe mostrar la información necesaria para decidir una compra.

**Criterios de aceptación:**

- Se muestran título, descripción, fecha, duración, modalidad, recinto, ubicación, organizador y capacidad.
- Se muestran tipos de entrada, precios, disponibilidad y límite por usuario.
- Se muestra la política de cancelación antes de iniciar el checkout.
- El evento puede guardarse o quitarse de favoritos desde el detalle.
- El usuario puede regresar al listado mediante breadcrumbs y una acción de regreso.

### RF05 — Tipos de entrada e inventario

**Prioridad:** Must

El sistema debe permitir seleccionar un tipo y cantidad de entradas respetando el inventario disponible.

**Criterios de aceptación:**

- No se puede seleccionar un tipo agotado ni superar el límite por usuario.
- La cantidad máxima considera el inventario disponible y las entradas retenidas.
- El precio unitario, subtotal y cargos se actualizan antes de continuar.
- Una compra confirmada reduce el inventario; una retención vencida o cancelada lo libera.

### RF06 — Selección de asiento numerado

**Prioridad:** Must

Los eventos configurados con localidades numeradas deben ofrecer un selector visual de planta, sector, fila y asiento.

**Criterios de aceptación:**

- El selector solo aparece en eventos con asientos numerados.
- La planta distingue sectores y muestra una leyenda para `Disponible`, `Seleccionado`, `HOLD` y `Vendido`.
- Cada asiento tiene un identificador estable compuesto al menos por sector, fila y número.
- Un asiento vendido o retenido por otro usuario no puede seleccionarse.
- La cantidad de asientos seleccionados coincide con la cantidad de entradas de la orden.
- El resumen de compra y el ticket muestran las localidades elegidas.
- El selector es operable con teclado y ofrece una lista textual equivalente para lectores de pantalla.

### RF07 — Retención temporal de entradas (HOLD)

**Prioridad:** Must

El sistema debe retener temporalmente las entradas o asientos mientras el asistente completa el pago.

**Criterios de aceptación:**

- La retención comienza al confirmar la selección y dura cinco minutos.
- El checkout muestra el tiempo restante de manera visible y accesible.
- El detalle del evento identifica el inventario en `HOLD` sin presentarlo como disponible.
- Una retención vencida, abandonada o asociada a un pago fallido libera el inventario.
- Una compra confirmada transforma la retención en venta sin permitir duplicidad.

### RF08 — Checkout

**Prioridad:** Must

El checkout debe guiar al asistente desde la selección hasta la confirmación de compra.

**Criterios de aceptación:**

- El flujo incluye selección, pago, procesamiento y resultado.
- El resumen muestra evento, tipo, asientos si existen, cantidad, precio unitario, subtotal, cargos y total.
- Los breadcrumbs conservan el contexto `Inicio / Evento / Checkout`.
- El usuario puede volver antes del pago sin perder el contexto del evento.
- Los campos obligatorios se validan antes de iniciar el procesamiento.
- No se realizan cargos duplicados al repetir una acción o recargar durante el procesamiento.

### RF09 — Procesamiento de pago

**Prioridad:** Must

El sistema debe procesar el pago mediante un servicio desacoplado de la interfaz.

**Criterios de aceptación:**

- El frontend nunca almacena datos completos de tarjeta ni credenciales del proveedor.
- Un pago aprobado confirma la orden y genera sus entradas.
- Un pago rechazado mantiene una explicación accionable, libera la retención cuando corresponda y muestra un toast de error.
- Cada intento posee un identificador que impide confirmar la misma orden dos veces.
- Durante la etapa frontend, el proveedor puede ser simulado conservando los mismos estados de resultado.

### RF10 — Emisión de tickets

**Prioridad:** Must

Cada compra confirmada debe generar tickets individuales y verificables.

**Criterios de aceptación:**

- Cada ticket tiene identificador y código QR únicos.
- El ticket muestra evento, fecha, recinto, titular, tipo de entrada y asiento cuando corresponda.
- Sus estados posibles son `activo`, `usado` y `cancelado`.
- Un ticket cancelado o usado no puede validar un nuevo ingreso.

### RF11 — Mis entradas y descarga

**Prioridad:** Must

El asistente debe consultar sus tickets y descargar una copia individual.

**Criterios de aceptación:**

- `Mis entradas` separa entradas próximas, utilizadas y canceladas.
- Cada entrada puede abrirse para consultar su detalle y QR.
- El usuario puede descargar el ticket como PDF o imagen con información legible y QR incluido.
- El archivo descargado posee un nombre identificable y no incluye datos de pago sensibles.
- La descarga funciona mediante teclado y anuncia el resultado.

### RF12 — Historial de compras

**Prioridad:** Must

El asistente debe consultar sus órdenes completas, no únicamente los tickets emitidos.

**Criterios de aceptación:**

- El historial muestra número de orden, fecha, evento, estado y total.
- El desglose incluye tipo de entrada, asientos, cantidad, precio unitario, subtotal, cargos y total.
- La orden vincula sus tickets asociados.
- Las órdenes canceladas o reembolsadas permanecen visibles y conservan su trazabilidad.
- El usuario solo puede consultar sus propias órdenes.

### RF13 — Administración de eventos

**Prioridad:** Must

El organizador debe crear, editar, publicar, cancelar y consultar sus eventos.

**Criterios de aceptación:**

- Un evento puede guardarse como borrador antes de publicarse.
- La publicación exige datos básicos, fechas válidas e inventario configurado.
- El organizador solo modifica eventos propios.
- Los eventos con localidades pueden configurar sectores, filas, asientos y precios.
- Cancelar un evento identifica las órdenes afectadas e inicia el proceso correspondiente de notificación y reembolso.

### RF14 — Check-in

**Prioridad:** Must

El staff debe validar entradas mediante su código y registrar el resultado.

**Criterios de aceptación:**

- Los resultados posibles incluyen entrada válida, ya utilizada, inválida y correspondiente a otro evento.
- Una validación exitosa marca el ticket como usado y registra fecha, evento y operador.
- Repetir un código usado no concede acceso nuevamente.
- El resultado se comunica mediante texto, icono y color.

### RF15 — Cancelación y reembolso

**Prioridad:** Must

El asistente debe poder solicitar la cancelación de una orden elegible y conocer el importe del reembolso antes de confirmar.

**Criterios de aceptación:**

- La acción solo aparece para órdenes confirmadas que cumplen la política del evento.
- El flujo muestra entradas afectadas, importe pagado, deducciones, importe a reembolsar y medio de devolución.
- El usuario debe confirmar explícitamente una acción irreversible.
- Una cancelación aceptada cambia la orden a `cancelado` o `reembolsado` según el estado del reintegro.
- Los tickets afectados pasan a `cancelado` y dejan de ser válidos para check-in.
- El inventario se restituye cuando la política y el estado del evento lo permiten.
- El resultado genera notificación global y queda registrado en el historial de la orden.
- Un error del proveedor no presenta la orden como reembolsada y permite reintentar o recibir soporte.

### RF16 — Operación y métricas del organizador

**Prioridad:** Should

El organizador debe consultar ventas, asistentes, ocupación e ingresos de sus eventos.

**Criterios de aceptación:**

- Las métricas se calculan sobre órdenes y tickets válidos.
- Cancelaciones y reembolsos se distinguen de las ventas confirmadas.
- El organizador puede consultar el desglose de órdenes y los resultados de check-in de eventos propios.

### RF17 — Administración y auditoría

**Prioridad:** Should

El administrador debe supervisar usuarios, organizadores, eventos y operaciones sensibles.

**Criterios de aceptación:**

- Puede consultar estado y rol de usuarios sin acceder a contraseñas ni información completa de pago.
- Puede identificar eventos publicados, cancelados y finalizados.
- Publicaciones, cancelaciones, reembolsos y check-ins conservan actor, fecha y resultado.

### RF18 — Notificaciones de negocio

**Prioridad:** Should

El sistema debe notificar eventos relevantes al usuario y permitir procesamiento asincrónico.

**Criterios de aceptación:**

- Una compra confirmada genera la emisión y notificación de tickets.
- Cancelaciones o cambios de fecha notifican a los asistentes afectados.
- Un fallo de notificación no revierte una compra confirmada.
- El sistema puede reintentar mensajes fallidos sin duplicar tickets ni reembolsos.

## 6. Requisitos de experiencia y navegación

### RX01 — Breadcrumbs

- El detalle muestra `Inicio / Explorar / Evento`.
- El checkout muestra `Inicio / Evento / Checkout`.
- El elemento actual utiliza `aria-current="page"` y los anteriores permiten navegar.

### RX02 — Toast notifications globales

- Se utilizan para compra confirmada, favorito agregado o eliminado, cancelación, descarga y errores de pago.
- Los mensajes informativos usan una región `aria-live="polite"`; los errores críticos usan `assertive`.
- Se pueden cerrar manualmente, no bloquean la interfaz y permanecen el tiempo suficiente para leerse.

### RX03 — Skeleton loaders

- Las vistas asincrónicas muestran skeletons con una geometría equivalente al contenido esperado.
- No se muestra falsamente un estado vacío mientras todavía se están cargando datos.
- Los skeletons no reciben foco ni se anuncian como contenido real.
- Su animación se elimina con `prefers-reduced-motion`.

### RX04 — Confirmación de compra

- La confirmación muestra inmediatamente número de orden, total y acceso a las entradas.
- Puede utilizar confetti o una transición breve que no bloquee contenido ni acciones.
- Con movimiento reducido, la celebración se reemplaza por un cambio estático o fundido simple.

### RX05 — Estados vacíos y errores

- Un estado vacío explica qué falta y ofrece una siguiente acción relevante.
- Los errores conservan los datos ingresados siempre que sea seguro.
- Ningún error se comunica únicamente mediante color.

### RX06 — Navegación coherente

- La navegación principal distingue `Inicio`, `Explorar`, `Mis favoritos`, `Mis entradas` y `Mis compras` para asistentes autenticados.
- La vista activa se identifica visualmente y mediante semántica accesible.
- La navegación funciona con teclado y se adapta a pantallas pequeñas sin desbordamiento horizontal.

## 7. Requisitos no funcionales

### RNF01 — Persistencia e integridad

- Los favoritos y datos de demostración que corresponda deben sobrevivir una recarga durante la etapa frontend.
- En el sistema integrado, PostgreSQL será la fuente de verdad para usuarios, eventos, inventario, órdenes, tickets y reembolsos.
- No se puede vender dos veces el mismo asiento ni superar el inventario disponible.

### RNF02 — Accesibilidad

- El producto debe cumplir WCAG 2.2 nivel AA.
- Todos los flujos deben completarse con teclado y lectores de pantalla.
- Deben existir foco visible, orden lógico, estructura semántica, etiquetas y mensajes accesibles.
- El contraste mínimo es 4.5:1 para texto normal y 3:1 para texto grande y componentes gráficos relevantes.
- La información nunca depende únicamente del color.

### RNF03 — Responsive

- Las vistas deben operar correctamente en escritorio, tablet y celular.
- Los mapas de asientos permiten zoom o desplazamiento controlado sin ocultar su alternativa textual.
- Tablas y barras laterales cambian de estructura en pantallas estrechas.

### RNF04 — Seguridad

- Las contraseñas se almacenan mediante hashing seguro y nunca se registran en logs.
- El backend valida identidad, rol, propiedad del recurso y datos de entrada.
- Al menos dos operaciones sensibles utilizan autorización declarativa por rol.
- Datos de pago completos y secretos nunca se persisten en el frontend ni en Git.

### RNF05 — Rendimiento percibido

- La navegación y el feedback de acciones locales deben percibirse inmediatamente.
- Las operaciones remotas muestran progreso sin bloquear toda la aplicación.
- Imágenes de eventos utilizan tamaños adecuados y carga diferida fuera del viewport.

### RNF06 — Concurrencia e idempotencia

- Las operaciones de pago, emisión, check-in y reembolso son idempotentes.
- El vencimiento de HOLD y la confirmación de compra se resuelven sin condiciones de carrera.
- Los consumidores asincrónicos pueden reprocesar mensajes sin duplicar efectos.

### RNF07 — Trazabilidad

- Órdenes, pagos, reembolsos, tickets y check-ins conservan identificadores correlacionables.
- Las operaciones sensibles registran actor, fecha, resultado y recurso afectado.

### RNF08 — Compatibilidad

- La aplicación web debe soportar las versiones vigentes de Chrome, Edge y Firefox utilizadas durante la cursada.
- Las funciones principales no dependen de hover y son utilizables en dispositivos táctiles.

## 8. Restricciones técnicas del TP

| ID | Restricción obligatoria |
|---|---|
| RT01 | Identificar al menos seis componentes de negocio con interfaces documentadas. |
| RT02 | Implementar arquitectura en capas: presentación, negocio y datos. |
| RT03 | Justificar al menos un componente stateful y uno stateless. |
| RT04 | Aplicar y justificar al menos tres patrones de diseño distintos. |
| RT05 | Implementar una integración SOAP con un sistema externo legado y conservar su WSDL. |
| RT06 | Implementar una integración REST con un partner moderno o API externa. |
| RT07 | Implementar una cola punto a punto y un tópico publicación/suscripción con un broker real. |
| RT08 | Aplicar seguridad declarativa en al menos dos operaciones sensibles. |
| RT09 | Aplicar transacciones declarativas en al menos un flujo crítico de varios pasos. |
| RT10 | Utilizar un stack permitido por la cátedra y justificar la selección. |
| RT11 | Mantener un historial Git incremental con participación visible del equipo. |

## 9. Reglas de negocio principales

1. Solo los eventos publicados y dentro de su período de venta pueden comprarse.
2. La disponibilidad efectiva es el inventario total menos entradas vendidas y HOLD vigentes.
3. Un asiento solo puede pertenecer a una retención o venta activa al mismo tiempo.
4. La orden solo se confirma después de un resultado de pago aprobado.
5. Cada ticket pertenece a una única orden y representa una única entrada o asiento.
6. Un ticket usado o cancelado nunca vuelve a estado activo sin una operación administrativa auditada.
7. La elegibilidad y el importe de un reembolso se calculan con la política vigente de la orden, no con una política modificada posteriormente.
8. Los cargos, deducciones y totales monetarios se calculan con precisión decimal y se muestran antes de confirmar.

## 10. Fuera de alcance inicial

- Aplicación móvil nativa.
- Reventa o mercado secundario de entradas.
- Precios dinámicos automáticos.
- Programa de puntos o gamificación.
- Recomendaciones mediante inteligencia artificial.
- Múltiples monedas, impuestos internacionales o liquidación fiscal completa.
- Separación prematura de cada módulo en un microservicio desplegable independiente.

Estas funciones requieren una decisión explícita antes de incorporarse al alcance.

## 11. Criterio general de terminado

Un requisito se considera terminado cuando:

- Cumple todos sus criterios de aceptación.
- Está conectado al flujo real y no únicamente representado por una pantalla estática.
- Contempla carga, vacío, éxito, error y permisos cuando corresponda.
- Es operable en escritorio y celular, con teclado y lector de pantalla.
- Tiene una verificación automatizada proporcional al riesgo.
- La documentación refleja fielmente lo implementado.
