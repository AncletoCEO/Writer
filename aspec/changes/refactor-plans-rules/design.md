# Design: Refactor plans and rule generation

## Approach

¿Writer debe proponer refactors o generar reglas para agentes (`.cursorrules`)?

A. No implementar; spec decide.
B. Sugerencias read-only en `GOTCHAS.md`.
C. Scripts ejecutables (riesgoso).
D. Generar `.cursorrules`/reglas desde hechos.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- Writer publica `GOTCHAS.md` y métricas.
- No genera scripts de refactor ni reglas de agente.

## Validation

ADR con decisión y, si aplica, formato de sugerencias. No implementar.

- Seguridad y responsabilidad de scripts.
- Solapamiento con spec y sus skills.
- Valor real vs ruido.
- Mantenimiento de formatos de reglas.
