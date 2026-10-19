# Design: Class stubs in other languages

## Approach

¿Los usuarios necesitan generar stubs/clases en otros lenguajes desde el grafo?

A. No implementar.
B. Generar solo declaraciones desde plantillas para 1-2 lenguajes.
C. Generar desde UML con un motor de templates.
D. Delegar a herramientas externas.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `symbols.json` y UML Mermaid (si se implementa) describen clases.
- No hay generación de código.

## Validation

ADR con demanda y decisión. No implementar.

- Demanda real de scaffolding.
- Riesgo de drift semántico.
- Mantenimiento por lenguaje.
- Relación con el core de Writer.
