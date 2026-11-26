# Guion y Speech Oral — Defensa Final y 3.er Checkpoint

> **Documento:** Discurso paso a paso para la exposición oral del equipo  
> **Tiempo Estimado:** 15 a 18 minutos de presentación + 5 minutos de preguntas individuales  
> **Diapositivas de Referencia:** [docs/presentacion/PRESENTACION_FINAL_CHECKPOINT3.md](file:///c:/Users/jazmin/OneDrive/Documentos/EVENTHUB/EventHub-main/EventHub-main/docs/presentacion/PRESENTACION_FINAL_CHECKPOINT3.md)  
> **Estructura de Roles Sugerida:**
> - **Orador 1 (Arquitectura & Negocio):** Diapositivas 1 a 4
> - **Orador 2 (Integraciones, Resiliencia & IA):** Diapositivas 5 a 10
> - **Orador 3 (QA, Testing Ejes A-E & Seguridad):** Diapositivas 11 a 16
> - **Todos / Orador Designado (Demo en Vivo & Conclusiones):** Diapositivas 17 a 19

---

## ⏱️ Cronograma y Tiempos de Exposición

| Bloque | Diapositivas | Temas Clave | Tiempo |
|---|---|---|---|
| **Bloque 1: Apertura y Arquitectura** | Diapositivas 1 - 4 | Introducción, Dominio, Capas, Despliegue y Patrones (ADRs) | 3:30 min |
| **Bloque 2: Integraciones y Resiliencia** | Diapositivas 5 - 10 | SOAP (XXE, Faults), Outbox, Caída de Broker, DLQ, ETag, IA | 5:00 min |
| **Bloque 3: Criterios de Testing (G1-G9 y Ejes A-E)** | Diapositivas 11 - 16 | Eliminatorias G1-G9, E2E Playwright, Mutación Stryker, k6, ZAP | 5:00 min |
| **Bloque 4: Demostración en Vivo** | Diapositiva 17 | Compra feliz, 409 doble check-in, simulación broker apagado | 3:30 min |
| **Bloque 5: Defectos y Cierre** | Diapositivas 18 - 19 | Jira, EVH-108, Conclusiones y Defensa Individual | 1:30 min |
| **Total Estimado** | | | **~18:30 min** |

---

## 🎙️ Guion Paso a Paso (Palabra por Palabra)

---

### Diapositiva 1: Portada y Presentación del Equipo
**Tiempo:** 0:45 min | **Orador 1 (Arquitectura)**  
**En Pantalla:** Diapositiva 1 con los nombres del equipo y el enlace al repositorio GitHub.

> *"Buenas tardes profesores y compañeros. Hoy venimos a presentar la entrega final y el tercer checkpoint de integración de **EventHub**, nuestra plataforma integral para la gestión y venta concurrente de entradas para eventos masivos.*
> 
> *En esta sesión unificada no solo mostraremos el sistema funcionando de punta a punta entre frontend, backend y servicios externos, sino que demostraremos el cumplimiento riguroso de las 9 Condiciones Eliminatorias G1 a G9 y los umbrales de los cinco Ejes de Testing definidos por la cátedra.*
> 
> *El proyecto se encuentra en la rama `main`, tagueado formalmente bajo la versión `v1.0-final`, con su pipeline de Integración Continua con seis jobs en verde y libre de secretos en el historial de Git. Damos inicio a la presentación."*

---

### Diapositiva 2: Visión del Negocio y Desafíos de Dominio
**Tiempo:** 1:00 min | **Orador 1**  
**En Pantalla:** Diapositiva 2 (Esquema de problemas vs soluciones).

> *"Para entender la arquitectura de EventHub, primero debemos comprender la criticidad de su dominio. La venta de entradas para recitales o eventos deportivos presenta picos extremos de concurrencia donde miles de usuarios compiten por los mismos cupos en simultáneo.*
> 
> *El mayor riesgo en estos sistemas es el **overbooking** (sobrevender localidades) y la inconsistencia entre el inventario y los cobros bancarios si el comprador abandona la sesión.*
> 
> *Para resolver esto, implementamos una **reserva temporal atómica (HOLD)** de 5 minutos que bloquea el cupo antes de enviar al usuario a pagar. Asimismo, modelamos el ciclo de vida de la orden con una máquina de estados estricta que impide cualquier transición inválida devolviendo un código **HTTP 409 Conflict**. Una vez confirmada la compra, se emiten tickets criptográficos únicos con código QR, cuyo escaneo en puerta valida que la entrada no haya sido utilizada previamente."*

---

### Diapositiva 3: Arquitectura en Capas y Despliegue
**Tiempo:** 1:00 min | **Orador 1**  
**En Pantalla:** Diagrama Mermaid de Arquitectura en Capas.

> *"Nuestra arquitectura sigue el modelo de **Monolito Modular en capas**. En el frontend tenemos una Single Page Application construida con **React 19, TypeScript y Tailwind CSS**, que se comunica mediante REST y tokens JWT con nuestra API.*
> 
> *El backend está desarrollado sobre **NestJS**, organizado en capas estrictas: Controladores en la capa de presentación que ejecutan validación masiva y filtrado de Problem Details; Servicios en la capa de aplicación; y Entidades y Patrones en el núcleo de dominio.*
> 
> *En la capa de infraestructura tenemos **PostgreSQL 15** gestionado a través de TypeORM para los datos transaccionales, **RabbitMQ** como message broker para eventos de dominio asíncronos y un cliente SOAP para la integración con sistemas bancarios legados.*
> 
> *Todo el stack es reproducible con un único comando mediante **Docker Compose**, y además se encuentra desplegado en la nube sobre la plataforma **Railway** con redes privadas seguras."*

---

### Diapositiva 4: Patrones de Diseño Implementados y sus ADRs
**Tiempo:** 1:00 min | **Orador 1**  
**En Pantalla:** Tabla de los 8 ADRs y llamada al código de `OrderState`.

> *"Uno de los requerimientos clave fue la adopción formal de patrones de diseño justificados mediante Architecture Decision Records (ADRs). Hemos documentado 8 decisiones arquitectónicas:*
> 
> *El patrón central es el **Patrón State (ADR-001)** en la entidad `Order`. La orden pasa por estados `Pending`, `Paid` y `Cancelled`. Si un cliente intenta cancelar una orden que ya está en estado pagado, el estado actual rechaza la transición y lanza una excepción que se traduce en un **HTTP 409 Conflict**.*
> 
> *Implementamos también el **Patrón Strategy (ADR-002)** para el hashing criptográfico de contraseñas utilizando `scrypt` con factor de costo configurable; el **Patrón Factory (ADR-003)** para desacoplar la creación de eventos y tickets; el **Patrón DAO/Repository (ADR-004)** para aislar la persistencia; y el **Patrón Adapter (ADR-005)** para comunicar nuestro checkout moderno con la pasarela bancaria SOAP.*
> 
> *A estos se suman patrones de resiliencia como **Circuit Breaker (ADR-006)**, **Transactional Outbox (ADR-007)** y **AI Gateway (ADR-008)**, que explicará a continuación mi compañero."*

---

### Diapositiva 5: Integraciones Heterogéneas (SOAP Legado, REST y AMQP)
**Tiempo:** 1:00 min | **Orador 2 (Integraciones & Resiliencia)**  
**En Pantalla:** Diapositiva 5 (Contrato WSDL, protección XXE y diagramas de integración).

> *"Gracias. Pasando al núcleo del 3.er Checkpoint, el sistema debía demostrar la convivencia de tres tecnologías de comunicación heterogéneas:*
> 
> *Primero, la integración **SOAP con el sistema legado**: Contamos con un contrato WSDL formal. El cliente SOAP clasifica automáticamente las respuestas entre **Business Faults** (como fondos insuficientes o tarjeta inválida) y **Technical Faults** (caída del servidor o timeout). Además, blindamos el parser XML contra **XXE (XML External Entity Injection)**, impidiendo ataques con DTDs externos y respondiendo con un error seguro `XXE_INJECTION_REJECTED` sin revelar XML crudo.*
> 
> *Segundo, la **API REST**: Todos los contratos están formalizados bajo **OpenAPI 3.1**, con DTOs fuertemente tipados que impiden ataques de Mass Assignment.*
> 
> *Tercero, la **mensajería asíncrona**: Empleamos RabbitMQ para propagar eventos como `event.created` u `order.paid` hacia los módulos de notificaciones y analítica."*

---

### Diapositiva 6: Resiliencia I — Timeout de 5s, Circuit Breaker y Fallback
**Tiempo:** 1:00 min | **Orador 2**  
**En Pantalla:** Diagrama de secuencia de Circuit Breaker y Timeout de 5s.

> *"En sistemas distribuidos, una dependencia externa lenta es más peligrosa que una dependencia caída, porque agota los hilos de conexión del servidor. Por eso aplicamos dos tácticas combinadas:*
> 
> *1. **Timeout estricto de 5 segundos:** Si la pasarela bancaria SOAP demora más de 5.000 milisegundos en responder, la promesa es abortada inmediatamente mediante `Promise.race`, evitando que la petición quede colgada.*
> 
> *2. **Circuit Breaker con Fallback:** Si la pasarela acumula 3 fallas consecutivas, el circuito pasa al estado **OPEN**. Durante los siguientes 30 segundos de cooldown, cualquier intento de cobro falla de forma instantánea (*fast failure*) sin intentar contactar al banco, devolviendo una respuesta de fallback tipada que le informa al comprador que su reserva sigue asegurada mientras se restablece el servicio bancario."*

---

### Diapositiva 7: Resiliencia II — Patrón Outbox y Tolerancia a Caída del Broker
**Tiempo:** 1:00 min | **Orador 2**  
**En Pantalla:** Flujo de Transactional Outbox y prueba de broker detenido.

> *"Un desafío crucial de la entrega es: **¿Qué pasa si el broker de mensajería se apaga? ¿Se pierden mensajes?***
> 
> *La respuesta en EventHub es un rotundo NO, gracias a la implementación del **Transactional Outbox Pattern** (ADR-007).*
> 
> *Cuando un usuario compra una entrada, la confirmación de la orden y la creación del evento de dominio se insertan en la misma transacción ACID de PostgreSQL en la tabla `outbox_events` con estado `PENDING`. Si RabbitMQ está caído o inalcanzable, la compra no falla: devuelve **HTTP 201 Created** exitosamente.*
> 
> *Un worker en segundo plano monitorea la tabla y, en cuanto RabbitMQ se restablece, despacha los mensajes pendientes a la cola y los marca como `SENT`. Esto elimina la necesidad de bloqueos distribuidos tipo Two-Phase Commit y garantiza entrega eventual sin pérdida de datos."*

---

### Diapositiva 8: Resiliencia III — Consumidores Idempotentes y DLQ
**Tiempo:** 1:00 min | **Orador 2**  
**En Pantalla:** Diagrama de Dead Letter Queue y deduplicación.

> *"Del lado del consumo de eventos, implementamos dos garantías adicionales:*
> 
> *1. **Consumidores Idempotentes:** Debido a reintentos de red, un mismo mensaje puede llegar dos veces. El servicio de notificaciones mantiene un registro de IDs de mensajes procesados. Si un mensaje duplicado ingresa, se reconoce con `ack` inmediatamente pero se descarta su reprocesamiento en la base de datos.*
> 
> *2. **Dead Letter Queue (DLQ Real):** Las colas son durables. Si un mensaje contiene un payload corrupto o genera un error no recuperable, tras 3 reintentos el consumidor ejecuta un `nack` con `requeue: false`. RabbitMQ transfiere automáticamente el mensaje al exchange `eventhub.dlx` y de allí a la cola `notifications_dlq`, preservando la cabecera `x-death` con la traza de fallos para su posterior análisis y reprocesamiento manual."*

---

### Diapositiva 9: Estándares REST — Idempotency-Key, ETag y Problem Details
**Tiempo:** 1:00 min | **Orador 2**  
**En Pantalla:** Capturas de Swagger / Postman con cabeceras `Idempotency-Key`, `ETag` y respuesta Problem Details.

> *"En la API REST adoptamos los estándares más exigentes de la industria:*
> 
> *1. **Idempotency-Key:** En el endpoint de creación de órdenes (`POST /orders`), el cliente envía una clave de idempotencia. Si la red titubea y el usuario reintenta, el backend detecta la clave y retorna la orden existente sin duplicar el cobro ni decrementar el stock dos veces.*
> 
> *2. **Control de Concurrencia con ETag / If-Match:** Al consultar una orden, el servidor entrega un `ETag` con la versión del registro. Para pagar o cancelar, el cliente debe enviar la cabecera `If-Match`. Si otro proceso modificó la orden previamente, la API responde con **HTTP 412 Precondition Failed**, mitigando colisiones de concurrencia.*
> 
> *3. **Problem Details (RFC 9457):** Todas las respuestas de error utilizan el formato estándar `application/problem+json` con campos `type`, `title`, `status`, `detail` e `instance`, sin filtrar jamás stack traces ni rutas internas del servidor."*

---

### Diapositiva 10: Inteligencia Artificial Integrada a través de su Gateway
**Tiempo:** 1:00 min | **Orador 2**  
**En Pantalla:** Diagrama del Gateway de IA y pruebas de seguridad.

> *"Para cerrar el bloque de integraciones, incorporamos el módulo de Inteligencia Artificial mediante el patrón **AI Gateway (ADR-008)**.*
> 
> *El `AiAdvisorService` brinda sugerencias personalizadas de eventos según el perfil del usuario. Sin embargo, no expusimos la lógica directamente, sino que el Gateway aplica capas defensivas:*
> 
> *Aplica filtros contra **Prompt Injection directo** y ataques tipo **Jailbreak (DAN)**, e intercepta **inyecciones indirectas** dentro de los datos de preferencias del usuario. Además, enmascara automáticamente información personal sensible (tarjetas y emails) antes del análisis y cuenta con un fallback seguro que responde con recomendaciones generales si el servicio no está disponible.*
> 
> *Le cedo la palabra a mi compañero para presentar los resultados de las pruebas y la calidad del sistema."*

---

### Diapositiva 11: Cumplimiento de Condiciones Eliminatorias G1 a G9
**Tiempo:** 1:00 min | **Orador 3 (QA & Testing)**  
**En Pantalla:** Semáforo de las 9 Condiciones Eliminatorias G1 a G9 todas en verde.

> *"Muchas gracias. Entrando de lleno en los criterios de testing de la entrega final, las **Condiciones Eliminatorias G1 a G9** representan el Quality Gate más estricto de la materia. Si una sola falla, la entrega queda desaprobada. Veamos su cumplimiento:*
> 
> * **G1 (Build un solo comando):** Verificado. `docker compose up -d --build --wait` levanta la base de datos, el broker, la API y la web en estado `healthy` sin intervención manual.*
> * **G2 (Tag en main):** Cumplido. La versión `v1.0-final` está publicada en GitHub sobre la rama `main`.*
> * **G3 (CI en verde):** Cumplido. El pipeline de GitHub Actions cuenta con 6 jobs ejecutados en verde.*
> * **G4 y G5 (Documentación y Jira):** Cumplidos. La documentación completa reside en la carpeta `docs/`, con historias de usuario priorizadas en Jira y trazabilidad a los criterios de aceptación.*
> * **G6 (Sin secretos):** Cumplido. El escaneo con `Gitleaks` sobre todo el historial de Git arrojó 0 filtraciones.*
> * **G7 (Demo en vivo):** Preparada y lista para ejecutarse en minutos.*
> * **G8 y G9 (Declaración de IA e Informe honesto):** Formalizados en `DECLARACION_IA.md` y en el `INFORME_CUMPLIMIENTO_TESTING.md`, reportando métricas reales sin ocultar deudas técnicas."*

---

### Diapositiva 12: Eje A — Historias de Usuario, Criterios y E2E Playwright
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Matriz de HUs, reporte de Playwright y puntuación Lighthouse 100/100.

> *"En el **Eje A (Historias de Usuario y E2E)**:*
> 
> *Cubrimos 11 Historias de Usuario con **43 criterios de aceptación en formato Gherkin** evaluados al 100%.*
> 
> *Automatizamos los **6 flujos críticos de punta a punta con Playwright** ejecutándose contra el stack Docker real: autenticación JWT, exploración con filtros, compra completa con hold y pago, publicación de evento, rechazo de credenciales y check-in con doble uso.*
> 
> *Validamos el diseño responsive en resoluciones de 360, 768 y 1280 píxeles sin desbordes. En accesibilidad web WCAG 2.2 AA, las pruebas con **axe-core** reportaron cero violaciones críticas o serias, y la auditoría de **Google Lighthouse** arrojó una puntuación perfecta de **100/100 en Desktop y 100/100 en Mobile**."*

---

### Diapositiva 13: Eje B — Calidad de Código, Cobertura (96.5%) y Mutación (76.2%)
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Dashboard de Vitest y reporte Stryker de mutación.

> *"En el **Eje B (Código y Pruebas Automatizadas)**, superamos ampliamente los umbrales requeridos:*
> 
> *La cátedra exige 80% de líneas y 70% de ramas en la capa de negocio. Nosotros alcanzamos un **96,52% de cobertura de líneas** y un **84,60% de cobertura de ramas**, con más de 250 tests unitarios.*
> 
> *Para validar la efectividad real de los tests, ejecutamos **Mutation Testing con Stryker**. Con un umbral mínimo exigido del 60%, obtuvimos un **Mutation Score de 76,23%**, eliminando 617 mutantes sobre la lógica central de órdenes, pagos y tickets.*
> 
> *Además, la colección Postman de 96 requests corre en CI mediante **Newman** sin un solo fallo, y la suite completa fue ejecutada 3 veces consecutivas para certificar la ausencia total de tests flaky (intermitentes)."*

---

### Diapositiva 14: Eje C — Integración Real y Pruebas de Carga k6 (p95 < 20ms)
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Gráfico de k6 con p95 de 16.41 ms y tasa de errores 0.00%.

> *"En el **Eje C (Integración y Resiliencia)**:*
> 
> *Contamos con una suite de integración de 17 tests que corre contra instancias reales de PostgreSQL y RabbitMQ.*
> 
> *Sometimos a la API a una **Prueba de Carga con k6** simulando **50 Usuarios Virtuales (VUs) concurrentes durante 5 minutos continuos** sobre los endpoints de catálogo y detalle.*
> 
> *El criterio de la cátedra exige un percentil 95 menor a 500 ms. EventHub registró un **p95 de 16,41 milisegundos**, con una tasa de errores del **0,00%** en más de 6.600 transacciones procesadas, demostrando la capacidad del sistema para soportar picos masivos de demanda."*

---

### Diapositiva 15: Eje D — Seguridad Ofensiva, BOLA/BFLA, XXE y ZAP
**Tiempo:** 1:00 min | **Orador 3**  
**En Pantalla:** Informe de OWASP ZAP (0 High/Medium/Low) y tests de seguridad.

> *"En el **Eje D (Seguridad)**, diseñamos una batería de 29 pruebas ofensivas:*
> 
> * *Probamos vulnerabilidades **BOLA/IDOR** verificando que ningún comprador pueda acceder a órdenes o tickets ajenos.*
> * *Probamos **BFLA**, asegurando que los roles `BUYER` sean rechazados con 403 al invocar endpoints de organizador o administración.*
> * *Sometimos la autenticación a tokens JWT manipulados, expirados y con `alg=none`, todos rechazados con 401.*
> * *Ejecutamos ataques de fuerza bruta en el login, comprobando que el rate limiter devuelve **HTTP 429 Too Many Requests**.*
> * *Finalmente, ejecutamos el escaneo dinámico con **OWASP ZAP** (Baseline y API Scan autenticado), obteniendo **0 alertas High, 0 Medium y 0 Low**; y la auditoría de dependencias `pnpm audit --prod` finalizó con **0 vulnerabilidades conocidas**."*

---

### Diapositiva 16: Eje E — Testing de IA y Declaración Formal
**Tiempo:** 0:45 min | **Orador 3**  
**En Pantalla:** Declaración de IA y reporte de pruebas del Asistente.

> *"En el **Eje E (Inteligencia Artificial)**:*
> 
> *El módulo del asistente cuenta con **14 pruebas unitarias y 10 pruebas HTTP E2E** que verifican los guardrails contra inyecciones y la anonimización de datos sensibles.*
> 
> *Asimismo, cumplimos con la **Declaración Formal de Uso de IA** en `DECLARACION_IA.md`, detallando el uso de asistentes para tareas puntuales, registrando los prompts, las salidas aceptadas y los casos donde detectamos y corregimos errores generados por la IA en pipelines y scripts.*
> 
> *Damos paso ahora a la demostración práctica del sistema en vivo."*

---

### Diapositiva 17: Guion de Demostración en Vivo (Flujos de Éxito y Resiliencia)
**Tiempo:** 3:30 min | **Equipo / Operador en Vivo**  
**Acciones en Pantalla:** Terminal + Navegador Web + Postman.

> *(El operador comparte pantalla mostrando la aplicación web levantada en `localhost:5173` o en Railway)*
> 
> 1. **Paso 1: Login y Autenticación con Roles**
>    * *"Ingresamos con la cuenta de comprador `buyer@eventhub.com.ar`. Vemos cómo el frontend recibe el token JWT y lo inyecta en las cabeceras `Authorization`."*
> 
> 2. **Paso 2: Reserva Concurrente y Compra (Flujo Feliz)**
>    * *"Navegamos al recital 'Rock Nacional 2026'. Al hacer clic en comprar, el sistema toma un HOLD atómico por 5 minutos y genera la orden en estado `PENDING`. Ingresamos la tarjeta de prueba. Al confirmar, el Adapter SOAP negocia la aprobación bancaria con el servidor legado, la orden transiciona a `PAID`, se liberan los cupos reservados y se emite el ticket con su código QR criptográfico."*
> 
> 3. **Paso 3: Control de Acceso y Verificación de Error 409**
>    * *"Ahora cambiamos al rol de organizador para escanear la entrada. Realizamos el primer check-in: la entrada es válida y el acceso se autoriza con éxito.*
>    * *Inmediatamente intentamos escanear la misma entrada por segunda vez: el sistema aplica el patrón State y el control de acceso rechaza la operación devolviendo **HTTP 409 Conflict** con detalle Problem Details de 'Entrada ya utilizada'."*
> 
> 4. **Paso 4: Prueba de Resiliencia — Broker Apagado**
>    * *"Para demostrar la resiliencia del patrón Outbox, abrimos la terminal y ejecutamos `docker stop eventhub_broker` deteniendo RabbitMQ.*
>    * *Realizamos una nueva compra desde la API o la web. Noten que la orden se crea exitosamente (HTTP 201) y no se produce ningún error 500.*
>    * *Hacemos un `SELECT * FROM outbox_events`: el evento `order.paid` está guardado en PostgreSQL en estado `PENDING`.*
>    * *Reiniciamos el broker con `docker start eventhub_broker`. En pocos segundos, vemos en los logs del backend cómo el worker reconecta automáticamente, despacha el mensaje a la cola y lo marca como `SENT`. Cero pérdida de mensajes."*

---

### Diapositiva 18: Registro de Defectos, Jira y QA Designado
**Tiempo:** 0:45 min | **Orador 3 / QA Lead**  
**En Pantalla:** Tablero Jira con backlog, defectos cerrados y matriz de trazabilidad.

> *"Respecto a la gestión del proyecto en Jira, el equipo mantuvo el backlog al día bajo la coordinación de nuestro QA Designado.*
> 
> *Actualmente no tenemos **ningún defecto Bloqueante ni Crítico abierto**. Solo registramos un defecto de severidad Menor abierto con workaround:*
> 
> * **EVH-108:** Si un usuario recarga el navegador durante la pantalla de checkout, la vista regresa al catálogo. Sin embargo, no hay pérdida de dinero ni compras duplicadas, ya que el HOLD permanece seguro en el servidor y expira limpiamente a los 5 minutos.*
> 
> *Asimismo, documentamos los defectos detectados y corregidos durante los ensayos, como **EVH-106** (el doble check-in que inicialmente devolvía 200 en lugar de 409) y **EVH-107** (mensajes de login que permitían enumeración de usuarios)."*

---

### Diapositiva 19: Conclusiones, Lecciones Aprendidas y Preguntas de Defensa
**Tiempo:** 0:45 min | **Orador 1**  
**En Pantalla:** Diapositiva de Cierre y enlaces al proyecto.

> *"Para concluir: EventHub demuestra que es posible construir una plataforma de alta demanda combinando tecnologías modernas con sistemas legados sin sacrificar resiliencia, seguridad ni rendimiento.*
> 
> *Los umbrales de cobertura del 96%, el mutation score del 76%, la latencia p95 de 16 ms y la tolerancia a caídas de red respaldan la robustez de nuestra arquitectura.*
> 
> *Estamos orgullosos del trabajo realizado y quedamos a disposición de la cátedra para responder a las preguntas individuales de la defensa. Muchas gracias."*

---

## 🎯 Banco de Preguntas Típicas de Defensa Individual (y Respuestas Técnicas)

Cada integrante del equipo debe estar preparado para responder estas preguntas técnicas frecuentes de los profesores:

#### 1. ¿Por qué una transición inválida de la orden debe devolver 409 y no 400 ni 500?
* **Respuesta:** *"Devolver 500 sería un error de servidor cuando en realidad el sistema funcionó correctamente. 400 es para sintaxis o tipos inválidos en la petición (Bad Request). Según la RFC 9110 de HTTP, el código **409 Conflict** está diseñado específicamente para indicar que la solicitud no puede procesarse debido a un conflicto con el estado actual del recurso en el servidor. Al usar el patrón State, una orden pagada que recibe una orden de cancelación genera un conflicto de estado de negocio, por lo que 409 con formato RFC 9457 Problem Details es la respuesta semánticamente correcta."*

#### 2. ¿Cómo evitaron el problema de la doble fase de commit (2PC) al publicar en RabbitMQ?
* **Respuesta:** *"En lugar de implementar un protocolo pesado y bloqueante como Two-Phase Commit (2PC), implementamos el **Transactional Outbox Pattern (ADR-007)**. Guardamos el evento en la tabla `outbox_events` dentro de la misma transacción de base de datos de PostgreSQL que confirma la orden. Luego, un proceso asíncrono en segundo plano (`OutboxService`) lee los eventos pendientes y los despacha al broker. Si el broker está caído, la base de datos mantiene la consistencia y el dispatcher reintenta cuando el broker revive."*

#### 3. ¿Qué es un ataque XXE y cómo lo mitigaron en la integración SOAP?
* **Respuesta:** *"Un ataque XXE (XML External Entity Injection) ocurre cuando un atacante envía un documento XML que contiene referencias a entidades externas (por ejemplo, `<!ENTITY xxe SYSTEM "file:///etc/passwd">`) para leer archivos del servidor o ejecutar SSRF. Lo mitigamos en `payments.service.ts` configurando el parser de SOAP con la opción `disallowDoctypeDecl` en verdadero y deshabilitando el procesamiento de entidades externas. Además, si se detecta un patrón DTD en la entrada, el servicio aborta inmediatamente con `XXE_INJECTION_REJECTED`."*

#### 4. ¿Qué diferencia hay entre la cobertura de líneas y el Mutation Score de Stryker?
* **Respuesta:** *"La cobertura de código solo mide qué líneas fueron ejecutadas por algún test, pero no garantiza que los tests estén verificando las aserciones correctas. El **Mutation Testing** altera el código fuente introduciendo pequeños defectos sintéticos ('mutantes', como cambiar un `>` por `>=` o eliminar una llamada a función) y vuelve a correr la suite. Si los tests fallan, el mutante fue 'eliminado' (killed); si los tests siguen pasando, el mutante 'sobrevivió'. Nuestro score de 76,23% demuestra que nuestras aserciones realmente atrapan fallos lógicos en el negocio."*

#### 5. ¿Cómo funciona la concurrencia optimista con ETag e If-Match?
* **Respuesta:** *"Cuando el cliente consulta `GET /orders/:id`, la API le devuelve la cabecera `ETag: W/"1"` basada en la columna `version` de TypeORM. Cuando el cliente envía `PATCH /orders/:id/pay`, debe adjuntar `If-Match: "1"`. Si otro proceso modificó la orden previamente (por ejemplo, cancelándola), la versión en la base de datos pasó a 2. La API compara ambos valores y, al no coincidir, lanza una `PreconditionFailedException` que responde **HTTP 412 Precondition Failed**, evitando que un proceso sobreescriba cambios ajenos."*

#### 6. ¿Qué pasa si RabbitMQ entrega dos veces el mismo mensaje de notificación?
* **Respuesta:** *"Nuestro consumidor en `NotificationsController` es **idempotente**. Cada mensaje entrante contiene un identificador único determinístico. El servicio consulta su registro de mensajes procesados: si el ID ya existe, reconoce el mensaje ante RabbitMQ con `ack` para retirarlo de la cola, pero no vuelve a registrar la notificación en la base de datos, garantizando que el usuario no reciba duplicados."*
