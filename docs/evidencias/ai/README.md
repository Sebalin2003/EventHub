# Evidencia Eje E — IA

Fecha de ejecución: 12/11/2026.

## Comandos ejecutados

```bash
# Unitarias del asistente (14 casos)
pnpm --filter api exec vitest run src/modules/ai/ai.service.spec.ts

# HTTP del módulo de IA con ValidationPipe y ProblemDetailsFilter (10 casos)
pnpm --filter api exec vitest run --config ./vitest.config.e2e.ts test/ai-advisor.e2e-spec.ts

# Suites completas de cierre
pnpm --filter api test
pnpm --filter api test:e2e
```

## Resultados

| Suite | Archivos | Pruebas | Resultado | Duración |
| --- | ---: | ---: | --- | ---: |
| Unitarias de IA | 1 | 14 | 14/14 verdes | 2,00 s |
| HTTP de IA | 1 | 10 | 10/10 verdes | 3,10 s |
| Unitarias completas de API | 24 | 259 | 259/259 verdes | 13,93 s |
| E2E completas de API | 7 | 76 | 76/76 verdes | 15,25 s |

## Artefactos

- `ai-unit-verbose.txt`: salida verbose de las 14 pruebas unitarias.
- `ai-e2e-verbose.txt`: salida verbose de las 10 pruebas HTTP.
- `../DECLARACION_IA.md`: declaración formal, matriz de casos, limitaciones y plan.

## Cobertura de los criterios de la cátedra

- Salidas esperadas y criterio de evaluación: matriz en `docs/DECLARACION_IA.md`, sección 2.2.
- Inyección directa e indirecta: casos unitarios y HTTP con `SECURITY_BLOCKED`.
- Pedidos fuera de dominio: médicos y legales con `GUARDRAIL_TRIGGERED`.
- Fuga de datos: emails y tarjetas enmascarados con `sanitizedPii=true`.
- Proveedor caído o lento: `simulateTimeout` devuelve `FALLBACK`.
- Validación de entrada: 400 con `application/problem+json` y sin stack.
