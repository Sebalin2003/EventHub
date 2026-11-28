# Guion y Speech Oral — Defensa Final y 3.er Checkpoint (5 Integrantes)

> **Documento:** Discurso paso a paso para la exposición oral del equipo (5 oradores)  
> **Tiempo Estimado:** ~17 minutos de presentación + 5 minutos de preguntas individuales  
> **Presentación Visual:** [EventHub_Presentacion_Final.html](./EventHub_Presentacion_Final.html)
> **Distribución Equilibrada para 5 Oradores:**
> - **Orador 1 (Arquitectura, Dominio & Cierre):** Portada, Visión del Negocio, Arquitectura en Capas, Patrones/ADRs y Conclusiones
> - **Orador 2 (Integraciones, Resiliencia & REST):** Integraciones (SOAP/REST/AMQP), Timeout/Circuit Breaker, Outbox, Consumidores Idempotentes/DLQ y Estándares REST
> - **Orador 3 (Frontend, Ejes A, B y C):** Eje A (HUs, Playwright, Accesibilidad), Eje B (Cobertura y Mutación Stryker) y Eje C (Integración Real y Carga k6)
> - **Orador 4 (IA, Seguridad & Condiciones G1-G9):** AI Gateway, Condiciones Eliminatorias G1 a G9, Eje D (Seguridad y ZAP) y Eje E (Testing de IA)
> - **Orador 5 (QA Lead & Demo en Vivo):** Demostración en Vivo (Flujo feliz, 409, Timeout 504 y Broker apagado) + Registro de Defectos y Jira

---

## ⏱️ Cronograma y Tiempos por Orador

| Orador | Bloque / Secciones | Tiempo |
|---|---|---|
| **Orador 1** | Apertura, Visión del Negocio, Arquitectura en Capas, 8 ADRs *(+ Cierre final)* | ~3:30 min |
| **Orador 2** | Integraciones SOAP/REST/AMQP, Timeout 5s + CB, Outbox, DLQ, Idempotency/ETag | ~4:00 min |
| **Orador 3** | Eje A (Playwright, Lighthouse), Eje B (96,5% Cob / 76,2% Mut), Eje C (k6 p95) | ~3:00 min |
| **Orador 4** | AI Gateway, Condiciones G1-G9, Eje D (Seguridad/ZAP) y Eje E (Testing IA) | ~3:15 min |
| **Orador 5** | Demostración en Vivo (Flujo completo + Resiliencia) + Jira y Defectos | ~3:45 min |
| **Total Estimado** | | **~17:30 min** |

---

## 🎙️ Guion Paso a Paso (Palabra por Palabra)

---

### Portada — EventHub
**Tiempo:** 0:40 min | **Orador 1**  
**En Pantalla:** Portada de `EventHub_Presentacion_Final.html`.

> *"Buenas tardes profesores y compañeros. Hoy venimos a presentar la entrega final y el tercer checkpoint de integración de **EventHub**, nuestra plataforma integral para la gestión y venta concurrente de entradas para eventos masivos.*
> 
> *En esta sesión presentaremos la evidencia disponible para las Condiciones G1 a G9 y los cinco Ejes de Testing, distinguiendo lo que respalda el CI de lo que depende de Jira, Teams y esta defensa.*
> 
> *El tag final `v1.0-final` se publica sobre la punta de `main` con el CI en verde (confirmar con `git rev-parse v1.0-final` antes de la defensa). El run `46165701834` del 28/11 terminó con 6 de 6 jobs exitosos en 12 minutos. Comenzamos."*

---

### Visión del Negocio y Desafíos de Dominio
**Tiempo:** 0:55 min | **Orador 1**  
**En Pantalla:** Sección *Visión del Negocio y Desafíos de Dominio*.

> *"Para entender la arquitectura de EventHub, primero debemos comprender la criticidad de su dominio. La venta de entradas para recitales o eventos deportivos presenta picos extremos de concurrencia donde miles de usuarios compiten por los mismos cupos en simultáneo.*
> 
> *El mayor riesgo en estos sistemas es el **overbooking** (sobrevender localidades) y la inconsistencia entre el inventario y los cobros bancarios si el comprador abandona la sesión.*
> 
> *Para resolver esto, implementamos una **reserva temporal atómica (HOLD)** de 5 minutos por tipo de entrada antes de cobrar. Asimismo, modelamos el ciclo de vida de la orden con una máquina de estados estricta que impide cualquier transición inválida devolviendo **HTTP 409 Conflict**. Al confirmarse la compra, se emiten tickets criptográficos únicos con código QR, cuyo escaneo en puerta valida que la entrada no haya sido utilizada previamente."*

---

### Arquitectura en Capas y Despliegue
**Tiempo:** 0:55 min | **Orador 1**  
**En Pantalla:** Diagrama de *Arquitectura en Capas y Despliegue*.

> *"Nuestra arquitectura sigue el modelo de **Monolito Modular en capas**. En el frontend tenemos una Single Page Application construida con **React 19, TypeScript y Tailwind CSS**, que se comunica mediante REST y tokens JWT con nuestra API.*
> 
> *El backend está desarrollado sobre **NestJS**, organizado en capas estrictas: Controladores con validación masiva y filtrado Problem Details; Servicios de aplicación; y Entidades y Patrones en el núcleo de dominio.*
> 
> *En infraestructura contamos con **PostgreSQL 15** vía TypeORM para persistencia transaccional y locks pesimistas, **RabbitMQ** como broker de mensajería y un cliente **SOAP** para el sistema bancario legado. Todo el stack se levanta con un único comando en **Docker Compose** (6 contenedores incluyendo los mocks SOAP y de geocodificación), y también está desplegado en **Railway**."*

---

### Patrones de Diseño Implementados y sus ADRs
**Tiempo:** 0:55 min | **Orador 1**  
**En Pantalla:** Tabla de los 8 ADRs.

> *"Documentamos formalmente **8 Architecture Decision Records (ADRs)**:*
> 
> *El patrón central es **State (ADR-001)** en `Order`, pasando por `Pending`, `Processing`, `Paid`, `Cancelled` y `Refunded`, rechazando con **409 Conflict** cualquier salto ilegal. Usamos **Strategy (ADR-002)** para hashing con `scrypt`; **Factory (ADR-003)** para instanciación de eventos; **DAO/Repository (ADR-004)** para aislar SQL; y **Adapter (ADR-005)** para hablar SOAP con la pasarela bancaria.*
> 
> *A esto sumamos los patrones de resiliencia **Circuit Breaker (ADR-006)**, **Transactional Outbox (ADR-007)** y **AI Gateway (ADR-008)**. Le cedo la palabra a mi compañero para profundizar en las integraciones y la resiliencia."*

---

### Integraciones Heterogéneas (SOAP Legado, REST y AMQP)
**Tiempo:** 0:50 min | **Orador 2**  
**En Pantalla:** Sección *Integraciones Heterogéneas*.

> *"Gracias. Pasando al núcleo de integraciones, en EventHub conviven tres protocolos reales:*
> 
> *Primero, **SOAP con el sistema bancario legado**, definido en `payments.wsdl` y servido por `soap-mock` en Compose. Clasificamos los errores en **Business Faults** (fondos insuficientes, tarjeta vencida) y **Technical Faults** (caída de red o timeout), y blindamos el parser XML contra ataques **XXE** rechazando cualquier `<!DOCTYPE` o `<!ENTITY` con `XXE_INJECTION_REJECTED`.*
> 
> *Segundo, **REST moderno** bajo **OpenAPI 3.1**, validación estricta de DTOs y un servicio externo REST de geocodificación con fallback ante timeout.*
> 
> *Tercero, **RabbitMQ** mediante un exchange `topic` llamado `eventhub.events` que distribuye eventos de dominio hacia dos colas independientes: notificaciones y auditoría."*

---

### Resiliencia I — Timeout de 5s, Circuit Breaker y Fallback
**Tiempo:** 0:50 min | **Orador 2**  
**En Pantalla:** Sección *Timeout de 5s, Circuit Breaker y Fallback*.

> *"En sistemas distribuidos, una dependencia lenta es más peligrosa que una caída. Por eso aplicamos dos tácticas combinadas en `PaymentsService` y `OrdersService`:*
> 
> *Primero, bloqueamos la orden en estado `PROCESSING` con `FOR UPDATE` antes de cobrar y validamos Luhn en todos los caminos. Luego ejecutamos la llamada SOAP con un **timeout estricto de 5 segundos** usando `Promise.race` y `timer.unref()`.*
> 
> *Si acumula **3 fallas técnicas consecutivas**, el **Circuit Breaker** pasa a `OPEN` por 30 segundos haciendo *fast-fail*. En caso de timeout o circuito abierto, devolvemos **HTTP 504** o **503** con cabecera **`Retry-After: 30`**, y la orden **permanece en estado `pending`** conservando su reserva para que el usuario reintente."*

---

### Resiliencia II — Transactional Outbox y Caída del Broker
**Tiempo:** 0:50 min | **Orador 2**  
**En Pantalla:** Sección *Transactional Outbox y Caída del Broker*.

> *"¿Qué ocurre si el broker de mensajería se apaga? En EventHub no se pierde ningún mensaje gracias al **Transactional Outbox Pattern (ADR-007)**.*
> 
> *Dentro de la **misma transacción ACID** donde guardamos la orden o el reembolso en PostgreSQL, insertamos el evento en `outbox_messages` en estado `PENDING`. Si RabbitMQ está caído, la compra responde igualmente **HTTP 201 Created**.*
> 
> *Un dispatcher en segundo plano sondea la tabla cada 2 segundos y, en cuanto RabbitMQ vuelve a estar en línea, despacha los mensajes pendientes al exchange `topic` y los marca como `SENT`."*

---

### Resiliencia III — Consumidores Idempotentes, Topic y DLQ
**Tiempo:** 0:45 min | **Orador 2**  
**En Pantalla:** Sección *Consumidores Idempotentes, Topic y DLQ*.

> *"Del lado del consumo garantizamos tres cosas:*
> 
> *1. **Deduplicación persistente:** la tabla `notifications` posee una columna única `messageId`. Si RabbitMQ reenvía un mensaje o se reinicia la API, el consumidor responde `ack` y descarta el duplicado sin crear filas repetidas.*
> 
> *2. **Doble suscripción en Topic:** cada evento publicado llega tanto a `notifications_queue` como a `audit_queue` (`AuditConsumerService`).*
> 
> *3. **Dead Letter Queue real:** ante payloads inválidos (*poison pills*), tras 3 reintentos ejecutamos `nack(requeue: false)` y RabbitMQ enruta el mensaje a `notifications_dlq` vía `eventhub.dlx` con su cabecera diagnóstica `x-death`."*

---

### Estándares REST — Idempotency-Key, ETag y Problem Details
**Tiempo:** 0:45 min | **Orador 2**  
**En Pantalla:** Sección *Idempotency-Key, ETag y Problem Details*.

> *"En nuestra API REST aplicamos estándares de industria:*
> 
> *1. **Idempotency-Key:** con índice único compuesto `(userId, idempotencyKey)` y hash SHA-256 del payload. Cinco `POST` concurrentes crean una única orden, y si reutilizan la clave con distinto cuerpo respondemos **HTTP 422**.*
> 
> *2. **Concurrencia Optimista con ETag / If-Match:** ante versiones desactualizadas devolvemos **HTTP 412 Precondition Failed**.*
> 
> *3. **Problem Details (RFC 9457):** todos los errores responden `application/problem+json` y mapean conflictos de integridad de PostgreSQL (`23503` / `23505`) a **409 Conflict** sin filtrar trazas SQL. Le paso la palabra a mi compañero para presentar los Ejes A, B y C."*

---

### Eje A — Historias de Usuario, E2E y Accesibilidad
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Sección *Historias de Usuario, E2E y Accesibilidad*.

> *"Muchas gracias. Comenzando con los resultados de calidad de la entrega final, en el **Eje A** cubrimos **11 Historias de Usuario** con **43 criterios Gherkin verificados al 100%**.*
> 
> *Automatizamos **6 flujos críticos E2E en navegador real con Playwright** (`retries: 0`) contra el stack Docker: login JWT, catálogo, compra completa, publicación de eventos, rechazo de credenciales y check-in.*
> 
> *Validamos diseño responsive en 360, 768 y 1280 píxeles sin desbordes. En accesibilidad WCAG 2.2 AA obtuvimos **0 violaciones críticas o serias** con `axe-core` y una puntuación de **100/100 en Google Lighthouse** tanto en Desktop como en Mobile."*

---

### Eje B — Calidad de Código, Cobertura y Mutación
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Sección *Cobertura (96,5%) y Mutación (76,2%)*.

> *"En el **Eje B** superamos ampliamente los umbrales exigidos por la cátedra:*
> 
> *Frente al mínimo de 80% de líneas y 70% de ramas en capa de negocio, alcanzamos **91,55% de cobertura de líneas** y **81,59% de ramas** con 318 tests de API. El CI además exige un baseline de 90/75 para que la cobertura no retroceda.*
> 
> *Para validar la calidad real de nuestras aserciones ejecutamos **Mutation Testing con Stryker** sobre la capa de dominio. El job corta si el score baja de 60% y pasó en el último run; en la medición detallada del 12/11 el score fue **76,23%**, con 617 mutantes eliminados.*
> 
> *Además, nuestra colección Postman de **104 requests y 192 aserciones** corre en CI con **Newman** con 0 fallos, y la suite se ejecuta 3 veces seguidas en cada pipeline para detectar **flaky tests**."*

---

### Eje C — Integración Real y Pruebas de Carga k6
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Sección *Integración Real y Pruebas de Carga k6*.

> *"En el **Eje C** contamos con una suite de integración contra PostgreSQL 15 y RabbitMQ 3 reales, además de tests de concurrencia con `Promise.all` que comprueban cero sobreventa (cupo 2 con 5 compradores emite exactamente 2 holds) e idempotencia ante colisiones.*
> 
> *Sometimos a la API a una **Prueba de Carga con k6** simulando 50 usuarios virtuales concurrentes durante 5 minutos continuos.*
> 
> *Frente al umbral de p95 menor a 500 ms, con un escenario que ahora incluye crear orden y pagar, obtuvimos una **latencia p95 de 263,79 milisegundos** y **0,00% de tasa de error**. Cedo la palabra al siguiente compañero para IA, seguridad y condiciones eliminatorias."*

---

### Inteligencia Artificial a través de su Gateway
**Tiempo:** 0:45 min | **Orador 4**  
**En Pantalla:** Sección *Inteligencia Artificial a través de su Gateway*.

> *"Gracias. En cuanto a Inteligencia Artificial, implementamos `AiAdvisorService` detrás de un **AI Gateway (ADR-008)**.*
> 
> *Este endpoint usa un simulador determinístico: bloquea patrones conocidos de inyección, aplica guardrails temáticos acotados, enmascara emails y números que coinciden con el patrón de tarjeta y ofrece un fallback de prueba mediante `simulateTimeout`. No invoca un proveedor LLM externo."*

---

### Cumplimiento de Condiciones Eliminatorias G1 a G9
**Tiempo:** 0:55 min | **Orador 4**  
**En Pantalla:** Tabla de *Condiciones G1 a G9*.

> *"Las **Condiciones Eliminatorias G1 a G9** son el requisito excluyente de la entrega. Este es el estado que podemos respaldar:*
> 
> * **G1 y G6:** el job G1 levanta el stack con `docker compose up` desde un checkout limpio y Gitleaks recorre todo el historial; ambos en verde en el run `46165701834`.
> * **G2:** tag `v1.0-final` sobre la punta de `main` con CI verde.
> * **G3:** cumple: run `46165701834`, 6/6 jobs exitosos.
> * **G4 y G5:** documentación versionada; carga a Teams, Jira y responsable QA no verificados.
> * **G7:** la demo presencial queda pendiente.
> * **G8 y G9:** documentos actualizados; validación oral y contraste con Jira pendientes."*

---

### Eje D — Seguridad Ofensiva y Eje E — Testing de IA
**Tiempo:** 1:35 min | **Orador 4**  
**En Pantalla:** Secciones *Seguridad Ofensiva* y *Testing de IA y Declaración Formal*.

> *"En el **Eje D (Seguridad)** ejecutamos 29 pruebas HTTP ofensivas reales cubriendo OWASP API Top 10: bloqueamos **BOLA/IDOR** y **BFLA** con 403/404; rechazamos JWT manipulados, expirados, sin `exp` o con `alg=none` con 401; aplicamos **Rate Limiting (HTTP 429)** contra fuerza bruta; y servimos todas las imágenes Docker como usuario sin privilegios (`USER node`) con cabeceras CSP, HSTS y `X-Frame-Options: DENY`.*
> 
> *El job de dependencias y **OWASP ZAP** pasó en el run `46165701834`; los reportes detallados de ZAP y `pnpm audit --prod` del 11/11 están en `docs/evidencias/`."*
> 
> *Por último, en el **Eje E**, validamos el módulo de IA con **14 tests unitarios y 10 tests HTTP E2E**, y dejamos constancia transparente en `DECLARACION_IA.md` de las herramientas usadas y los errores de código generado por IA que detectamos y corregimos. Ahora pasamos a la demostración en vivo."*

---

### Demostración en Vivo (Flujo Completo y Resiliencia)
**Tiempo:** 3:00 min | **Orador 5 (QA Lead & Demo)**  
**Acciones en Pantalla:** Navegador + Terminal / Postman.

> *(El Orador 5 comparte pantalla con la aplicación y la terminal listas)*
> 
> 1. **Flujo Principal Feliz:**
>    *"Ingresamos con `buyer@eventhub.com.ar` recibiendo nuestro JWT. Seleccionamos un evento futuro y creamos la orden (`POST /orders`), tomando un HOLD de 5 minutos. Pagamos con tarjeta válida (`POST /orders/:id/pay`): la petición cruza el servicio `soap-mock`, confirma la venta atómicamente, pasa la orden a `PAID` y emite el ticket con su código QR único."*
> 
> 2. **Check-in Atómico y Rechazo 409:**
>    *"Como organizador/staff escaneamos el ticket: el primer escaneo valida el acceso. Al intentar escanear el mismo código por segunda vez, el `UPDATE` atómico y el patrón State rechazan la operación con **HTTP 409 Conflict** en formato Problem Details."*
> 
> 3. **Resiliencia en Vivo (Timeout 504 y Broker Apagado):**
>    *"Si probamos un pago con tarjeta terminada en `9999`, la pasarela demora 6 segundos; nuestra API corta exactamente a los 5 segundos, responde **504 Gateway Timeout** con `Retry-After: 30` y deja la orden en `pending` sin perder la reserva.*
>    *Y si apagamos RabbitMQ con `docker stop eventhub_broker` y realizamos una compra, la API responde **201 Created** guardando el evento en `outbox_messages` (`PENDING`). Al encender el broker con `docker start`, el dispatcher reconecta automáticamente y entrega el evento a notificaciones y auditoría marcándolo `SENT`."*

---

### Registro de Defectos, Jira y QA Designado
**Tiempo:** 0:45 min | **Orador 5 (QA Lead)**  
**En Pantalla:** Sección *Registro de Defectos, Jira y QA Designado*.

> *"Como QA Designado, coordiné el tablero de Jira manteniendo la trazabilidad completa entre Historias de Usuario, casos de prueba y defectos.*
> 
> *Hoy cerramos con **0 defectos Bloqueantes** y **0 Críticos** abiertos. Declaramos con total honestidad **1 defecto Menor abierto (EVH-108)**: si el usuario recarga con F5 en el checkout web, vuelve al catálogo, pero el HOLD permanece seguro en el servidor por 5 minutos como workaround.*
> 
> *También documentamos defectos corregidos durante los ensayos, como EVH-106 (doble check-in) y EVH-107 (enumeración de usuarios en login). Le devuelvo la palabra al Orador 1 para el cierre."*

---

### Conclusiones y Defensa Individual
**Tiempo:** 0:30 min | **Orador 1**  
**En Pantalla:** Sección *Conclusiones y Defensa Individual*.

> *"Para concluir: EventHub demuestra que es posible construir una plataforma de alta concurrencia integrando protocolos dispares (SOAP, REST y AMQP) con integridad transaccional, resiliencia probada ante fallos reales y métricas de calidad verificables.*
> 
> *Los cinco integrantes del equipo conocemos en profundidad la arquitectura, el código y los tests, y quedamos a disposición de la cátedra para las preguntas individuales. Muchas gracias."*

---

## 🎯 Banco de Preguntas Típicas de Defensa Individual (y Respuestas Técnicas)

#### 1. ¿Por qué una transición inválida de la orden debe devolver 409 y no 400 ni 500?
* **Respuesta:** *"Devolver 500 indicaría una falla inesperada del servidor cuando el sistema en realidad aplicó correctamente una regla de negocio. 400 es para errores de sintaxis o tipos en el payload. Según la RFC 9110, **409 Conflict** indica que la solicitud entra en conflicto con el estado actual del recurso en el servidor (ej. intentar cancelar una orden `PAID`). Con el patrón State y RFC 9457 Problem Details, 409 es la respuesta semánticamente correcta."*

#### 2. ¿Cómo evitaron el problema de doble escritura (o 2PC) al publicar en RabbitMQ?
* **Respuesta:** *"Implementamos el **Transactional Outbox Pattern (ADR-007)**. Guardamos el evento en `outbox_messages` dentro de la misma transacción ACID de PostgreSQL que confirma la orden o el reembolso (`OutboxService.enqueue(..., manager)`). Un dispatcher en segundo plano lee los mensajes `PENDING` y los publica al exchange `topic` de RabbitMQ. Si el broker está caído, la BD conserva la consistencia y reintenta al recuperarse."*

#### 3. ¿Qué es un ataque XXE y cómo lo mitigaron en la integración SOAP?
* **Respuesta:** *"Un ataque XXE (XML External Entity Injection) inyecta definiciones DTD/entidades externas (como `<!ENTITY xxe SYSTEM "file:///etc/passwd">`) para leer archivos locales o hacer SSRF. Lo mitigamos tanto en `PaymentsService` / `SoapClientService` (con `escapeXML: true` y rechazo inmediato con `XXE_INJECTION_REJECTED` ante `<!DOCTYPE` o `<!ENTITY`) como en el servidor `soap-mock`."*

#### 4. ¿Qué diferencia hay entre cobertura de líneas y Mutation Score de Stryker?
* **Respuesta:** *"La cobertura solo indica qué líneas ejecutó algún test, pero no si las aserciones son fuertes. **Stryker** inyecta defectos sintéticos ('mutantes', como invertir un `>` o eliminar una condición) y re-ejecuta la suite. Nuestro **76,23%** demuestra que nuestros tests detectan y matan activamente errores lógicos en la capa de negocio."*

#### 5. ¿Cómo funciona la concurrencia optimista con ETag e If-Match y cómo evitan doble cobro?
* **Respuesta:** *"En concurrencia optimista, `GET /orders/:id` devuelve `ETag: W/"version"`. Al operar sobre la orden (`POST /orders/:id/pay`, cancelar o reembolsar), si `If-Match` no coincide con la versión actual, respondemos **412 Precondition Failed**. Además, en `OrdersService.pay` aplicamos bloqueo pesimista (`pessimistic_write`) pasando la orden a `PROCESSING` antes de invocar la pasarela SOAP, impidiendo dos cobros simultáneos."*

#### 6. ¿Qué pasa si RabbitMQ entrega dos veces el mismo mensaje o si se reinicia la API?
* **Respuesta:** *"El consumidor `NotificationsService` implementa deduplicación persistente mediante `messageId` en PostgreSQL. El outbox conserva y reintenta mensajes que siguen `PENDING` en los escenarios probados; como el publicador no usa publisher confirms, `SENT` no significa ACK del broker ni garantiza cero pérdida."*
