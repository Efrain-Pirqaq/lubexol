---
name: modern-ui-patterns
description: Patrones de interfaz moderna que combinan la estética visual de 21st.dev con la robustez y accesibilidad lógica de ui-sdk.dev (@ui-sdk/react). Actívala al diseñar páginas, componentes interactivos o landing pages.
---

# Modern UI Patterns (21st.dev + UI SDK)

Este manual guía al especialista de frontend para construir interfaces visualmente impactantes y técnicamente perfectas sin inventar código mediocre.

---

## 1. La Regla de Oro (División de Responsabilidades)

- **El aspecto visual (Estética) ➔ Inspirado en 21st.dev:**
  - Usar para: Héroes de bienvenida, grillas tipo Bento, tarjetas interactivas, secciones de precios (*pricing*) y animaciones modernas con Tailwind CSS.
  - Estilo: Minimalista, profesional, tipografía limpia, sin saturación visual.

- **El funcionamiento interno (Lógica) ➔ Construido con ui-sdk.dev:**
  - Usar para componentes con lógica difícil: Menús desplegables (*dropdowns*), modales/diálogos, cajones (*drawers*), selectores de fecha y autocompletados (*combobox*).
  - Paquete base: Utilizar `@ui-sdk/react` para garantizar navegación por teclado, accesibilidad y cero bugs de interacción.

---

## 2. Flujo de Trabajo Obligatorio

1. **Selección del Patrón:** El agente identifica qué componente se necesita y toma la referencia visual de 21st.dev.
2. **Implementación de Lógica:** Si el componente requiere abrir/cerrar o interactividad compleja, monta las primitivas de `@ui-sdk/react`.
3. **Consulta con Context7:** Usar Context7 MCP (`resolve-library-id`) para traer la sintaxis actualizada de las librerías necesarias (como Framer Motion o Tailwind).
4. **Filtro Clean Code (Poda obligatoria):** Antes de entregar el código, limpiar cualquier dependencia innecesaria o clases de Tailwind redundantes.
