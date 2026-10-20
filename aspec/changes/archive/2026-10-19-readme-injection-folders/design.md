# Design: README injection and self-describing folders

## Approach

¿Writer debe inyectar links en el README del usuario o generar READMEs por carpeta?

A. Mantener cero efectos laterales (actual).
B. Inyección opt-in con bloque marcado e idempotente.
C. READMEs solo dentro de `.ancleto/writer/` (no en el repo del usuario).
D. No hacerlo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- Writer solo escribe dentro de `outputDir`.
- No modifica README ni genera READMEs por carpeta.
- `docs/contracts` define la frontera de escritura.

## Validation

ADR con decisión (probablemente mantener A + C). No implementar.

- Confianza del usuario y conflictos de merge.
- Idempotencia y reversibilidad.
- Valor real del link.
- Coherencia con la regla de no tocar el repo.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
