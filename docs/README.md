# 📚 Centro de Documentación — EventHub

Toda la documentación técnica, funcional, arquitectónica, de calidad y de despliegue del proyecto EventHub se encuentra centralizada en este directorio.

---

## 🗂️ Índice General por Área

### 1. 🚀 Despliegue e Infraestructura
- **[GUIA_DEPLOYMENT.md](GUIA_DEPLOYMENT.md):** Manual paso a paso para desplegar en producción: **Backend en Render** (NestJS + PostgreSQL) y **Frontend en Cloudflare Pages** (Vite + React).
- **[GUIA_LOCAL.md](GUIA_LOCAL.md):** Instrucciones detalladas para levantar el stack completo localmente con Docker Compose o en modo desarrollo.
- **[docker-compose.yml](../docker-compose.yml):** Orquestación reproducible con un solo comando (`docker compose up -d --build --wait`) de los 4 servicios: base de datos, broker, API y frontend.

### 2. 🏗️ Arquitectura y Patrones de Diseño
- **[ARCHITECTURE.md](ARCHITECTURE.md):** Especificación técnica de la arquitectura del sistema, separación por capas, responsabilidades y comunicación inter-módulos.
- **[DESIGN.md](DESIGN.md):** Directrices y decisiones de diseño frontend y UI/UX.
- **[documento_diseño_api.md](documento_diseño_api.md):** Diseño formal de la API REST, códigos HTTP y contratos de solicitud/respuesta.
- **[documento_tecnico_eventhub.md](documento_tecnico_eventhub.md):** Memoria técnica del backend y especificación de flujos síncronos y asíncronos.
- **[Registro de Decisiones de Arquitectura (ADRs)](adr/README.md):** 8 registros detallados de los patrones implementados:
  - [ADR-001](adr/ADR-001-patron-state-ordenes-409.md): **Patrón State** en entidad `Order` con HTTP 409 ante transiciones inválidas.
  - [ADR-002](adr/ADR-002-patron-strategy-hashing.md): **Patrón Strategy** para hashing adaptativo de contraseñas (`scrypt`).
  - [ADR-003](adr/ADR-003-patron-factory-eventos.md): **Patrón Factory** para instanciación consistente de eventos (`EventFactory`).
  - [ADR-004](adr/ADR-004-patron-dao-persistencia.md): **Patrón DAO** para aislamiento de persistencia y soporte dual UUID / `legacyId`.
  - [ADR-005](adr/ADR-005-patron-adapter-pasarela-soap.md): **Patrón Adapter** para pasarela legada SOAP con mitigación de XXE.
  - [ADR-006](adr/ADR-006-patron-circuit-breaker-timeout.md): **Patrón Circuit Breaker** y timeout de 5 segundos con fallback.
  - [ADR-007](adr/ADR-007-patron-outbox-mensajeria-rabbitmq.md): **Patrón Transactional Outbox** y mensajería durable sin pérdida con RabbitMQ.
  - [ADR-008](adr/ADR-008-patron-gateway-inteligencia-artificial.md): **Patrón Gateway** y guardrails defensivos para el Asistente de IA.

### 3. 🧪 Testing y Aseguramiento de Calidad (QA)
- **[Clase15_GrupoEventHub_Testing.md](Clase15_GrupoEventHub_Testing.md):** Entregable principal de aseguramiento de calidad según estándar ISO/IEC/IEEE 29119-3 (Ejes A a E y G1 a G9).
- **[Clase15_GrupoEventHub_Testing.pdf](Clase15_GrupoEventHub_Testing.pdf):** Versión imprimible/entregable oficial del informe de testing.
- **[INFORME_CUMPLIMIENTO_TESTING.md](INFORME_CUMPLIMIENTO_TESTING.md):** Informe ejecutivo de auditoría contra los criterios de admisibilidad G1-G9 y umbrales de testing.
- **[criterios_de_testing.md](criterios_de_testing.md):** Pauta de evaluación provista por la cátedra para la prueba del sistema.
- **[MANUAL_USUARIO.md](MANUAL_USUARIO.md):** Manual operativo para los roles Asistente, Organizador, Staff y Administrador.
- **[PRUEBA_EXPLORATORIA.md](PRUEBA_EXPLORATORIA.md):** Registro de la sesión de prueba exploratoria interna.
- **[contracts/](contracts/):** Contratos formales OpenAPI 3.1 (`openapi.json`) y WSDL SOAP (`payments.wsdl`).
- **[postman/](postman/):** Colección Postman versionada (`EventHub_API_Collection.json`, 96 requests / 176 aserciones).
- **[evidencias/](evidencias/):** Reportes reproducibles de carga con k6 (`k6-summary.json`), accesibilidad Lighthouse 100/100, escaneo OWASP ZAP y resiliencia de broker.

### 4. 🤖 Inteligencia Artificial
- **[DECLARACION_IA.md](DECLARACION_IA.md):** Declaración formal obligatoria de herramientas de IA utilizadas, versiones, prompts representativos, salidas aceptadas y casos reales corregidos.
- **[evidencias/ai/](evidencias/ai/):** Evidencias detalladas de testing sobre el Asistente de IA (guardrails médicos/legales, inyección directa/indirecta y sanitización de PII).

### 5. 📋 Estado del Proyecto y Entregas Parciales
- **[ESTADO_UNIFICADO.md](ESTADO_UNIFICADO.md):** Documento vivo del estado del proyecto, verificación con `curl` y guion de demostración en vivo.
- **[ESTADO_PROYECTO.md](ESTADO_PROYECTO.md):** Registro histórico de avances del monorepo y backend.
- **[ENTREGA_PARCIAL_2.md](ENTREGA_PARCIAL_2.md):** Requerimientos y arquitectura de integración de la 2.ª Entrega Parcial.
- **[EVIDENCIA_G4_G5.md](EVIDENCIA_G4_G5.md):** Trazabilidad de entregables en Teams (G4) y tablero Jira (G5).
- **[guia_estudio_defensa.md](guia_estudio_defensa.md):** Guía de estudio y preparación individual para la defensa oral del sistema.

### 6. 📦 Requerimientos y Definición de Producto
- **[PRODUCT.md](PRODUCT.md):** Visión de producto, propuesta de valor y perfiles de usuario.
- **[REQUIREMENTS.md](REQUIREMENTS.md):** Requerimientos funcionales y no funcionales detallados.
