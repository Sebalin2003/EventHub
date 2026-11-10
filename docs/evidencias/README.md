# Evidencias del Eje C

Esta carpeta contiene la evidencia reproducible de integración y resiliencia.

| Archivo | Qué demuestra | Cómo se regenera |
| :--- | :--- | :--- |
| `k6-summary.json` | Prueba de carga de 50 VUs durante 5 minutos sobre 3 endpoints críticos, con p95 y tasa de error medidas. | `docker run --rm --network host -v "$PWD:/scripts" -w /scripts -e API_URL=http://localhost:3000 grafana/k6:0.54.0 run load-tests/k6-load-test.js` |
| `broker-recovery.json` | Caída y recuperación real de RabbitMQ sin pérdida de mensajes: orden creada con el broker caído, evento persistido `PENDING` en el outbox y publicado como `SENT` al reiniciar el broker. | Con la API corriendo: `node apps/api/scripts/broker-resilience-evidence.mjs` |

Las pruebas automatizadas que respaldan el resto de los criterios del Eje C se ejecutan con:

```bash
pnpm --filter api test          # unitarias: SOAP, timeout, circuit breaker, idempotencia, outbox y topología DLQ
pnpm --filter api test:e2e      # integración real: PostgreSQL, RabbitMQ, DLQ real, duplicados y compensación
```

Los reportes crudos de la suite quedan en `apps/api/coverage/` y `apps/api/reports/`.
