# Proposal: Agent memory and skills integration

> Issue: [#26 — Agent memory and skills integration](https://github.com/AncletoCEO/Writer/issues/26)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera `MEMORY.md`, instala skills y produce documentación para agentes. Writer lee reglas de `.ancleto/memory.db` en modo read-only y genera `agent/*.md`, pero no administra memoria ni skills. Duplicar la memoria rompería la fuente de verdad de spec.

- `src/memory/read-only.js` lee reglas activas de scope `project`.
- `GOTCHAS.md` incluye esas reglas.
- No hay `MEMORY.md`, instalación de skills ni escritura en `memory.db`.

## Proposed change

¿Writer debe generar `MEMORY.md`/skills o mantener `@ancleto/spec` como única fuente de memoria y skills?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Mantener spec como fuente de verdad (actual).
B. Writer sugiere reglas/decisiones, pero no escribe; spec decide.
C. Writer genera un `MEMORY.md` efímero solo dentro de `outputDir`.
D. Writer instala skills (duplicaría spec).

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Escritura en `.ancleto/memory.db` o instalación de skills.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
