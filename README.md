# EvenHub

Demo frontend de una plataforma para vender entradas y administrar eventos. Mantiene el lenguaje visual de “boletería contemporánea” definido en [`DESIGN.md`](./DESIGN.md) y ofrece recorridos para asistentes, organizadores, staff y administradores.

> **Estado:** el catálogo de eventos se carga desde el backend NestJS y PostgreSQL cuando están disponibles; compras, tickets, check-in y servicios externos continúan funcionando como demo local.

> **CI:** [run verde sobre el tag `v1.0-testing`](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml) — build, lint, typecheck, 3 corridas de tests, cobertura, contratos, Newman, E2E, smoke Docker y mutation testing.

## Perfiles de demostración

| Perfil | Usuario demo | Funciones |
|---|---|---|
| Asistente | `maria@eventHub.com` | Favoritos, compra, entradas, historial y reembolsos. |
| Organizador | `org@techmadrid.es` | Eventos, inventario, ventas, asistentes y check-in. |
| Staff | `staff@eventHub.com` | Validación persistente de entradas. |
| Administrador | `admin@eventHub.com` | Usuarios, eventos y auditoría real del demo. |

La pestaña **Demostración** permite elegir un perfil directamente. El formulario local identifica el email, pero no valida la contraseña.

## Funciones implementadas

- Exploración, búsqueda, filtros, favoritos por usuario y detalle de eventos.
- Navegación accesible, breadcrumbs, toasts, skeletons y estados vacíos.
- Evento con sectores y asientos numerados, mapa operable por teclado y alternativa textual.
- Reservas HOLD persistentes de cinco minutos y disponibilidad efectiva.
- Checkout con importes en centavos, pagos aprobados o rechazados e idempotencia local.
- Órdenes, tickets y reembolsos con desglose y restitución de inventario.
- Descarga local de tickets como PNG con datos legibles y representación QR.
- Creación, edición, publicación y cancelación de eventos del organizador.
- Check-in persistente con resultados válido, usado, inválido y evento incorrecto.
- Auditoría alimentada por compras, eventos, reembolsos y check-ins reales del demo.
- Diseño adaptable a escritorio, tablet y celular, foco visible y movimiento reducido.
- Acción **Restablecer demo** para volver a los datos iniciales.

El estado se almacena de forma versionada en `localStorage`. Recargar la aplicación conserva sesión, favoritos, HOLD, órdenes, tickets, reembolsos, eventos, check-ins y auditoría.

## Fuera del alcance actual

- Migración completa de órdenes, tickets y check-in al backend.
- Pasarela de pagos, correo, mensajería e integraciones REST/SOAP reales.
- Generación directa de PDF; el demo entrega PNG.
- Sincronización automática de los cambios de código hacia Figma.

## Tecnologías

- React 19, TypeScript y Vite.
- Tailwind CSS 4 y estilos CSS del sistema visual.
- Vitest para las reglas de negocio del demo y suite de testing.
- pnpm.

## Ejecución Reproducible desde Cero (Condición G1 - Cátedra)

Para levantar el sistema completo (Backend NestJS, Frontend React, base de datos PostgreSQL, broker RabbitMQ y pasarela de pago) en una máquina limpia con un **único comando**:

```bash
docker compose up -d --build --wait
```

El comando espera a que PostgreSQL, RabbitMQ, la API y la web estén `healthy`. Verificado el 06/11/2026.

- **Frontend Web:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **RabbitMQ Management:** [http://localhost:15672](http://localhost:15672) (user: `user`, password: `password`)
- **Entregable de Testing ISO/IEC 29119-3:** [`docs/Clase15_GrupoEventHub_Testing.md`](./docs/Clase15_GrupoEventHub_Testing.md)
- **Colección Postman versionada:** [`docs/postman/EventHub_API_Collection.json`](./docs/postman/EventHub_API_Collection.json)
- **Script de Pruebas de Carga (k6):** [`load-tests/k6-load-test.js`](./load-tests/k6-load-test.js)

### Ejecución Local Alternativa (Sin Docker)

```bash
pnpm install
pnpm --filter api start:dev
pnpm --filter @evenhub/web dev
```

## Verificación y Pruebas Automatizadas (Ejes A, B, C, D, E)

```bash
# 1. Pruebas unitarias, de dominio y seguridad con reporte de cobertura (Ejes B, D y E)
pnpm --filter api test:cov

# 2. E2E e integración real con PostgreSQL y RabbitMQ (Eje B y Eje C)
pnpm --filter api test:e2e

# 3. Pruebas de reglas de negocio en frontend
pnpm --filter @evenhub/web test

# 4. Mutation testing de la capa de dominio
pnpm --filter api test:mutation

# 5. Contrato OpenAPI publicado y colección Postman
pnpm --filter api openapi:export
npx newman run docs/postman/EventHub_API_Collection.json

# 6. Compilación y chequeo estático
pnpm --filter api build
pnpm --filter @evenhub/web build
pnpm --filter @evenhub/web typecheck
```

Estado real de la suite (medido el 09/11/2026):
- **Eje A:** 18 pruebas Playwright contra el stack Docker (6 críticas, 3 responsive y 9 de accesibilidad), axe sin violaciones critical/serious y Lighthouse 100/100.
- **Eje B:** 253 pruebas unitarias de API y 8 de frontend, todas verdes. Cobertura real: **96,52% de líneas / 84,60% de ramas** (94,43% de sentencias). Mutation score **76,23%** con Stryker. Integración real con PostgreSQL y RabbitMQ, contratos OpenAPI/WSDL, Newman con 96 requests / 176 aserciones y 3 corridas consecutivas sin fallos.
- **Eje C:** los 10 criterios quedaron cubiertos con evidencia reproducible: SOAP real con Faults de negocio/técnico y timeout de 5 s sin XML crudo, Circuit Breaker con fallback, outbox transaccional en PostgreSQL, caída y recuperación de RabbitMQ sin pérdida (`docs/evidencias/broker-recovery.json`), consumidor idempotente, DLQ real con `x-death` y reproceso, compensación de pago rechazado, idempotencia HTTP, ETag/412 y Problem Details. Carga k6 con 50 VUs durante 5 minutos: **p95 = 16,41 ms, error rate = 0,00%** (6.695 iteraciones, `docs/evidencias/k6-summary.json`).
- **Suite E2E de API:** 37 tests en 5 archivos, incluidos los 17 de integración real y los 9 de contrato SOAP.
- **Eje D:** BOLA/IDOR, BFLA, JWT `alg=none`, rate limiting 429, scrypt y RFC 9457 Problem Details cubiertos por tests. Mass assignment, XSS y headers quedan como evidencia parcial.
- **Eje E:** testing de IA (prompt injection, guardrails temáticos, sanitización PII y fallback).
- **G6:** Gitleaks v8.28.0 sobre todo el historial, sin hallazgos.

Las brechas y el plan para cerrarlas están en [`INFORME_CUMPLIMIENTO_TESTING.md`](./INFORME_CUMPLIMIENTO_TESTING.md).

## Estructura principal

```text
EvenHub/
├── apps/
│   ├── api/
│   └── web/
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── infra/
│   └── docker-compose.yml
├── pnpm-workspace.yaml
├── PRODUCT.md
├── DESIGN.md
├── REQUIREMENTS.md
└── ARCHITECTURE.md
```

## Documentación

- [`PRODUCT.md`](./PRODUCT.md): propósito, usuarios y principios.
- [`DESIGN.md`](./DESIGN.md): sistema visual, componentes y accesibilidad.
- [`REQUIREMENTS.md`](./REQUIREMENTS.md): requisitos y criterios de aceptación.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md): arquitectura objetivo y evolución técnica.
- [Prototipo original en Figma Make](https://www.figma.com/make/h8xncc6mVYtRn61S6zNKQg/Event-Management-System?p=f).

## Uso de inteligencia artificial

El prototipo visual inicial fue generado con Figma Make. Codex se utilizó para trasladarlo al repositorio, definir la documentación e implementar y verificar el demo frontend. El equipo debe revisar, comprender y mantener los cambios antes de una entrega académica.
