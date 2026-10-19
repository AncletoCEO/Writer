# Design: Agent memory and skills integration

## Approach

¿Writer debe generar `MEMORY.md`/skills o mantener `@ancleto/spec` como única fuente de memoria y skills?

A. Mantener spec como fuente de verdad (actual).
B. Writer sugiere reglas/decisiones, pero no escribe; spec decide.
C. Writer genera un `MEMORY.md` efímero solo dentro de `outputDir`.
D. Writer instala skills (duplicaría spec).

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/memory/read-only.js` lee reglas activas de scope `project`.
- `GOTCHAS.md` incluye esas reglas.
- No hay `MEMORY.md`, instalación de skills ni escritura en `memory.db`.

## Validation

ADR con decisión (probablemente A + B). No implementar.

- Fuente de verdad y confusión del usuario.
- Solapamiento con spec.
- Valor de un MEMORY.md derivado vs `GOTCHAS.md`.
- Riesgo de duplicar reglas desactualizadas.
