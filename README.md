# EventHub 🎟️

Plataforma integral para la venta de entradas, gestión de inventario en tiempo real con reservas HOLD, pagos resilientes SOAP y control de acceso (Check-in). Diseñada bajo una arquitectura limpia en capas, patrones de diseño de software y cumplimiento de estándares de calidad, seguridad y resiliencia (ISO/IEC/IEEE 29119-3 y OWASP ASVS).

---

## 🚀 Despliegue en la Nube (Producción)

EventHub está preparado para desplegarse de manera inmediata en la nube:
- **Backend API & Base de Datos:** Desplegados en [Railway](https://railway.app) (con red privada interna y PostgreSQL) o en [Render](https://render.com) (mediante [render.yaml](./render.yaml)).
- **Frontend Web:** Desplegado en [Cloudflare Pages](https://pages.cloudflare.com) o directamente en [Railway](https://railway.app) (Vite + React 19 SPA con soporte de enrutamiento y proxy).

👉 **[Consulta la Guía Completa de Despliegue Paso a Paso (Railway + Cloudflare Pages)](./docs/despliegue/GUIA_DEPLOYMENT.md)**

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

## 📚 Documentación Centralizada y Discriminada

Toda la documentación técnica, arquitectónica y de testing se encuentra clasificada en subcarpetas temáticas dentro de **[`docs/`](./docs/README.md)**:

| Subcarpeta | Contenido y Enlaces Principales |
|---|---|
| **🚀 [`docs/despliegue/`](./docs/despliegue/)** | • [Guía de Despliegue en Render y Cloudflare Pages](./docs/despliegue/GUIA_DEPLOYMENT.md)<br>• [Guía de Ejecución Local](./docs/despliegue/GUIA_LOCAL.md)<br>• [Orquestación Docker Compose](./docker-compose.yml) |
| **🏗️ [`docs/arquitectura/`](./docs/arquitectura/)** | • [Documento de Arquitectura](./docs/arquitectura/ARCHITECTURE.md)<br>• [Documento Técnico](./docs/arquitectura/documento_tecnico_eventhub.md)<br>• [Diseño de API REST](./docs/arquitectura/documento_diseño_api.md)<br>• [Diseño Frontend UI/UX](./docs/arquitectura/DESIGN.md)<br>• **[Registros de Decisiones de Arquitectura (8 ADRs)](./docs/arquitectura/adr/README.md)** (State 409, Strategy, Factory, DAO, Adapter SOAP, Circuit Breaker, Outbox, AI Gateway) |
| **🧪 [`docs/testing/`](./docs/testing/)** | • [Informe de Testing ISO/IEC/IEEE 29119-3](./docs/testing/Clase15_GrupoEventHub_Testing.md) ([Versión PDF](./docs/testing/Clase15_GrupoEventHub_Testing.pdf))<br>• [Informe de Cumplimiento de Criterios (G1-G9, Ejes A-E)](./docs/testing/INFORME_CUMPLIMIENTO_TESTING.md)<br>• [Manual de Usuario por Roles](./docs/testing/MANUAL_USUARIO.md)<br>• [Registro de Prueba Exploratoria](./docs/testing/PRUEBA_EXPLORATORIA.md)<br>• [Contratos OpenAPI y WSDL](./docs/contracts/)<br>• [Colección Postman Newman (96 requests)](./docs/postman/) |
| **🤖 [`docs/ia/`](./docs/ia/)** | • [Declaración Formal de Uso de IA](./docs/ia/DECLARACION_IA.md)<br>• [Evidencia de Testing del Asistente de IA (Guardrails e Inyecciones)](./docs/evidencias/ai/) |
| **📋 [`docs/seguimiento/`](./docs/seguimiento/)** | • [Estado Unificado y Guion de Demo](./docs/seguimiento/ESTADO_UNIFICADO.md)<br>• [Trazabilidad Jira y Teams](./docs/seguimiento/EVIDENCIA_G4_G5.md)<br>• [Guía de Estudio para la Defensa Individual](./docs/seguimiento/guia_estudio_defensa.md) |
| **📦 [`docs/producto/`](./docs/producto/)** | • [Definición de Producto](./docs/producto/PRODUCT.md)<br>• [Matriz de Requerimientos](./docs/producto/REQUIREMENTS.md) |

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
