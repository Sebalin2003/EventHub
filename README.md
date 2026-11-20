# EventHub 🎟️

Plataforma integral para la venta de entradas, gestión de inventario en tiempo real con reservas HOLD, pagos resilientes SOAP y control de acceso (Check-in). Diseñada bajo una arquitectura limpia en capas, patrones de diseño de software y cumplimiento de estándares de calidad, seguridad y resiliencia (ISO/IEC/IEEE 29119-3 y OWASP ASVS).

---

## 🚀 Despliegue en la Nube (Producción)

EventHub está preparado para desplegarse de manera inmediata en la nube:
- **Backend API & PostgreSQL:** Desplegados en [Render](https://render.com) mediante el archivo [render.yaml](./render.yaml) (Blueprint de 1 clic).
- **Frontend Web:** Desplegado en [Cloudflare Pages](https://pages.cloudflare.com) (Vite + React 19 SPA con soporte de enrutamiento y proxy).

👉 **[Consulta la Guía Completa de Despliegue Paso a Paso (Render + Cloudflare Pages)](./docs/GUIA_DEPLOYMENT.md)**

---

## ⚡ Ejecución Rápida Local (Condición G1)

Levanta el stack completo (**PostgreSQL 15**, **RabbitMQ 3**, **API NestJS** y **Frontend React**) con **un solo comando reproducible**:

```bash
docker compose up -d --build --wait
```

### Servicios Disponibles:
- 🌐 **Frontend Web:** [http://localhost:5173](http://localhost:5173)
- 🔌 **Backend API REST:** [http://localhost:3000](http://localhost:3000)
- 📄 **Contrato OpenAPI 3.1:** [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)
- 🐇 **Panel RabbitMQ Management:** [http://localhost:15672](http://localhost:15672) (Usuario: `user` / Contraseña: `password`)

---

## 📚 Documentación Centralizada

Toda la documentación técnica, arquitectónica y de testing se encuentra organizada en la carpeta **[`docs/`](./docs/README.md)**:

| Categoría | Documentos Principales |
|---|---|
| **🚀 Despliegue e Infraestructura** | • [Guía de Despliegue en Render y Cloudflare Pages](./docs/GUIA_DEPLOYMENT.md)<br>• [Guía de Ejecución Local](./docs/GUIA_LOCAL.md)<br>• [Orquestación Docker Compose](./docker-compose.yml) |
| **🏗️ Arquitectura y Patrones** | • [Documento de Arquitectura](./docs/ARCHITECTURE.md)<br>• [Documento Técnico](./docs/documento_tecnico_eventhub.md)<br>• [Diseño de API REST](./docs/documento_diseño_api.md)<br>• [Diseño Frontend UI/UX](./docs/DESIGN.md)<br>• **[Registros de Decisiones de Arquitectura (8 ADRs)](./docs/adr/README.md)** (State 409, Strategy, Factory, DAO, Adapter SOAP, Circuit Breaker, Outbox, AI Gateway) |
| **🧪 Testing y Calidad (QA)** | • [Informe de Testing ISO/IEC/IEEE 29119-3](./docs/Clase15_GrupoEventHub_Testing.md) ([Versión PDF](./docs/Clase15_GrupoEventHub_Testing.pdf))<br>• [Informe de Cumplimiento de Criterios (G1-G9, Ejes A-E)](./docs/INFORME_CUMPLIMIENTO_TESTING.md)<br>• [Manual de Usuario por Roles](./docs/MANUAL_USUARIO.md)<br>• [Registro de Prueba Exploratoria](./docs/PRUEBA_EXPLORATORIA.md)<br>• [Contratos OpenAPI y WSDL](./docs/contracts/)<br>• [Colección Postman Newman (96 requests)](./docs/postman/) |
| **🤖 Inteligencia Artificial** | • [Declaración Formal de Uso de IA](./docs/DECLARACION_IA.md)<br>• [Evidencia de Testing del Asistente de IA (Guardrails e Inyecciones)](./docs/evidencias/ai/) |
| **📋 Estado y Seguimiento** | • [Estado Unificado y Guion de Demo](./docs/ESTADO_UNIFICADO.md)<br>• [Trazabilidad Jira y Teams](./docs/EVIDENCIA_G4_G5.md)<br>• [Guía de Estudio para la Defensa Individual](./docs/guia_estudio_defensa.md) |
| **📦 Producto y Requerimientos** | • [Definición de Producto](./docs/PRODUCT.md)<br>• [Matriz de Requerimientos](./docs/REQUIREMENTS.md) |

---

## 👥 Usuarios de Prueba Precargados (Seed)

Contraseña única para todos los perfiles: **`password`**

| Rol | Correo Electrónico | Alcance de Permisos |
|---|---|---|
| **Asistente** | `maria@eventhub.com.ar` | Exploración de catálogo, reserva HOLD, compra, tickets digitales y favoritos. |
| **Organizador** | `eventos@eventhub.com.ar` | Creación y publicación de eventos, control de cupos y visualización de ventas. |
| **Staff** | `staff@eventhub.com.ar` | Control de accesos y escaneo de entradas (Check-in con prevención de doble uso). |
| **Administrador** | `admin@eventhub.com.ar` | Gestión total de la plataforma, eventos, inventario, auditoría y seguridad. |

---

## 🧪 Comandos de Testing y Verificación

```bash
# 1. Pruebas unitarias de API con reporte de cobertura (Eje B: > 80% líneas, > 70% ramas)
pnpm --filter api test:cov

# 2. Pruebas E2E de integración real contra PostgreSQL y RabbitMQ
pnpm --filter api test:e2e

# 3. Mutation Testing con Stryker (Score > 60%)
pnpm --filter api test:mutation

# 4. Pruebas de contrato y colección Postman con Newman
pnpm --filter api openapi:export
npx newman run docs/postman/EventHub_API_Collection.json

# 5. Pruebas de reglas de negocio en frontend
pnpm --filter @evenhub/web test

# 6. Compilación y chequeo de tipos estáticos
pnpm --filter api build
pnpm --filter @evenhub/web build
pnpm --filter @evenhub/web typecheck
```
