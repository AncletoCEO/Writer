# Design: Overview video generation

## Approach

¿Tiene sentido que Writer genere un video de overview del repo?

A. No implementar.
B. Script externo opcional que consuma `graph.json`.
C. Integrar ReadMenator como herramienta externa.
D. Generar frames/HTML y dejar el render al usuario.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- No hay generación de video.
- Las salidas son JSON/Markdown/Mermaid.

## Validation

ADR corto con recomendación (probablemente no implementar). No implementar.

- Valor real para el producto.
- Dependencias, peso y mantenibilidad.
- Licencia de assets/música.
- Tiempo de cómputo.
