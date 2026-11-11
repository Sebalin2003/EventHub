# Eje D - Justificación de hallazgos de OWASP ZAP y auditoría de seguridad

Fecha de ejecución: 2026-11-11
Alcance: API EventHub (`AppModule` real) contra PostgreSQL y RabbitMQ reales.
Entorno local: `http://localhost:3001`, base descartable `eventhub_scan`, `JWT_SECRET=local-security-scan-secret`.
Imagen del escáner: `zaproxy/zap-stable`.

## 1. Resumen de resultados

| Escaneo | High | Medium | Low | Informational | Evidencia |
|---|---:|---:|---:|---:|---|
| Baseline sin autenticación | 0 | 0 | 0 | 2 | `docs/evidencias/zap/baseline.json` |
| API scan autenticado (admin) | 0 | 0 | 0 | 3 | `docs/evidencias/zap/api-auth.json` |

No quedan alertas High, Medium ni Low. Las únicas alertas restantes son informativas y se justifican una por una en la sección 3.

### Comandos reproducibles

Baseline:

```bash
docker run --rm -v "$PWD/docs/evidencias/zap:/zap/wrk:rw" zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:3001 \
  -J baseline.json -r baseline.html -w baseline.md -I
```

API scan autenticado (el token va entre comillas simples dentro de `-z` para que `shlex` no corte el espacio de `Bearer <token>`):

```bash
TOKEN=$(curl -sS -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@eventhub.com.ar","password":"password"}' | jq -r .accessToken)

ZAP_OPTIONS="-config replacer.full_list(0).description=BearerAuth \
-config replacer.full_list(0).enabled=true \
-config replacer.full_list(0).matchtype=REQ_HEADER \
-config replacer.full_list(0).matchstr=Authorization \
-config replacer.full_list(0).replacement='Bearer $TOKEN'"

docker run --rm -v "$PWD/docs/evidencias/zap:/zap/wrk:rw" zaproxy/zap-stable \
  zap-api-scan.py -t http://host.docker.internal:3001/openapi.json -f openapi \
  -O http://host.docker.internal:3001 -J api-auth.json -r api-auth.html -w api-auth.md \
  -I -z "$ZAP_OPTIONS"
```

## 2. Defectos reales detectados y corregidos

| Hallazgo ZAP | Causa | Corrección | Evidencia de regresión |
|---|---|---|---|
| `A Server Error response code was returned by the server` en `/orders/{id}`, `/orders/{id}/pay`, `/orders/{id}/cancel`, `/orders/{id}/refund` | `@Param('id')` sin validación: un id no UUID llegaba a PostgreSQL y producía un 500 | `ParseUUIDPipe` en los seis `@Param('id')` de `orders.controller.ts`; ahora responde 400 | `test/security-http.e2e-spec.ts`: id no UUID devuelve 400 sin mensaje de base |
| `Application Error Disclosure` / `Information Disclosure - Debug Error Messages` | `ProblemDetailsFilter` reflejaba `exception.message` en respuestas 500 | El filtro devuelve `An unexpected internal error occurred` y registra el error real solo del lado servidor | Test unitario del filtro y prueba HTTP de body inválido |
| `Unexpected Content-Type was returned` en `/` | La raíz respondía `text/html` (`Hello World!`) | `AppService.getHello()` devuelve JSON `{ service, status }` y la raíz declara `Cache-Control: no-store` | `test/app.e2e-spec.ts` y `security-http.e2e-spec.ts` |
| `CSP: Failure to Define Directive with No Fallback` (Medium) | Faltaban `frame-ancestors` y `form-action` | CSP completa con `default-src`, `base-uri`, `object-src`, `frame-ancestors`, `form-action` y directivas explícitas | Cabeceras verificadas por HTTP |
| `CSP: Wildcard Directive` (Medium) | `img-src ... https:` y `connect-src ... https:` permitían cualquier host HTTPS | `img-src 'self' data: https://images.unsplash.com` y `connect-src 'self'` | Cabeceras verificadas por HTTP |
| `CSP: style-src unsafe-inline` (Medium) | `style-src 'self' 'unsafe-inline'` | `style-src 'self'` | Cabeceras verificadas por HTTP |
| `Cross-Origin-Embedder-Policy Header Missing or Invalid` (Low) | No se emitía COEP | `Cross-Origin-Embedder-Policy: require-corp` | Cabeceras verificadas por HTTP |
| `Cross-Origin-Opener-Policy Header Missing or Invalid` (Low) | No se emitía COOP | `Cross-Origin-Opener-Policy: same-origin` | Cabeceras verificadas por HTTP |

Además se agregó `Cross-Origin-Resource-Policy: same-origin`, se deshabilitó `x-powered-by` y el CORS quedó en un módulo compartido (`src/common/config/cors.options.ts`) usado tanto por `main.ts` como por la suite HTTP.

## 3. Justificación de las alertas informativas restantes

### 3.1 Baseline - `Non-Storable Content` (10049, Informational)

- Instancias: `/` (200) y `/sitemap.xml` (404).
- Motivo: la raíz responde `Cache-Control: no-store` de forma intencional para que un health/status no quede cacheado por intermediarios. El 404 de `sitemap.xml` también evita cachear respuestas de error.
- Riesgo: ninguno. `no-store` es la opción conservadora; no expone datos ni habilita ataques.
- Decisión: se acepta. No se modifica porque el comportamiento es el deseado.

### 3.2 Baseline - `Storable and Cacheable Content` (10049, Informational)

- Instancia: respuestas 404 de rutas inexistentes que no llevan `Cache-Control`.
- Motivo: son respuestas de error sin datos de negocio ni datos personales.
- Riesgo: ninguno. Un intermediario podría cachear un 404, pero no hay información sensible ni efecto de seguridad.
- Decisión: se acepta como informativa.

### 3.3 API scan - `A Client Error response code was returned by the server` (100000, Informational)

- Instancias: 123 respuestas 400/401/403/404/409/429.
- Motivo: el escáner activo envía ids inválidos, tokens manipulados, payloads fuera de esquema y ráfagas de login. La API responde correctamente con errores 4xx y Problem Details RFC 9457.
- Riesgo: ninguno. Un 4xx es el comportamiento esperado frente a entradas inválidas o no autorizadas; no es un fallo del servidor.
- Decisión: se acepta. La ausencia de 5xx en este punto es justamente la evidencia de la corrección.

### 3.4 API scan - `Authentication Request Identified` (10111, Informational)

- Instancia: `POST /auth/login`.
- Motivo: ZAP reconoce el formulario/endpoint de autenticación y lo informa para que el analista configure credenciales.
- Riesgo: ninguno por sí mismo. El endpoint tiene validación de esquema, hash scrypt y rate limiting (429).
- Decisión: se acepta como informativa.

### 3.5 API scan - `Non-Storable Content` (10049, Informational)

- Motivo: mismo caso que 3.1, respuestas con `Cache-Control: no-store`.
- Riesgo: ninguno.
- Decisión: se acepta.

## 4. Dependencias

Evidencia: `docs/evidencias/security/pnpm-audit-prod.json` y `docs/evidencias/security/pnpm-audit.json`.

| Alcance | Críticas | Altas | Moderadas | Bajas | Resultado |
|---|---:|---:|---:|---:|---|
| Producción (`pnpm audit --prod`) | 0 | 0 | 0 | 0 | Cumple |
| Desarrollo completo (`pnpm audit`) | 0 | 0 | 1 | 0 | Aceptado con justificación |

Los CVE de runtime y de herramientas se corrigieron con `overrides` en `pnpm-workspace.yaml`, manteniendo la versión mayor para no romper la API de los consumidores: `multer`, `proxy-addr`, `body-parser`, `qs`, `follow-redirects`, `undici`, `brace-expansion`, `source-map-js`, `fast-uri`, `vite`, `vitest`, `@vitest/coverage-v8`, `@vitest/mocker` y `tmp`.

### 4.1 `minimatch` (moderado, solo desarrollo)

- Ruta: `@nestjs/cli > minimatch` y `@stryker-mutator/core > minimatch`.
- Afecta únicamente a herramientas de desarrollo que se ejecutan en la máquina del desarrollador o en CI, nunca en la imagen de producción.
- La corrección disponible está en la versión mayor 11, que rompe la compatibilidad declarada por `@nestjs/cli` y Stryker. Forzarla por `override` introduciría un riesgo mayor que el CVE (herramientas de build rotas).
- Mitigación: el patrón de globs no lo controla un usuario externo; el pipeline no procesa nombres de archivo provistos por terceros.
- Decisión: se acepta como deuda de desarrollo y se revisará cuando `@nestjs/cli`/Stryker adopten `minimatch >= 11`.

## 5. Cookies y CSRF

- La API no emite cookies: el JWT se entrega en el cuerpo de `POST /auth/login` y el cliente lo envía en `Authorization: Bearer <token>`.
- Por lo tanto, `Secure`, `HttpOnly` y `SameSite` no aplican a esta implementación. La verificación HTTP comprueba que no se setean cookies de sesión.
- Al no usar cookies de autenticación, el navegador no adjunta credenciales automáticamente y el riesgo de CSRF clásico no aplica. Los endpoints mutantes exigen el header `Authorization`, que no se envía cross-site sin CORS explícito.
- Si en el futuro se migra a cookies, deberán ser `Secure`, `HttpOnly` y `SameSite=Strict` o `Lax`, con protección CSRF adicional.

## 6. Auditoría de logs

Revisión de las 47 llamadas a `Logger` de `apps/api/src`:

| Ubicación | Hallazgo | Acción |
|---|---|---|
| `notifications.service.ts` | Registraba el email completo del destinatario (PII) | Se enmascara como `c***@dominio` |
| `notifications.controller.ts` | Registraba el payload completo de `event.created`, `order.created` y `order.paid`, que puede incluir email y datos del comprador | Se registra solo el identificador del evento/orden |
| `problem-details.filter.ts` | Reflejaba mensajes internos en la respuesta 500 | El mensaje interno queda solo en el log del servidor; al cliente se le devuelve un texto genérico |
| `payments.service.ts` | Registra `orderId`, `txId` y `authCode` simulados; no registra número de tarjeta ni CVV | Sin cambios; no hay PII ni datos de tarjeta |
| `orders.service.ts` | Registra ids de orden y de usuario; no registra tokens | Sin cambios |
| `ai.service.ts` | Registra un fragmento de 50 caracteres del prompt ante inyección | Sin cambios; el texto se trunca y no se persiste |
| `main.ts` | No imprime `JWT_SECRET` ni cadenas de conexión | Sin cambios |

No se registran tokens JWT, contraseñas, números de tarjeta, CVV ni stack traces en las respuestas HTTP. Las pruebas HTTP verifican que los errores no incluyen rutas de archivos, `TypeError` ni mensajes de PostgreSQL.

## 7. TLS y hash de contraseñas

- Hash: `ScryptHashStrategy` con salt aleatorio de 16 bytes y clave derivada de 64 bytes. Es un algoritmo adaptativo con costo configurable, verificable en `scrypt-hash.strategy.spec.ts`.
- TLS: la API soporta TLS directo si se definen `TLS_CERT_PATH` y `TLS_KEY_PATH` (ver `src/main.ts`). Se validó localmente con un certificado autofirmado `CN=localhost`: `https://localhost:3002/` respondió 200 con `Strict-Transport-Security` y el resto de cabeceras. Evidencia: `docs/evidencias/security/tls-smoke.txt`.
- En Docker Compose local el tráfico es HTTP porque el entorno de desarrollo y Playwright usan `localhost`. Para producción se documenta la terminación TLS en un proxy inverso (por ejemplo Nginx o el balanceador), que es el patrón habitual; la aplicación ya emite HSTS.
- No se versiona ninguna clave privada: el certificado de evidencia se generó en un directorio temporal fuera del repositorio.

## 8. Conclusión

Con las correcciones aplicadas, el escaneo baseline y el escaneo activo autenticado no reportan alertas High, Medium ni Low. Las únicas alertas son informativas y están justificadas. `pnpm audit --prod` queda en 0 vulnerabilidades. Los controles de BOLA, BFLA, JWT, mass assignment, inyecciones, XXE, fuerza bruta, CORS, cabeceras, cookies y logs están cubiertos por la suite HTTP `test/security-http.e2e-spec.ts` y por los reportes de ZAP versionados en `docs/evidencias/zap/`.
