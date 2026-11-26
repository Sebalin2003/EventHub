# Guía de Estudio: Patrones de Diseño y Estructura de Entregas

## 1. Patrones de Diseño (Justificación y Aplicación)

El trabajo práctico exige la aplicación y justificación de un **mínimo de 3 patrones de diseño distintos**. No basta con mencionarlos; durante la defensa oral, cada integrante debe poder explicar:
1. **Qué problema resuelve** ese patrón específico en el dominio del sistema.
2. **Por qué se eligió** frente a otras alternativas posibles.

A continuación, se detallan los candidatos más frecuentes y cómo justificarlos:

### DAO (Data Access Object)
* **Propósito general:** Desacoplar el acceso a datos de la lógica de negocio.
* **Problema que resuelve:** Evita que el código de negocio (servicios) esté acoplado a detalles específicos de la base de datos (como consultas SQL, ORMs específicos o estructuras de almacenamiento).
* **Justificación / Por qué usarlo:** Permite cambiar la fuente de datos o la tecnología de persistencia sin afectar las reglas de negocio. Facilita el *testing* mediante la creación de *mocks* de la base de datos.
* **Ejemplo en el proyecto:** `EventDao`, `UserDao`, donde toda la lógica de Mongoose/MongoDB o TypeORM/PostgreSQL queda encapsulada.

### Facade (Fachada)
* **Propósito general:** Simplificar la interacción con un componente o subsistema complejo.
* **Problema que resuelve:** Cuando un sistema tiene múltiples clases o servicios complejos, obligar a los clientes a interactuar con todos ellos genera un alto acoplamiento y dificulta su uso.
* **Justificación / Por qué usarlo:** Proporciona una interfaz unificada y de alto nivel.
* **Ejemplo en el proyecto:** Un servicio de integración con pasarelas de pago, transportistas u obras sociales, donde la fachada oculta la complejidad de llamar a múltiples APIs externas.

### Adapter (Adaptador)
* **Propósito general:** Uniformar la comunicación con sistemas externos heterogéneos.
* **Problema que resuelve:** Sistemas de terceros (como servicios legados SOAP vs partners modernos REST) tienen interfaces incompatibles con nuestro sistema.
* **Justificación / Por qué usarlo:** Actúa como un traductor. Permite que clases con interfaces incompatibles trabajen juntas sin modificar su código fuente.
* **Ejemplo en el proyecto:** Adaptar diferentes proveedores de autenticación externa o distintos proveedores de envío de emails para que el sistema interno los consuma a través de una única interfaz común.

### Factory (Fábrica)
* **Propósito general:** Manejar la creación de objetos que varían según ciertas condiciones (canal, proveedor, tipo de usuario).
* **Problema que resuelve:** Evita el uso excesivo de condicionales (if/else o switch) al momento de instanciar objetos complejos.
* **Justificación / Por qué usarlo:** Centraliza y encapsula la lógica de creación. Promueve el principio Abierto/Cerrado (Open/Closed), facilitando la adición de nuevos tipos sin modificar el código existente.
* **Ejemplo en el proyecto:** Un `TicketFactory` que crea distintos tipos de tickets (VIP, General, Platea) o un creador de estrategias de pago según el método seleccionado.

### Strategy (Estrategia)
* **Propósito general:** Intercambiar algoritmos o comportamientos en tiempo de ejecución.
* **Problema que resuelve:** Se necesitan diferentes variaciones de un algoritmo dentro de un objeto, y queremos poder cambiar entre ellos dinámicamente sin modificar la clase que los usa.
* **Justificación / Por qué usarlo:** Permite aislar los detalles de implementación de un algoritmo del código que lo utiliza.
* **Ejemplo en el proyecto:** Distintas políticas de ruteo, algoritmos de cálculo de descuentos, políticas de tarifado u overbooking.

> **Nota sobre Otros Patrones:** Cualquier otro patrón visto en la Unidad III (ej. Observer, Decorator, Singleton) es válido, siempre y cuando su justificación se adapte mejor al problema específico del dominio que los listados anteriormente.

---

## 2. Estructura de Entregas y Progresión del Sistema

El proceso consta de 4 entregas (dos checkpoints formativos y dos obligatorias), más una prueba final antes de diciembre.

**Regla de Oro:** Cada entrega debe **incrementar el valor del sistema**. Debe sumar funcionalidad real y verificable. No es válido repetir lo mismo solo con más documentación; el sistema debe crecer en alcance y complejidad en cada hito.

### Hitos Clave Mencionados

#### Entrega 1 (31/08)
* **Tipo:** Checkpoint formativo (Parcial N.º 1).
* **Objetivo principal:** Arquitectura base.
* **Requisitos:**
  * Primer componente (o más) desplegado.
  * Arquitectura en capas implementada y funcionando.

#### Entrega 2 (14/09)
* **Tipo:** Entrega Obligatoria — 1.º Parcial.
* **Objetivo principal:** Patrones y Seguridad.
* **Requisitos:**
  * Al menos **3 componentes** funcionales.
  * **Patrones de diseño** aplicados y justificados.
  * **Seguridad declarativa** mínima implementada.

### Resumen de la Progresión Esperada
* **E1:** Base técnica -> Capas + Despliegue inicial.
* **E2:** Madurez técnica -> Múltiples componentes + Patrones (mín. 3) + Seguridad base.
