# Registro de Prueba Exploratoria — EventHub

**Fecha de la sesión interna:** 07/11/2026
**Duración:** ~10 minutos de ejecución efectiva
**Entorno:** stack Docker completo (`docker compose up -d --build --wait`), web http://localhost:5173, API http://localhost:3000, PostgreSQL 15 y RabbitMQ 3.
**Navegador:** Chromium 1254 (Playwright), ventana 1280×800 y viewport móvil 360×800.
**Ejecutada por:** equipo de QA de EventHub.
**Alcance:** sesión exploratoria sin guion sobre los flujos públicos, de organizador y de staff.

> **Alcance de esta evidencia:** esta sesión interna **no reemplaza** la prueba exploratoria del docente (hasta 10 minutos, sin guion, en clase). El registro del docente se completará en la tabla final. Lo que sigue es evidencia real de una sesión propia, ejecutada con los mismos disparadores que propone la cátedra.

---

## 1. Charter exploratorio

Explorar el sistema buscando fallas en: datos inválidos, doble clic, navegación hacia atrás, recarga en medio de una operación, sesión inválida y concurrencia/doble uso. Registrar cada comportamiento observado con su resultado esperado, real y severidad.

## 2. Sondeos ejecutados

| # | Disparador | Acción realizada | Resultado esperado | Resultado observado | Veredicto |
|---|---|---|---|---|---|
| P1 | Datos inválidos | Login con `maria@eventhub.com.ar` y contraseña `incorrecta` | Mensaje de credenciales inválidas, sin sesión | Se mostraba «Usuario no encontrado» (mensaje engañoso: la API responde genéricamente y la UI afirmaba que el usuario no existía) y no se otorgaba sesión | **DEFECTO EVH-107** — corregido |
| P2 | Doble clic | Doble clic sobre **Confirmar compra** en el checkout | Una sola orden creada, sin cargos duplicados | Se creó exactamente 1 orden (3 → 4 en el estado demo) y se mostró «Compra confirmada» una vez | PASA |
| P3 | Recarga en medio de la operación | Recargar (F5) en el paso **Medio de pago** | Estado consistente, sin orden duplicada | La aplicación vuelve al inicio, la reserva temporal permanece activa hasta su vencimiento (5 min) y no se crea ninguna orden | **DEFECTO EVH-108** (Menor) — abierto con workaround |
| P4 | Volver atrás | Presionar **Cancelar y volver** desde el paso **Medio de pago** | Reserva liberada y retorno al detalle | La reserva pasa a estado `released` y se vuelve al detalle del evento | PASA |
| P5 | Dato inválido en check-in | Ingresar `TKT-NO-EXISTE` en el portal del staff | Rechazo sin validar ingreso | Se muestra «Entrada inválida», el contador de ingresados no aumenta y el intento queda en **Últimos accesos** | PASA |
| P6 | Doble uso / concurrencia | Validar `TKT-001`, luego validarlo otra vez | Primero válido; segundo rechazado | «Entrada válida» y luego «Entrada ya utilizada» | PASA (cubierto también por A6 automatizado) |

## 3. Defectos detectados en la sesión

### EVH-107 — Mensaje de error de login engañoso (corregido)

- **Severidad:** Menor
- **Descripción:** ante una contraseña incorrecta, la interfaz mostraba «Usuario no encontrado». El backend responde con un mensaje genérico de credenciales inválidas, por lo que la UI agregaba información incorrecta y sugería que el email no existía.
- **Corrección aplicada:** se reemplazó el texto por «Credenciales inválidas» en español y «Invalid credentials» en inglés (`invalidCredentials` en `i18n.tsx`).
- **Verificación:** el escenario automatizado **A5** de `apps/web/e2e/critical-flows.spec.ts` verifica el mensaje y que no se persista el token. Pasa en la suite completa del 07/11/2026.

### EVH-108 — La recarga en el checkout pierde el contexto de la operación (abierto, Menor)

- **Severidad:** Menor
- **Descripción:** al recargar la página en el paso **Medio de pago**, la aplicación vuelve al inicio. La reserva temporal sigue activa hasta su TTL de 5 minutos, por lo que el inventario queda retenido sin que el usuario vea el checkout.
- **Impacto:** no hay pérdida de datos ni órdenes duplicadas; el usuario debe volver a seleccionar entradas y la reserva anterior expira sola.
- **Workaround:** volver a abrir el evento y reiniciar la compra; esperar a que expire la reserva o usar **Restablecer demo**.
- **Plan de corrección:** persistir la vista y el `holdId` en `sessionStorage` y restaurar el paso de pago al recargar. Se deja registrado para la próxima iteración; no bloquea la entrega por ser severidad Menor con workaround.

## 4. Observaciones sin defecto

- El doble clic en **Confirmar compra** no duplica órdenes.
- Cancelar el checkout libera la reserva (`status: released`).
- Un código inexistente en el check-in se rechaza y queda auditado en **Últimos accesos**.
- El segundo escaneo del mismo ticket devuelve «Entrada ya utilizada» sin incrementar el contador.
- Las credenciales inválidas no dejan token en `localStorage`.

## 5. Evidencia y reproducibilidad

- Suite automatizada que cubre los sondeos P2, P4, P5 y P6: `apps/web/e2e/critical-flows.spec.ts` (escenarios A3 y A6).
- Verificación del mensaje corregido: escenario A5.
- La sesión se ejecutó contra el stack Docker real, no contra mocks.
- Reporte de Playwright: `apps/web/playwright-report/` (generado en cada corrida) y artefactos en `apps/web/test-results/`.

## 6. Registro de la sesión del docente

| Fecha | Duración | Ejecutada por | Sondeos realizados | Defectos encontrados | Observaciones |
|---|---|---|---|---|---|
| Pendiente | ≤ 10 min | Docente | A definir en clase | — | Se completará durante la defensa |

> Si el docente encuentra un defecto no registrado aquí, se abre el ticket correspondiente en Jira con severidad, evidencia y vínculo a la HU afectada, y se actualiza este documento.
