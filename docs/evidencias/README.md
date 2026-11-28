# Evidencias del Eje C

Esta carpeta contiene la evidencia reproducible de integración y resiliencia.

| Archivo | Qué demuestra | Cómo se regenera |
| :--- | :--- | :--- |
| `k6-summary.json` | Prueba de carga de 50 VUs durante 5 minutos sobre 3 endpoints críticos, con p95 y tasa de error medidas. | `docker run --rm --network host -v "$PWD:/scripts" -w /scripts -e API_URL=http://localhost:3000 grafana/k6:0.54.0 run load-tests/k6-load-test.js` |
| `broker-recovery.json` | Escenario ensayado de caída y recovery: el evento queda `PENDING` con RabbitMQ detenido y se observa un intento de publicación tras reiniciarlo. `SENT` no acredita ACK del broker; no se afirma garantía absoluta de entrega. | Con la API corriendo: `node apps/api/scripts/broker-resilience-evidence.mjs` |

Las pruebas automatizadas que respaldan el resto de los criterios del Eje C se ejecutan con:

```bash
pnpm --filter api test          # unitarias: SOAP, timeout, circuit breaker, idempotencia, outbox y topología DLQ
pnpm --filter api test:e2e      # integración real: PostgreSQL, RabbitMQ, DLQ real, duplicados y compensación
```

Los reportes crudos de la suite quedan en `apps/api/coverage/` y `apps/api/reports/`.
