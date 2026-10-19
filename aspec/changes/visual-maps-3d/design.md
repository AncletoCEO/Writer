# Design: Visual maps, 3D, flows and component diagrams

## Approach

¿Writer debe generar mapas interactivos, 3D, flows o diagramas de componentes, o quedarse en Mermaid?

A. Quedarse en Mermaid (actual).
B. SVG estático generado por código propio.
C. HTML interactivo propio (sin copiar vis.js de ReadMenator).
D. Integrar ReadMenator como herramienta externa opcional.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/render/mermaid.js` genera Mermaid.
- `src/render/markdown.js` embebe los diagramas.
- No hay HTML, CSS, JS ni 3D.

## Validation

ADR con decisión y límites. Probablemente mantener Mermaid y rechazar el resto. No implementar.

- Valor para spec vs costo/mantenimiento.
- Licencia/AGPL de templates copiados.
- Accesibilidad y peso de salida.
- Demanda real.
