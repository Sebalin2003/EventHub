# ADR-002: Implementación del Patrón Strategy para Algoritmos de Hashing de Contraseñas

## Estado
**Aceptado e Implementado**

## Fecha
2026-10-14 (Actualizado al 12/11/2026)

## Contexto y Planteamiento del Problema
El módulo de Identidad (`IdentityModule`) requiere almacenar las contraseñas de los usuarios de manera segura, aplicando algoritmos criptográficos adaptativos resistentes a ataques de fuerza bruta y diccionarios con GPU/ASIC (conforme a los lineamientos OWASP ASVS y Ley 25.326).

Acoplar directamente una biblioteca concreta (como `bcrypt` o `scrypt` de Node.js) dentro de `IdentityService` presentaba inconvenientes:
1. Dificultad para migrar de algoritmo en el futuro si los estándares criptográficos evolucionan (ej. hacia Argon2id o scrypt con diferentes parámetros de memoria).
2. Dificultad para mockear o sustituir la estrategia durante pruebas unitarias o de carga sin incurrir en alto costo computacional innecesario.
3. Violación del Principio de Responsabilidad Única (SRP) y del Principio de Inversión de Dependencias (DIP).

## Decisión
Se implementó el **Patrón de Diseño Strategy (GoF)** para desacoplar el algoritmo de hashing de contraseñas de la lógica de autenticación y registro.

1. **Interfaz Común (`HashStrategy`):**
   ```typescript
   export interface HashStrategy {
     hash(password: string): Promise<string>;
     compare(password: string, hash: string): Promise<boolean>;
   }
   ```

2. **Implementación Concreta (`ScryptHashStrategy`):**
   Utiliza la API nativa `crypto.scrypt` de Node.js con salt criptográfico de 16 bytes y clave derivada de 64 bytes, almacenando el resultado en formato `salt:derivedKey`.
   Provee protección de memoria y tiempo contra ataques de canal lateral y comparación en tiempo constante (`crypto.timingSafeEqual`).

3. **Inyección de Dependencias en NestJS:**
   Se define el token de inyección `HASH_STRATEGY`:
   ```typescript
   export const HASH_STRATEGY = 'HASH_STRATEGY';
   // En IdentityModule:
   {
     provide: HASH_STRATEGY,
     useClass: ScryptHashStrategy,
   }
   ```
   `IdentityService` recibe `HashStrategy` a través del decorador `@Inject(HASH_STRATEGY)`.

## Consecuencias y Beneficios
- **Desacoplamiento:** `IdentityService` no conoce los detalles internos ni los parámetros matemáticos de `scrypt`.
- **Flexibilidad:** Permite cambiar la implementación a `BcryptHashStrategy` o `Argon2HashStrategy` registrando una nueva clase en el contenedor IoC sin modificar una sola línea de la lógica de usuarios.
- **Seguridad Robusta (Eje D):** Garantiza contraseñas hasheadas con salt aleatorio individual, cumpliendo con los estándares exigidos para la evaluación de seguridad.

## Evidencia en Código y Pruebas
- Interfaz e implementación: `apps/api/src/modules/identity/strategies/hash.strategy.ts`
- Módulo de configuración: `apps/api/src/modules/identity/identity.module.ts`
- Consumo en servicio: `apps/api/src/modules/identity/identity.service.ts`
- Pruebas unitarias: `apps/api/src/modules/identity/strategies/hash.strategy.spec.ts`

