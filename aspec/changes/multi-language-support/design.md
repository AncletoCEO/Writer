# Design: Multi-language support

## Approach

¿Qué lenguajes adicionales justifican el costo y cómo implementarlos sin romper cero dependencias, rendimiento y mantenibilidad?

A. Parsers propios por lenguaje (como ReadMenator): control total, cero deps, mucho mantenimiento.
B. Tree-sitter como peer/optional dependency: cobertura amplia, rompe cero-deps y agrega WASM/binarios.
C. Delegar a herramientas externas (ReadMenator, Semgrep, etc.): rápido, pero acopla y puede traer AGPL/entornos.
D. Quedarse en JS/TS.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/parsers/lexer.js` y `src/parsers/javascript.js` son específicos de JS/TS.
- `src/scan/scanner.js` filtra por extensiones.
- `src/resolve/imports.js` resuelve imports JS/TS.
- No hay parsers para Python, Go, Rust, Java, etc.

## Validation

ADR con matriz de lenguajes, estrategia elegida, fases y criterios de salida. No implementar parsers todavía.

- Demanda real de usuarios de spec.
- Costo de mantenimiento y tests por lenguaje.
- Impacto en el contrato (symbols, imports, calls, inherits).
- Rendimiento y tamaño del paquete.
- Licencia y dependencias.
- Prioridad de lenguajes (Python, Go, Rust, Java, etc.).
