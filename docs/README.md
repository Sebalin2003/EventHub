# 📚 Centro de Documentación — EventHub

Toda la documentación técnica, funcional, arquitectónica, de calidad y de despliegue del proyecto EventHub se encuentra categorizada en las siguientes subcarpetas especializadas:

---

## 🗂️ Estructura de Subcarpetas

```text
docs/
├── 🚀 despliegue/       # Guías de hosting (Render, Cloudflare Pages, Docker Compose)
├── 🏗️ arquitectura/     # Especificación de capas, diseño de API y registros de arquitectura (ADRs)
├── 🧪 testing/          # Entregables ISO 29119-3, criterios de cátedra, manual de usuario y defectos
├── 🤖 ia/               # Declaración formal obligatoria y evidencias del asistente de IA
├── 📋 seguimiento/      # Estado unificado del proyecto, hitos parciales y guías de defensa
├── 📦 producto/         # Definición de producto, visión y matriz de requerimientos
├── 📄 contracts/        # Contratos formales OpenAPI 3.1 y WSDL SOAP
├── 📮 postman/          # Colección Postman con 96 requests ejecutadas en CI con Newman
└── 📊 evidencias/       # Reportes de pruebas de carga k6, accesibilidad Lighthouse y ZAP
```

---

## 📖 Índice Detallado por Subcarpeta

### 1. 🚀 [`docs/despliegue/`](./despliegue/)
- **[GUIA_DEPLOYMENT.md](./despliegue/GUIA_DEPLOYMENT.md):** Manual paso a paso para desplegar en producción: **Backend en Render** (NestJS + PostgreSQL) y **Frontend en Cloudflare Pages** (Vite + React 19 SPA).
- **[GUIA_LOCAL.md](./despliegue/GUIA_LOCAL.md):** Instrucciones para levantar el stack completo localmente con Docker Compose o en modo desarrollo.

### 2. 🏗️ [`docs/arquitectura/`](./arquitectura/)
- **[ARCHITECTURE.md](./arquitectura/ARCHITECTURE.md):** Especificación técnica de la arquitectura en capas, responsabilidades y comunicación inter-módulos.
- **[DESIGN.md](./arquitectura/DESIGN.md):** Directrices y decisiones de diseño frontend y UI/UX ("boletería contemporánea").
- **[documento_diseño_api.md](./arquitectura/documento_diseño_api.md):** Diseño formal de la API REST, códigos HTTP y contratos.
- **[documento_tecnico_eventhub.md](./arquitectura/documento_tecnico_eventhub.md):** Memoria técnica del backend y especificación de flujos síncronos y asíncronos.
- **[adr/ (Registros de Decisiones de Arquitectura)](./arquitectura/adr/README.md):** 8 registros detallados de los patrones implementados:
  - [ADR-001](./arquitectura/adr/ADR-001-patron-state-ordenes-409.md): **Patrón State** en entidad `Order` con HTTP 409 ante transiciones inválidas.
  - [ADR-002](./arquitectura/adr/ADR-002-patron-strategy-hashing.md): **Patrón Strategy** para hashing adaptativo de contraseñas (`scrypt`).
  - [ADR-003](./arquitectura/adr/ADR-003-patron-factory-eventos.md): **Patrón Factory** para instanciación consistente de eventos (`EventFactory`).
  - [ADR-004](./arquitectura/adr/ADR-004-patron-dao-persistencia.md): **Patrón DAO** para aislamiento de persistencia y soporte dual UUID / `legacyId`.
  - [ADR-005](./arquitectura/adr/ADR-005-patron-adapter-pasarela-soap.md): **Patrón Adapter** para pasarela legada SOAP con mitigación de XXE.
  - [ADR-006](./arquitectura/adr/ADR-006-patron-circuit-breaker-timeout.md): **Patrón Circuit Breaker** y timeout de 5 segundos con fallback.
  - [ADR-007](./arquitectura/adr/ADR-007-patron-outbox-mensajeria-rabbitmq.md): **Patrón Transactional Outbox** y mensajería durable sin pérdida con RabbitMQ.
  - [ADR-008](./arquitectura/adr/ADR-008-patron-gateway-inteligencia-artificial.md): **Patrón Gateway** y guardrails defensivos para el Asistente de IA.

### 3. 🧪 [`docs/testing/`](./testing/)
- **[Clase15_GrupoEventHub_Testing.md](./testing/Clase15_GrupoEventHub_Testing.md):** Entregable principal de aseguramiento de calidad según estándar ISO/IEC/IEEE 29119-3 (Ejes A a E y G1 a G9).
- **[Clase15_GrupoEventHub_Testing.pdf](./testing/Clase15_GrupoEventHub_Testing.pdf):** Versión imprimible/entregable oficial del informe de testing.
- **[INFORME_CUMPLIMIENTO_TESTING.md](./testing/INFORME_CUMPLIMIENTO_TESTING.md):** Informe ejecutivo de auditoría contra los criterios de admisibilidad G1-G9 y umbrales de testing.
- **[criterios_de_testing.md](./testing/criterios_de_testing.md):** Pauta de evaluación provista por la cátedra para la prueba del sistema.
- **[MANUAL_USUARIO.md](./testing/MANUAL_USUARIO.md):** Manual operativo para los roles Asistente, Organizador, Staff y Administrador.
- **[PRUEBA_EXPLORATORIA.md](./testing/PRUEBA_EXPLORATORIA.md):** Registro de la sesión de prueba exploratoria interna.

### 4. 🤖 [`docs/ia/`](./ia/)
- **[DECLARACION_IA.md](./ia/DECLARACION_IA.md):** Declaración formal obligatoria de herramientas de IA utilizadas, versiones, prompts representativos, salidas aceptadas y casos reales corregidos.
- **[evidencias/ai/](../docs/evidencias/ai/):** Evidencias detalladas de testing sobre el Asistente de IA (guardrails médicos/legales, inyección directa/indirecta y sanitización de PII).

### 5. 📋 [`docs/seguimiento/`](./seguimiento/)
- **[ESTADO_UNIFICADO.md](./seguimiento/ESTADO_UNIFICADO.md):** Documento vivo del estado del proyecto, verificación con `curl` y guion de demostración en vivo.
- **[ESTADO_PROYECTO.md](./seguimiento/ESTADO_PROYECTO.md):** Registro histórico de avances del monorepo y backend.
- **[ENTREGA_PARCIAL_2.md](./seguimiento/ENTREGA_PARCIAL_2.md):** Requerimientos y arquitectura de integración de la 2.ª Entrega Parcial.
- **[EVIDENCIA_G4_G5.md](./seguimiento/EVIDENCIA_G4_G5.md):** Trazabilidad de entregables en Teams (G4) y tablero Jira (G5).
- **[guia_estudio_defensa.md](./seguimiento/guia_estudio_defensa.md):** Guía de estudio y preparación individual para la defensa oral del sistema.

### 6. 📦 [`docs/producto/`](./producto/)
- **[PRODUCT.md](./producto/PRODUCT.md):** Visión de producto, propuesta de valor y perfiles de usuario.
- **[REQUIREMENTS.md](./producto/REQUIREMENTS.md):** Requerimientos funcionales y no funcionales detallados.

---

### 📄 Contratos, Pruebas y Evidencias Técnicas
- **[contracts/](./contracts/):** Contratos formales OpenAPI 3.1 (`openapi.json`) y WSDL SOAP (`payments.wsdl`).
- **[postman/](./postman/):** Colección Postman versionada (`EventHub_API_Collection.json`, 96 requests / 176 aserciones).
- **[evidencias/](./evidencias/):** Reportes reproducibles de carga con k6 (`k6-summary.json`), accesibilidad Lighthouse 100/100, escaneo OWASP ZAP y resiliencia de broker.
