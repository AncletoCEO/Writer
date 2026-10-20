# Design: API reference generation

## Approach

¿Writer debe generar documentación de API determinista o eso pertenece al technical seed/LLM de spec?

A. Markdown de API por módulo usando `symbols.json` y docstrings (si se implementan).
B. Formato Sphinx/Doxygen con tags y cross-links.
C. No generar; dejar que spec/LLM redacte desde `symbols.json`.
D. Exportar JSON estructurado y un renderer externo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/facts/symbols.js` publica símbolos y firmas.
- `agent/SYMBOLS.md` lista símbolos con `file:line`.
- No hay páginas por módulo ni índice de API.

## Validation

ADR con alcance, formato, estructura de archivos y criterios de aceptación. No implementar.

- Solapamiento con el technical seed y con IDEs.
- Valor para agentes vs costo de mantenimiento.
- Dependencia de docstrings (issue relacionado).
- Tamaño de salida y paginación.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
