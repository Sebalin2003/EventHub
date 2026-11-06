# Evidencia para G4 (Teams) y G5 (Jira)

Estado al **06/11/2026**. Este archivo es una guía operativa: reúne qué subir a Teams, qué cargar en Jira y qué campos faltan completar con datos del equipo.

---

## 1. Entrega en Teams (G4)

Subir en la carpeta del equipo antes del **10/11/2026 a las 13:30**:

| # | Archivo | Origen | Estado |
|---|---|---|---|
| 1 | `Clase15_GrupoEventHub_Testing.pdf` | Generado desde `docs/Clase15_GrupoEventHub_Testing.md` | Listo para generar |
| 2 | `INFORME_CUMPLIMIENTO_TESTING.md` | Raíz del repo | Listo |
| 3 | `coverage-report.zip` | `apps/api/coverage/` | Generar con `pnpm --filter api test:cov` |
| 4 | `gitleaks-report.txt` | Salida de Gitleaks | Generar con el comando de abajo |
| 5 | `docker-compose-smoke.txt` | Salida de `docker compose up -d --build --wait` + smoke | Generar |
| 6 | `ci-run-url.txt` | URL del run de GitHub Actions sobre el tag | Listo: [workflow CI](https://github.com/Sebalin2003/EventHub/actions/workflows/ci.yml) |

Comandos para producir la evidencia:

```bash
pnpm --filter api test:cov
docker run --rm -v "$PWD:/repo" -w /repo zricethezav/gitleaks:v8.28.0 \
  detect --source /repo --config /repo/.gitleaks.toml --no-banner --redact --verbose \
  | tee gitleaks-report.txt
docker compose up -d --build --wait
docker compose ps | tee docker-compose-smoke.txt
docker compose down -v --remove-orphans
```

> El PDF debe ser **un único archivo**. No subir el `.md` como reemplazo del PDF; usarlo solo como fuente editable.

---

## 2. Jira (G5)

Proyecto: `EVH`. Para cada fila se necesita: **estado real**, **responsable** y **vínculo a la HU**. Los IDs de HU y de casos ya están definidos en `docs/Clase15_GrupoEventHub_Testing.md`.

### 2.1 Historias de usuario

| HU | Título | Prioridad | Estado real | Responsable (completar) |
|---|---|---|---|---|
| HU-01 | Catálogo y detalle de eventos | MUST | Implementada | |
| HU-02 | Reservas HOLD y control de stock | MUST | Implementada | |
| HU-03 | Órdenes e idempotencia | MUST | Implementada | |
| HU-04 | Pago SOAP y resiliencia | MUST | Implementada | |
| HU-05 | Emisión de tickets y BOLA | MUST | Implementada | |
| HU-06 | Check-in y prevención de doble uso | MUST | Implementada y corregida | |
| HU-07 | Notificaciones AMQP y DLQ | SHOULD | Implementada | |
| HU-08 | Asistente de IA y guardrails | SHOULD | Implementada | |

### 2.2 Casos de prueba

| Caso | Título breve | Tipo | Resultado real | HU | Responsable (completar) |
|---|---|---|---|---|---|
| TC-EVT-01 | Catálogo con filtros | Positivo | PASADO | HU-01 | |
| TC-EVT-02 | Detalle inexistente → 404 Problem Details | Negativo | PASADO | HU-01 | |
| TC-EVT-03 | ETag desactualizado → 412 | Borde | PASADO | HU-01 | |
| TC-INV-01 | Creación de HOLD con stock | Positivo | PASADO | HU-02 | |
| TC-INV-02 | Expiración de HOLD y restitución | Borde | PASADO | HU-02 | |
| TC-INV-03 | Concurrencia por última entrada → 409 | Borde | PASADO | HU-02 | |
| TC-ORD-01 | Creación de orden y total | Positivo | PASADO | HU-03 | |
| TC-ORD-02 | Idempotency-Key repetida | Borde | PASADO | HU-03 | |
| TC-ORD-03 | Reembolso de orden PENDING → 409 | Negativo | PASADO | HU-03 | |
| TC-PAY-01 | Pago SOAP aprobado | Positivo | PASADO | HU-04 | |
| TC-PAY-02 | Business Fault sin XML crudo | Negativo | PASADO | HU-04 | |
| TC-PAY-03 | Timeout SOAP de 5 s | Borde | PASADO | HU-04 | |
| TC-PAY-04 | Circuit Breaker tras 3 fallas | Borde | PASADO | HU-04 | |
| TC-TKT-01 | Emisión de tickets `EVT-...` | Positivo | PASADO | HU-05 | |
| TC-TKT-02 | BOLA en consulta de ticket → 403 | Negativo | PASADO | HU-05 | |
| TC-CHK-01 | Check-in válido | Positivo | PASADO | HU-06 | |
| TC-CHK-02 | Segundo check-in → 409 | Negativo | PASADO | HU-06 | |
| TC-CHK-03 | ATTENDEE en endpoint de staff → 403 | Negativo | PASADO | HU-06 | |
| TC-NOT-01 | Consumo y persistencia de notificación | Positivo | PASADO | HU-07 | |
| TC-NOT-02 | Mensaje duplicado descartado | Borde | PASADO | HU-07 | |
| TC-NOT-03 | Mensaje inválido → DLQ | Negativo | PASADO | HU-07 | |
| TC-AI-01 | Recomendación dentro de dominio | Positivo | PASADO | HU-08 | |
| TC-AI-02 | Prompt injection bloqueada | Negativo | PASADO | HU-08 | |
| TC-AI-03 | Guardrail médico | Negativo | PASADO | HU-08 | |

### 2.3 Defectos

| Id | Resumen | Severidad | Prioridad | Estado real | Responsable (completar) |
|---|---|---|---|---|---|
| EVH-101 | Timeout ausente en pasarela SOAP | Crítica | Alta | CERRADO | |
| EVH-102 | Condición de carrera en inventario HOLD | Crítica | Alta | CERRADO | |
| EVH-103 | Doble check-in devolvía 201 en vez de 409 | Mayor | Alta | CERRADO | |
| EVH-104 | Reembolso permitido sobre orden PENDING | Mayor | Media | CERRADO | |
| EVH-105 | BOLA/IDOR en consulta de órdenes | Crítica | Alta | CERRADO | |
| EVH-106 | Prompt injection revelaba directivas | Mayor | Media | CERRADO | |

Pasos de reproducción y causa raíz: sección 5 de `docs/Clase15_GrupoEventHub_Testing.md`.

---

## 3. Pendientes que no se pueden cerrar desde el repositorio local

- ~~Crear y pushear el tag `v1.0-testing` sobre el commit final.~~ Hecho.
- ~~Ejecutar el workflow en GitHub sobre ese tag y guardar la URL del run.~~ En verde.
- Completar los campos **Responsable** de Jira.
- Subir los archivos a Teams.
- Ejecutar la demo en vivo (G7).
- Completar la declaración de IA con nombres y versiones reales de las herramientas usadas (G8).
- Contrastar Jira contra el informe antes de la defensa (G9).
