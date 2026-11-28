# ADR-008: Implementación del Patrón Gateway y Guardrails para el Asistente de Inteligencia Artificial

## Estado
**Aceptado e Implementado**

## Fecha
2026-11-02 (Revisado al 28/11/2026)

## Contexto y Planteamiento del Problema
EventHub incorpora `AiAdvisorService` como asistente de eventos. La implementación actual es un simulador determinístico: no invoca un modelo de lenguaje ni un proveedor externo. La decisión conserva un punto de entrada HTTP y guardrails verificables, sin presentar sus pruebas como una evaluación de seguridad de un LLM.

El requerimiento exige:
> "La funcionalidad de IA funcionando a través de su gateway. Testing de la funcionalidad de IA: casos propios, inyección directa e indirecta, guardrails temáticos, fuga de datos y fallback."

## Decisión
Se mantiene `AiController` como punto de entrada HTTP y `AiAdvisorService` como lógica de dominio en `apps/api/src/modules/ai/`. La implementación:

1. **Punto de entrada (`AiController`):**
   Expone `POST /ai/advisor` con DTO `AiAdvisorRequest` (`prompt`, `categoryPreference`, `userId`, `simulateTimeout`).

2. **Guardrails determinísticos:**
   - Revisa el prompt y `categoryPreference` con patrones regex de inyección conocidos; coincidencias devuelven `SECURITY_BLOCKED`.
   - Detecta un conjunto acotado de consultas médicas y legales mediante patrones; esas consultas devuelven `GUARDRAIL_TRIGGERED`.
   - Enmascara emails y números que coinciden con el patrón de tarjeta de 16 dígitos. No cubre todas las formas de PII.

3. **Fallback simulado:**
   Si se envía `simulateTimeout: true`, devuelve una respuesta determinística `FALLBACK`. No existe una llamada a proveedor cuyo timeout o indisponibilidad se esté manejando.

## Consecuencias y Beneficios
- **Alcance verificable:** los tests validan el contrato del simulador, sus patrones y las respuestas, no el comportamiento de un LLM externo.
- **Limitación:** los regex pueden no reconocer variantes o reformulaciones. No se afirma protección general contra prompt injection ni resiliencia ante un proveedor externo.

## Evidencia en Código y Pruebas
- Controlador y Gateway: `apps/api/src/modules/ai/ai.controller.ts` y `ai.service.ts`
- Pruebas unitarias: `apps/api/src/modules/ai/ai.service.spec.ts` (14 pruebas sobre recomendaciones controladas, patrones de inyección, guardrails temáticos, PII y fallback simulado)
- Pruebas E2E HTTP: `apps/api/test/ai-advisor.e2e-spec.ts` (10 pruebas contra el servidor NestJS y respuestas Problem Details)
- Reportes detallados de evidencia: `docs/evidencias/ai/ai-unit-verbose.txt` y `docs/evidencias/ai/ai-e2e-verbose.txt`
- Declaración formal de IA: `../../ia/DECLARACION_IA.md`

