# Design: Docstrings, purpose and doc coverage

## Approach

¿Writer debe extraer docstrings/propósito y calcular cobertura de documentación, o alcanza con firmas y el seed de spec?

A. Extracción liviana de comentarios inmediatamente anteriores a la declaración y resumen de primera línea.
B. Parseo estructurado de JSDoc/TSDoc (tags, params, returns).
C. Delegar a TypeScript compiler API (dependencia) o al LLM del seed.
D. No hacerlo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/parsers/javascript.js` extrae nombre, kind, líneas y firma.
- No se capturan comentarios JSDoc/TSDoc ni `@param`/`@returns`.
- No hay cobertura de documentación.

## Validation

Propuesta de formato (campos `summary`, `description`, `tags`), reglas de extracción, cobertura y límites. No implementar todavía.

- Valor real para `INDEX`/`SYMBOLS`/technical seed.
- Costo de parseo y falsos positivos.
- Cobertura de convenciones (JSDoc, TSDoc, comentarios sueltos).
- Impacto en el tamaño de los docs y en el contrato.
