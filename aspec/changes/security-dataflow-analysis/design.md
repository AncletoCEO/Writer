# Design: Taint, security, SARIF, CPG and dataflow

## Approach

¿Writer debe incorporar análisis de seguridad/dataflow o mantenerse como un motor de estructura?

A. Taint mínimo sobre imports peligrosos (`child_process`, `eval`, etc.) con confianza baja.
B. CPG/dataflow completo (muy costoso).
C. Integrar Semgrep/CodeQL como herramienta externa.
D. SARIF solo como formato de salida de hallazgos existentes.
E. No hacerlo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/graph/build.js` solo tiene imports, calls e inherits.
- No hay sinks/sources, sanitización, CPG ni SARIF.

## Validation

Análisis de valor/riesgo y recomendación (probablemente no implementar en el core). No implementar.

- Expertise y mantenimiento.
- Falsos positivos y confianza.
- Solapamiento con herramientas dedicadas.
- Valor para spec vs riesgo reputacional.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
