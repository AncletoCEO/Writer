# Design: Dead code and orphan symbols

## Approach

¿Se puede detectar código muerto en JS/TS con suficiente precisión para que sea útil en `review`, sin generar una lluvia de falsos positivos?

A. Archivos huérfanos: sin inbound imports y que no sean entrypoint/config/test.
B. Símbolos huérfanos: sin llamadas/referencias conocidas, con confianza `inferred`.
C. Integrar ESLint/TypeScript (`no-unused-vars`) como dependencia opcional.
D. No implementarlo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/graph/build.js` tiene fan-in/out y aristas.
- `src/facts/unresolved.json` registra imports no resueltos.
- No hay `facts/dead-code.json` ni análisis de símbolos sin referencias.

## Validation

Diseño con definición operativa de "muerto", algoritmo, formato de salida y ejemplos sobre un repo real. No implementar todavía.

- Tasa de falsos positivos y claridad de la confianza.
- Manejo de dynamic imports, re-exports, decoradores y frameworks.
- Exclusión de tests, scripts y entrypoints configurable.
- Valor para `review`/`verify` vs costo.

## Result

El análisis recomienda implementar solo archivos huérfanos y diferir símbolos huérfanos. Ver [`analysis.md`](./analysis.md).
