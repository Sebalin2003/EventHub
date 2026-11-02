# Criterios de Testing y Aseguramiento de Calidad
## TP Obligatorio
**Prueba del sistema (Clase 15, martes 10/11/2026)**
*Desarrollo de Aplicaciones II (3.4.218) 2.º Cuatrimestre 2026 Dpto. de Tecnología Informática UADE*

Lectura obligatoria para todo el equipo, no solo para el QA. Este documento define qué tiene que presentar cada equipo en la prueba del TP y qué va a verificar la cátedra en vivo. Los criterios marcados como **[ELIMINATORIO]** no suman puntos: si no se cumplen, la instancia queda desaprobada sin importar el resto. Los umbrales de este documento son mínimos: para la 4.ª Entrega Parcial Obligatoria $(17/11)$ la cátedra podrá elevarlos, comunicándolo por Teams con al menos 7 días de anticipación.

---

### 1. Alcance y rol del QA
* Cada equipo designa al menos un QA responsable (cargado en Jira con ese rol). El QA presenta y conduce la prueba, pero cualquier integrante puede ser interrogado sobre cualquier test, defecto o herramienta. No saber explicar algo que figura en la entrega cuenta como no hecho.
* Se prueba el sistema en el estado del tag de release entregado (ver G2). No se aceptan cambios de código durante la clase.
* Alcance funcional: todas las HU comprometidas en la Entrega del diseño $(03/11)$. Reducir alcance después de esa fecha requiere acuerdo escrito previo con la cátedra.
* Se evalúan cuatro ejes: (A) HU y criterios de aceptación, (B) código y pruebas automatizadas, (C) integración y resiliencia, (D) seguridad; más (E) uso de IA en el proceso de testing y, si el sistema la incorpora, testing de la funcionalidad de IA.

---

### 2. Condiciones de admisibilidad [ELIMINATORIO]
Se verifican al inicio de la presentación de cada equipo. Si falla una sola, la instancia se califica como desaprobada y el equipo pasa al recuperatorio.

| Cód. | Condición | Cómo se verifica |
| :--- | :--- | :--- |
| **G1** | Build reproducible desde cero: clonando el repo en una máquina limpia, el sistema completo (app, base, broker, mocks SOAP/REST) levanta con un único comando documentado (p. ej. docker compose up) en $\le15$ min. | El docente clona y ejecuta siguiendo solo el README. |
| **G2** / **G3** | Tag v1.0-testing creado en main antes de las 13:30 del $10/11$. Commits posteriores al tag no se consideran. <br> Pipeline de CI (GitHub Actions o equivalente) que compila, corre todas las pruebas automatizadas y el análisis estático, en verde sobre el tag. | Fecha del tag en Git. Link al run del pipeline. |
| **G4** | Plan de pruebas, matriz de trazabilidad, informe de ejecución y registro de defectos entregados en Teams antes de las 13:30. | Archivos en Teams. |
| **G5** | Jira actualizado: cada caso de prueba y cada defecto con estado real, responsable y vínculo a la HU. | Acceso de lectura del docente. |
| **G6** | Sin secretos en el repositorio (contraseñas, tokens, claves, certificados) en ningún commit del historial. | Escaneo con gitleaks / trufflehog en vivo. |
| **G7** | Demo en vivo del flujo principal de punta a punta (no video, no capturas). | Ejecución en clase. |
| **G8** | Declaración de uso de IA completa (sección 8). | Documento entregado. |
| **G9** | Honestidad del informe: ningún defecto conocido omitido ni resultado de prueba alterado. Un defecto bloqueante o crítico conocido y no reportado invalida la entrega. | Contraste entre informe, Jira y ejecución en vivo. |

---

### 3. Entregables del QA
Estructura basada en ISO/IEC/IEEE 29119-3. Un único PDF `Clase15_Grupo<N>_<Dominio>_Testing.pdf` más los enlaces (repo, CI, Jira, SonarCloud, colección Postman, reportes).

| # Entregable | Contenido mínimo exigido |
| :--- | :--- |
| **1. Plan y estrategia de pruebas** | Alcance y fuera de alcance, niveles (unitario, integración, contrato, E2E, no funcional), entornos, datos de prueba, criterios de entrada y de salida, riesgos priorizados (matriz probabilidad x impacto) y cómo cada riesgo está cubierto por pruebas. |
| **2. Matriz de trazabilidad** | caso(s) de prueba / test automatizado (ruta/clase) → HU / criterio de aceptación / defecto (si hay). Sin huecos: toda HU y todo criterio con al menos un caso, resultado y evidencia. |
| **3. Especificación de casos** | Id, precondición, datos, pasos, resultado esperado, prioridad, tipo (positivo / negativo / borde), automatizado sí/no. Mínimo 40% de casos negativos o de borde. |
| **4. Informe de ejecución** | Totales por nivel (ejecutados / pasados / fallados / bloqueados), cobertura, mutation score, tiempos, resultados de performance, captura del Quality Gate. |
| **5. Registro de defectos** | Id Jira, severidad y prioridad (sección 9), pasos para reproducir, esperado vs. obtenido, evidencia, estado, causa raíz para los cerrados. |
| **6. Informe de seguridad** | Matriz de criterios SEC (Clase 11) con estado CUMPLE / NO CUMPLE / NO VERIFICABLE y evidencia; resultados de ZAP, SCA y escaneo de secretos; hallazgos y su tratamiento. |
| **7. Declaración y plan de IA** | Herramientas usadas, por usar, prompts representativos, qué se validó a mano y qué se descartó (sección 8). |
| **8. Lecciones aprendidas** | 3 defectos que llegaron tarde: por qué no se detectaron antes y qué prueba los habría atrapado. |

---

### 4. Eje A - Historias de usuario y criterios de aceptación
* Formato Dado / Cuando / Entonces (Gherkin), verificable y sin ambigüedad: nada de «rápido», «amigable», «correctamente». Si no se puede medir, no es criterio.
* Cada HU: mínimo 3 criterios - camino feliz, alternativo y de error. Las HU que involucren integración suman un criterio ante falla del sistema externo.
* Prioridad MOSCOW por HU. Ningún criterio de una HU «Must» puede fallar al cierre de la prueba.
* Ejecución: 100% de las HU del alcance ejecutadas; $\ge95\%$ de criterios pasados; los fallados, con defecto registrado y plan de corrección.
* Al menos 5 escenarios críticos automatizados de punta a punta (Cucumber / Karate / Playwright / Cypress / Selenium) corriendo en el pipeline.
* Prueba del manual de usuario: el docente elegirá una tarea al azar y la ejecutará siguiendo solo el manual. Si no puede completarla, se registra un defecto de documentación.
* Prueba exploratoria docente: hasta 10 minutos por equipo usando el sistema sin guion (datos inválidos, doble clic, volver atrás, sesión expirada, recarga en medio de una operación, concurrencia entre dos usuarios).
* Web: responsive verificado a 360, 768 y 1280 px; accesibilidad con Lighthouse/axe $\ge90$ y sin violaciones críticas (WCAG 2.2 AA). Mobile: tamaños y orientación.

---

### 5. Eje B - Código y pruebas automatizadas

| Criterio | Umbral mínimo | Herramienta de referencia |
| :--- | :--- | :--- |
| **Cobertura de líneas, capa de negocio/dominio** | $\ge80\%$ | JaCoCo (o equivalente del stack) |
| **Cobertura de ramas, capa de negocio/dominio** | $\ge70\%$ | JaCoCo |
| **Mutation score sobre el paquete de dominio** | $\ge60\%$ | PIT (pitest) / Stryker |
| **Quality Gate de análisis estático** | Aprobado; 0 bugs Blocker/Critical; 0 vulnerabilidades; duplicación $\le3\%$ ratings A en confiabilidad y seguridad; 100% de security hotspots revisados | SonarQube / SonarCloud |
| **Pruebas de integración con dependencias reales** | Base de datos y broker reales en contenedor (no mocks en memoria) para repositorios y consumidores de mensajes | Testcontainers / Arquillian |
| **Pruebas de API** | Colección versionada en el repo, corrida en CI; todos los endpoints con al menos un caso de éxito y uno de error | Postman + Newman / REST Assured / Karate |
| **Pruebas de contrato** | Respuestas validadas contra el OpenAPI y el WSDL publicados | Schemathesis / Pact / SoapUI |
| **Estado de la entidad central (patrón State)** | Toda transición inválida probada y devuelve 409 | JUnit 5 parametrizado |
| **Tiempo total del pipeline** | $\le15$ min | CI |
| **Tests inestables (flaky)** | 0: se corre la suite 3 veces seguidas y debe dar idéntico resultado | CI |

**Tests que se anulan** (no cuentan para cobertura ni para el total): sin aserciones o con aserciones triviales (`assertTrue(true)`, `assertNotNull` como única verificación), que mockean la propia clase bajo prueba, deshabilitados (`@Disabled`) sin justificación en el informe, o que pasan aunque se elimine el código que dicen probar.

**Verificación en vivo**: el docente puede introducir un cambio en el código (invertir una condición, cambiar un límite, borrar una validación) y pedir que se corra la suite. Se espera que al menos un test falle. Si la suite queda en verde, ese módulo se considera sin pruebas efectivas.

---

### 6. Eje C - Integración y resiliencia

| Escenario | Resultado esperado |
| :--- | :--- |
| **SOAP: respuesta válida, Fault de negocio, Fault técnico** | Se mapea a la respuesta correcta hacia el cliente; el Fault no se filtra crudo al usuario. |
| **SOAP o REST externo no responde en 5 s** | Timeout efectivo, reintento acotado o circuit breaker, fallback definido y comunicado al usuario; sin hilos colgados. |
| **Se apaga el broker durante la demo y se vuelve a levantar** | No se pierden mensajes; el sistema se recupera solo; la operación del usuario no queda en estado inconsistente. |
| **Mensaje duplicado** | Se procesa una sola vez (consumidor idempotente). |
| **Mensaje inválido o que falla N veces** | Termina en cola de mensajes muertos (DLQ), con registro y posibilidad de reproceso. |
| **Falla a mitad de una operación transaccional** | Rollback completo; outbox o compensación documentada si involucra mensajería. |
| **REST: POST repetido con la misma Idempotency-Key** | Un único recurso creado; misma respuesta. |
| **REST: actualización concurrente con ETag desactualizado** | 412 Precondition Failed. |
| **REST: errores** | Formato Problem Details (RFC 9457); códigos de estado correctos (400/401/403/404/409/422/429/5xx). |
| **Carga: 50 usuarios concurrentes, 5 min, sobre los 3 endpoints críticos** | $p95<500$ ms y tasa de error < 1% (k6/JMeter / Gatling), con reporte adjunto. |

---

### 7. Eje D - Seguridad
Base: criterios SEC definidos en la Clase 11 (OWASP ASVS 5.0, OWASP API Security Top 10, MASVS si aplica, Ley 25.326). La cátedra va a ejecutar en vivo, como mínimo:

| Prueba | Resultado esperado |
| :--- | :--- |
| **Usuario A pide un recurso de usuario B cambiando el id en la URL o el body (BOLA/IDOR)** | 403 o 404; nunca el dato. |
| **Rol paciente/cliente invoca endpoint de rol administrador (BFLA)** | 403. |
| **JWT vencido, con firma alterada, con alg=none o de otro emisor** | 401 en todos los casos. |
| **Mass assignment: enviar campos no permitidos (rol, estado, precio)** | Ignorados o 400; nunca persistidos. |
| **Inyección SQL / NoSQL/XSS en todos los campos de texto** | Sin ejecución; entrada rechazada o escapada. |
| **XXE y entidades externas en el canal SOAP** | Rechazado; parser con DTD deshabilitado. |
| **Fuerza bruta sobre login** | Rate limiting / bloqueo; 429. |
| **Escaneo OWASP ZAP (baseline + activo autenticado)** | 0 alertas High; Medium justificadas una por una. |
| **Dependencias (OWASP Dependency-Check / Trivy / Snyk)** | 0 CVE críticas o altas sin mitigación documentada. |
| **Headers de seguridad, CORS y cookies** | CSP, HSTS, X-Content-Type-Options presentes; CORS sin comodín con credenciales; cookies Secure/HttpOnly/SameSite. |
| **Logs y mensajes de error** | Sin stack traces al cliente; sin datos personales ni de salud ni tokens en logs. |
| **Datos sensibles** | Cifrado en tránsito (TLS) y contraseñas con hash adaptativo (bcrypt/Argon2); datos sensibles minimizados. |

---

### 8. Eje E - Inteligencia artificial

#### 8.1 IA usada para testear (declaración obligatoria)
Para cada herramienta: nombre y versión, para qué se usó, un prompt representativo, qué salida se aceptó, qué se corrigió o descartó y cómo se verificó. Ejemplos admitidos: Claude (incluido Claude Fable 5.1 como revisor defensivo, según Clase 11), GitHub Copilot, generación de tests unitarios asistida, Postbot de Postman, análisis de código con IA de SonarQube o Snyk, generación de datos de prueba sintéticos.
* Todo test generado con IA debe estar revisado y firmado (autor en Git) por un integrante, que debe poder explicarlo en la defensa.
* La IA no reemplaza evidencia: un «CUMPLE» dictaminado por IA sin test ejecutado ni evidencia se toma como NO VERIFICABLE.
* Se valorará mostrar al menos un caso donde la IA propuso un test o un diagnóstico incorrecto y cómo lo detectaron.

#### 8.2 IA por usar (plan)
Hoja de ruta breve: qué herramientas de IA incorporarían para la 4.ª entrega y la presentación final (p. ej. pruebas visuales automatizadas, generación de casos a partir de HU, triage de defectos), con qué objetivo medible y qué riesgo controlan.

#### 8.3 Si el sistema integra funcionalidad de IA (Clase 14)
* Casos de prueba propios con salidas esperadas y criterio de evaluación (no basta «responde bien»).
* Inyección de prompt directa e indirecta (en datos que el sistema le pasa al modelo): no ejecuta instrucciones ajenas ni revela el prompt del sistema.
* Pedidos fuera de dominio o peligrosos para el dominio (p. ej. diagnóstico médico en MediConecta): respuesta acotada y segura.
* Fuga de datos: el modelo no expone datos de otro usuario. Proveedor de IA caído o lento: fallback sin romper el flujo.
* Referencia: OWASP Top 10 para aplicaciones con LLM.

---

### 9. Severidad de defectos y criterios de salida

| Severidad | Definición | Máximo admitido abierto |
| :--- | :--- | :--- |
| **Bloqueante** | Impide usar el flujo principal o hace caer el sistema. | 0 |
| **Crítica** | Pérdida o corrupción de datos, falla de seguridad explotable, HU Must incumplida. | 0 |
| **Mayor** | Funcionalidad afectada con alternativa disponible. | 3, con workaround documentado |
| **Menor / Cosmética** | Impacto bajo, visual o de texto. | Sin límite, registrados |

Un defecto bloqueante o crítico encontrado por la cátedra durante la prueba y no detectado por el equipo descuenta más que uno reportado por el propio QA.

---

### 10. Desarrollo de la prueba y evaluación

| Momento | Duración aprox. |
| :--- | :--- |
| Verificación de admisibilidad (G1-G9) | 5 min |
| Presentación del QA: estrategia, métricas, riesgos, defectos | 10 min |
| Ejecución en vivo pedida por la cátedra (casos al azar, seguridad, resiliencia, mutación manual) | 15 min |
| Preguntas individuales a cualquier integrante | 5-10 min |

| Eje | Peso |
| :--- | :--- |
| **A-** HU, criterios de aceptación y documentación | 25% |
| **B-** Código y pruebas automatizadas | 25% |
| **C-** Integración y resiliencia | 20% |
| **D-** Seguridad | 20% |
| **E-** IA (uso, plan y, si aplica, testing de la funcionalidad) | 10% |

* Para aprobar se requiere cumplir todas las condiciones G1-G9 y obtener al menos 4 en cada eje; un eje por debajo de 4 desaprueba la instancia aunque el promedio alcance.
* La nota puede ser individual: un integrante que no puede explicar su parte o tests de su autoría puede desaprobar aunque el equipo apruebe.
* Los resultados alimentan la 4.ª Entrega Parcial Obligatoria $(17/11)$. Los equipos desaprobados acceden al recuperatorio $(24/11)$ según el régimen vigente.

**Consultas**: por el Teams de la cátedra hasta el lunes $09/11$. Dudas sobre alcance o umbrales se responden públicamente para todos los equipos.