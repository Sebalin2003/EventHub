# EvenHub

Demo frontend de una plataforma para vender entradas y administrar eventos. Mantiene el lenguaje visual de “boletería contemporánea” definido en [`DESIGN.md`](./DESIGN.md) y ofrece recorridos para asistentes, organizadores, staff y administradores.

> **Estado:** demo frontend funcional con persistencia local. Los pagos, reembolsos, notificaciones y servicios externos son simulaciones deterministas; no existe todavía un backend ni autenticación real.

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

- Backend, PostgreSQL, RabbitMQ y autenticación real.
- Pasarela de pagos, correo, mensajería e integraciones REST/SOAP reales.
- Generación directa de PDF; el demo entrega PNG.
- Sincronización automática de los cambios de código hacia Figma.

## Tecnologías

- React 19, TypeScript y Vite.
- Tailwind CSS 4 y estilos CSS del sistema visual.
- Vitest para las reglas de negocio del demo.
- pnpm.

## Ejecución

```bash
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

Las pruebas cubren aislamiento y persistencia de favoritos, vencimiento de HOLD, doble venta, cálculos monetarios, idempotencia, reembolsos, inventario y check-in repetido.

## Estructura principal

```text
EvenHub/
├── src/
│   ├── components/
│   │   ├── public/
│   │   ├── organizer/
│   │   ├── staff/
│   │   ├── admin/
│   │   └── shared/
│   ├── data/
│   ├── App.tsx
│   ├── demoStore.ts
│   ├── demoStore.test.ts
│   ├── ticketDownload.ts
│   ├── index.css
│   └── types.ts
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
