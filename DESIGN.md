---
name: "EvenHub"
description: "Una boletería contemporánea para descubrir, comprar y administrar experiencias en vivo."
colors:
  primary: "#1B2A4A"
  primary-foreground: "#F5F3EE"
  accent: "#E86A2C"
  accent-foreground: "#FFFFFF"
  background: "#F5F3EE"
  surface: "#FFFFFF"
  foreground: "#1A1A1A"
  secondary: "#E8EDF5"
  muted: "#EBEBEB"
  muted-foreground: "#6B6B6B"
  border: "#D8D5CE"
  success: "#1A6E2E"
  success-surface: "#E6F4EA"
  danger: "#A02020"
  danger-surface: "#FDE8E8"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "DM Mono, monospace"
    fontSize: "0.65rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  tight: "2px"
  standard: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.standard}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.standard}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.standard}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.standard}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.standard}"
    padding: "9px 13px"
  chip:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.tight}"
    padding: "3px 8px"
---

# Design System: EvenHub

## Overview

**Creative North Star: "La boletería contemporánea"**

EvenHub combina la claridad operativa de una boletería confiable con la jerarquía visual de una cartelera cultural. Las imágenes y los títulos presentan cada evento; los controles, precios y estados permanecen familiares, compactos y precisos. La experiencia debe sentirse editorial sin convertir una tarea de compra en una pieza decorativa.

El sistema es plano y contenido. Los bordes y los cambios tonales organizan la información; la elevación aparece únicamente para responder a una interacción. En móvil, las columnas se apilan, las barras laterales se transforman en navegación compacta y ninguna acción crítica queda fuera del viewport.

La interfaz rechaza los dashboards SaaS genéricos, los marketplaces recargados y la gamificación innecesaria. El movimiento comunica progreso, confirmación o cambio de estado en 150–250 ms y siempre ofrece una alternativa reducida mediante `prefers-reduced-motion`.

**Key Characteristics:**

- Jerarquía editorial con controles de producto convencionales.
- Paleta restringida de azul profundo, naranja y neutros.
- Esquinas precisas de 2–4 px, nunca excesivamente redondeadas.
- Estados funcionales visibles mediante texto, icono y color.
- Diseño responsive estructural y compatible con WCAG 2.2 AA.

## Colors

La paleta utiliza un azul estable para estructura y confianza, un naranja escaso para acciones decisivas y neutros silenciosos para preservar la legibilidad.

### Primary

- **Azul escenario:** estructura la navegación, encabezados, títulos y acciones secundarias de alta relevancia.
- **Tinta principal:** se reserva para texto de lectura y datos de máxima legibilidad.

### Secondary

- **Naranja taquilla:** identifica la acción principal, el estado activo y momentos críticos de conversión. No es decorativo.
- **Azul de programa:** crea una segunda capa tonal para selecciones, filtros y cabeceras suaves.

### Neutral

- **Papel neutro:** fondo general que sostiene la identidad editorial sin competir con los eventos.
- **Blanco de superficie:** formularios, tablas y contenedores de trabajo.
- **Gris silencioso:** estados deshabilitados y fondos auxiliares.
- **Texto secundario:** metadatos y ayudas; nunca sustituye el texto principal cuando el contraste resulte insuficiente.
- **Línea editorial:** divisores y límites estructurales de un píxel.

### Named Rules

**The Taquilla Rule.** El naranja aparece solo en la acción principal, la selección actual o una advertencia decisiva; nunca compite consigo mismo en una pantalla.

**The State Has Words Rule.** Éxito, peligro, retención y disponibilidad siempre incluyen una etiqueta o icono además del color.

## Typography

**Display Font:** Fraunces (con Georgia como alternativa)

**Body Font:** Outfit (con `system-ui` como alternativa)

**Label/Mono Font:** DM Mono (con `monospace` como alternativa)

**Character:** Fraunces aporta el tono de cartelera y programa cultural; Outfit mantiene formularios, navegación y datos ágiles; DM Mono distingue códigos, fechas, estados y metadatos operativos.

### Hierarchy

- **Display** (600, 2rem, 1.15): títulos de página y momentos de confirmación; puede llegar hasta 2.6rem en el hero de un evento, nunca superar 6rem ni usar tracking menor que -0.04em.
- **Headline** (600, 1.3rem, 1.2): secciones principales y títulos de contenedores.
- **Title** (600, 1–1.1rem, 1.3): nombres de eventos, pasos y grupos de datos.
- **Body** (400, 0.9rem, 1.5): formularios, descripciones y contenido funcional; la prosa se limita a 65–75 caracteres por línea.
- **Label** (500, 0.65rem, 0.08em, mayúsculas): fechas, categorías, estados y encabezados breves. Nunca se usa para párrafos.

### Named Rules

**The Editorial Outside Rule.** Fraunces presenta eventos y jerarquía; botones, campos, navegación y datos permanecen en Outfit o DM Mono.

**The Legibility Floor Rule.** El texto funcional nunca baja de 0.75rem y las etiquetas de 0.65rem se limitan a contenido corto y de apoyo.

## Elevation

EvenHub es plano por defecto. La profundidad se construye con superficies, contraste tonal y bordes; no existen sombras permanentes en tarjetas, formularios ni tablas. Una sombra breve y compacta puede aparecer al elevar un evento interactivo o un menú sobre el plano, y desaparece al terminar la interacción.

### Shadow Vocabulary

- **Interactive lift** (`box-shadow: 0 4px 8px rgba(27, 42, 74, 0.12)`): únicamente durante hover o apertura de un elemento flotante.
- **Focus ring** (`outline: 3px solid rgba(232, 106, 44, 0.35)`): señal accesible de foco, acompañada por un desplazamiento de 2 px.

### Named Rules

**The Flat-by-Default Rule.** Una superficie en reposo usa borde o cambio tonal, nunca borde más una sombra decorativa.

## Components

Los componentes son sobrios, precisos y familiares. Todos incluyen estados default, hover, focus-visible, active, disabled, loading y error cuando corresponda.

### Buttons

- **Shape:** esquinas precisas con radio estándar de 4 px; las acciones compactas pueden usar 2 px.
- **Primary:** naranja taquilla, texto blanco, peso 600 y padding de 10 × 20 px. Solo uno por región de decisión.
- **Hover / Focus:** cambio tonal o desplazamiento máximo de 1–2 px durante 150 ms; foco visible de 3 px. Nunca depende únicamente de una sombra.
- **Secondary:** azul escenario con texto papel neutro para avanzar dentro de un flujo.
- **Ghost:** fondo transparente y borde de un píxel para volver, cancelar o editar sin competir con la acción primaria.
- **Disabled / Loading:** conserva su etiqueta, reduce contraste sin perder legibilidad y comunica el motivo mediante texto accesible.

### Chips

- **Style:** fondo azul de programa, texto azul escenario, radio de 2 px y etiqueta monoespaciada breve.
- **State:** la selección agrega contraste y un indicador perceptible además del color; los chips informativos no se comportan como botones.

### Cards / Containers

- **Corner Style:** radio estándar de 4 px.
- **Background:** blanco de superficie sobre papel neutro; azul escenario solo para contenedores de énfasis real.
- **Shadow Strategy:** sin sombra en reposo; elevación interactiva compacta.
- **Border:** línea editorial de 1 px.
- **Internal Padding:** 16–24 px según densidad. Nunca se anidan tarjetas por decoración.

### Inputs / Fields

- **Style:** superficie blanca, línea editorial de 1 px, radio de 4 px y padding de 9 × 13 px.
- **Focus:** borde azul escenario más foco exterior naranja visible; el placeholder cumple contraste AA.
- **Error / Disabled:** texto explicativo asociado semánticamente; peligro combina rojo, icono y mensaje. Un campo deshabilitado sigue siendo legible.

### Navigation

- La navegación pública usa azul escenario y marca la vista activa con naranja taquilla, texto y `aria-current`.
- Breadcrumbs muestran Inicio, evento y paso actual sin reemplazar el botón de regreso.
- En escritorio, organizadores y administradores usan barra lateral; por debajo de 900 px se transforma en cabecera o menú compacto operable con teclado.
- El orden de foco coincide con el orden visual y cada destino conserva un nombre accesible inequívoco.

### Event and Ticket Selection

- Las tarjetas de evento usan imagen, categoría, fecha, ubicación, precio y disponibilidad en un orden constante; toda la tarjeta puede ser interactiva, pero conserva semántica de enlace o botón.
- Los tipos de entrada y asientos se seleccionan con controles reales. El mapa visual de asientos incluye lista textual equivalente, leyenda y estados disponible, seleccionado, retenido y vendido.
- HOLD muestra el tiempo restante junto a la localidad afectada; no se comunica solo con un contador global.

### Feedback and Loading

- Los toast se anuncian con `aria-live`: éxito y estado con `polite`, errores de pago con `assertive`. Siempre pueden cerrarse y no bloquean controles.
- Los skeletons reproducen la geometría del contenido sin animación obligatoria. Con movimiento reducido permanecen estáticos.
- La confirmación de compra admite una celebración breve; el contenido y las entradas aparecen inmediatamente y el efecto desaparece con `prefers-reduced-motion`.

## Do's and Don'ts

### Do:

- **Do** usar Azul escenario, Naranja taquilla y Papel neutro según sus funciones, manteniendo el naranja como señal escasa.
- **Do** conservar esquinas de 2–4 px y bordes de un píxel como vocabulario estructural.
- **Do** mostrar precio, cargos, asiento, disponibilidad, HOLD y política de cancelación antes de confirmar.
- **Do** acompañar cada estado con texto o icono, foco visible y mensajes anunciables.
- **Do** apilar columnas, convertir barras laterales y adaptar tablas cuando el viewport lo exija; responsive significa cambio estructural.
- **Do** respetar WCAG 2.2 AA y `prefers-reduced-motion` en todos los flujos.

### Don't:

- **Don't** construir dashboards SaaS genéricos como una sucesión de tarjetas idénticas.
- **Don't** crear marketplaces recargados con promociones, colores y llamados a la acción compitiendo entre sí.
- **Don't** usar interfaces excesivamente redondeadas, decorativas o gamificadas que resten seriedad a una compra.
- **Don't** inventar navegación experimental, controles no estándar o animaciones que retrasen una tarea.
- **Don't** ocultar disponibilidad, retenciones, costos, condiciones de cancelación o el resultado de una acción mediante estados ambiguos.
- **Don't** combinar borde de un píxel y una sombra amplia en la misma tarjeta; si parece una tarjeta flotante genérica, la elevación es excesiva.
- **Don't** usar Fraunces en botones, campos, tablas o etiquetas operativas.
- **Don't** depender exclusivamente del color para favoritos, asientos, errores, pagos o reembolsos.
