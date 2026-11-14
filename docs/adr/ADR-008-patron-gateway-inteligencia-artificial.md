# ADR-008: Implementación del Patrón Gateway y Guardrails para el Asistente de Inteligencia Artificial

## Estado
**Aceptado e Implementado**

## Fecha
2026-11-02 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
EventHub incorpora una funcionalidad de Inteligencia Artificial como asistente virtual (`AiAdvisorService`) orientada a recomendar eventos del catálogo y responder dudas sobre entradas, horarios y locaciones (Eje E / Requerimiento de IA).

Integrar modelos de lenguaje o componentes de IA directamente en la aplicación expone riesgos críticos de seguridad y estabilidad:
1. **Inyección de Prompts Directa e Indirecta (OWASP LLM01):** Usuarios maliciosos pueden enviar directivas para anular las instrucciones del sistema (*jailbreak*, DAN mode, *"olvida todas las instrucciones anteriores"*), o inyectar payloads en metadatos secundarios como preferencias de categoría.
2. **Consultas Fuera de Dominio (Out of Domain):** Solicitudes médicas, asesoría legal o diagnósticos clínicos que deben ser rechazados de inmediato para proteger la responsabilidad de la plataforma.
3. **Fuga de Datos Sensibles / PII (OWASP LLM02):** Exposición inadvertida de tarjetas de crédito o correos electrónicos en las respuestas o logs.
4. **Indisponibilidad del Proveedor de IA:** Elevada latencia o caídas de red del modelo externo que pueden romper la experiencia de usuario si no se dispone de un mecanismo de fallback.

El requerimiento exige:
> "La funcionalidad de IA funcionando a través de su gateway. Testing de la funcionalidad de IA: casos propios, inyección directa e indirecta, guardrails temáticos, fuga de datos y fallback."

## Decisión
Se implementó el **Patrón Estructural Gateway / Facade** mediante `AiController` y `AiAdvisorService` en `apps/api/src/modules/ai/`:

1. **Punto Único de Entrada (`AiController`):**
   Expone el endpoint unificado `POST /ai/advisor` con DTO validado `AiAdvisorRequest` (`prompt`, `categoryPreference`, `userId`, `simulateTimeout`).

2. **Capa Defensiva de Guardrails y Detección de Inyección:**
   - **Superficie de Inyección Directa e Indirecta:** El servicio concatena el prompt del usuario y la preferencia de categoría (`modelInputSurface = "${rawPrompt}\n${rawPreference}"`) para evaluar patrones de bypass (`jailbreak`, `ignore instructions`, `revela el prompt`). Ante una detección, retorna `SECURITY_BLOCKED` con `guardrailApplied: true` sin filtrar las directivas internas del sistema.
   - **Guardrails Temáticos:** Expresiones regulares semánticas detectan consultas de salud, medicamentos o asesoría legal y retornan de forma inmediata una respuesta segura de tipo `GUARDRAIL_TRIGGERED`.
   - **Sanitización de PII:** Detección y enmascaramiento de números de tarjetas de crédito (regex de 16 dígitos) y direcciones de email, marcando `sanitizedPii: true`.

3. **Fallback Determinístico ante Latencia / Timeout:**
   Si la comunicación con el proveedor excede el tiempo tolerable o se activa `simulateTimeout`, el Gateway retorna recomendaciones determinísticas basadas en los eventos destacados del catálogo, evitando errores 500 y garantizando alta disponibilidad.

## Consecuencias y Beneficios
- **Aislamiento Seguro:** La capa web y los clientes no se comunican directamente con LLMs; toda interacción pasa por el Gateway auditado y sanitizado.
- **Defensa en Profundidad (OWASP LLM Top 10):** Prevención activa de prompt injection, jailbreaks y fuga de información sensible.
- **Resiliencia Total:** La experiencia del asistente nunca queda bloqueada aunque el proveedor externo falle.

## Evidencia en Código y Pruebas
- Controlador y Gateway: `apps/api/src/modules/ai/ai.controller.ts` y `ai.service.ts`
- Pruebas unitarias: `apps/api/src/modules/ai/ai.service.spec.ts` (14 pruebas cubriendo recomendaciones, inyección directa/indirecta, guardrails médicos/legales, PII y timeout)
- Pruebas E2E HTTP: `apps/api/test/ai-advisor.e2e-spec.ts` (10 pruebas contra el servidor NestJS y respuestas Problem Details)
- Reportes detallados de evidencia: `docs/evidencias/ai/ai-unit-verbose.txt` y `docs/evidencias/ai/ai-e2e-verbose.txt`
- Declaración formal de IA: `docs/DECLARACION_IA.md`

