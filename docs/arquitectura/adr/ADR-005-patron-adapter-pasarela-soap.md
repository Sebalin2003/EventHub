# ADR-005: Implementación del Patrón Adapter para la Integración con Pasarela de Pagos Legada (SOAP/WSDL)

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-22 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
EventHub requiere procesar los pagos de órdenes de compra comunicándose con una pasarela bancaria legada que expone una interfaz basada en servicios web **SOAP con contrato WSDL**.

Esta integración presenta desafíos críticos de diseño, seguridad y resiliencia:
1. **Diferencia de Modelos:** El flujo moderno de checkout en NestJS opera con objetos JavaScript/JSON y DTOs tipados, mientras que SOAP opera con sobres XML (`SOAP-ENV:Envelope`), esquemas XSD y llamadas RPC tipadas en WSDL.
2. **Vulnerabilidad XXE (XML External Entity):** Los parsers XML no configurados adecuadamente son vulnerables a ataques de inclusión de entidades externas e inyección de archivos locales (OWASP ASVS / Eje D).
3. **Mapeo de Errores y SOAP Faults:** Los errores de SOAP se manifiestan como `SOAP Fault` (v1.1 o v1.2) conteniendo XML crudo con etiquetas `<faultcode>`, `<faultstring>`, etc. Si estos XMLs se propagan al cliente web o móvil, exponen información técnica interna y violan el formato RFC 9457 Problem Details.
4. **Resiliencia ante Desconexión:** La pasarela SOAP legada puede estar no disponible o experimentar latencias excesivas.

## Decisión
Se implementó el **Patrón Estructural Adapter (GoF)** junto con un cliente SOAP dedicado (`SoapClientService` y `PaymentsService`) en `apps/api/src/modules/payments/payments.service.ts`.

1. **Estructura del Adapter:**
   - **Target / Interfaz Esperada por el Dominio:** `PaymentsService` provee el método `processPayment(payment: PaymentRequest): Promise<PaymentResult>`, retornando un modelo neutral con `success`, `transactionId`, `authCode`, `code` y `reason`.
   - **Adaptee (Componente Legado):** Biblioteca `soap` de Node.js conectada a `PAYMENTS_WSDL_URL`.
   - **Adapter:** `SoapClientService.requestPayment()` traduce la petición JSON al mensaje SOAP correspondiente y adapta la respuesta o el Fault devuelto al modelo neutral del dominio.

2. **Mitigación de Inyecciones XXE:**
   Se incorporó validación estricta y protección en la construcción y parsing del mensaje XML:
   - DTD deshabilitado (`disallowDoctypeDecl`).
   - Detección de patrones `<!DOCTYPE` y `<!ENTITY` en los datos de entrada (`cardHolder`). Ante un intento de ataque, se aborta inmediatamente con código `XXE_INJECTION_REJECTED` y detalle *"Entidades externas XML (XXE) deshabilitadas por seguridad"*, sin procesar el XML.

3. **Clasificación y Saneamiento de SOAP Faults (`classifyFault` y `sanitizeSoapMessage`):**
   - Se distinguen **Business Faults** (fondos insuficientes, tarjeta expirada, datos inválidos: código `SOAP_BUSINESS_FAULT`) de **Technical Faults** (falla del servidor bancario, timeout: código `SOAP_FAULT_TECHNICAL`).
   - La función `sanitizeSoapMessage` elimina cualquier etiqueta XML `<...>`, evitando filtración de fragmentos XML al cliente.

4. **Modo Mock Determinista:**
   Para entornos de prueba y ejecución sin acceso a la pasarela real externa, el servicio incluye validación de algoritmo de Luhn determinista (aprueba tarjetas de prueba válidas y rechaza terminaciones erróneas).

## Consecuencias y Beneficios
- **Aislamiento Tecnológico:** Ningún módulo fuera de `payments` conoce la existencia de XML o WSDL.
- **Seguridad Garantizada (Eje D):** Rechazo activo de ataques XXE antes de que lleguen al parser.
- **Respuestas Uniformes:** Los Faults SOAP se traducen limpiamente a códigos de error que luego `ProblemDetailsFilter` expone como HTTP 400, 402 o 503 según corresponda.

## Evidencia en Código y Pruebas
- Implementación: `apps/api/src/modules/payments/payments.service.ts`
- Pruebas unitarias: `apps/api/src/modules/payments/payments.service.spec.ts` y `payments.service.extra.spec.ts`
- Pruebas de contrato SOAP y Faults: `apps/api/test/soap-contract.e2e-spec.ts` (9 pruebas contra servidor SOAP real con WSDL, verificando respuesta válida, Business Fault, Technical Fault y timeout)

