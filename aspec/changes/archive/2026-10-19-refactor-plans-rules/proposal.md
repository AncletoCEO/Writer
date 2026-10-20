# Proposal: Refactor plans and rule generation

> Issue: [#24 — Refactor plans and rule generation](https://github.com/AncletoCEO/Writer/issues/24)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera planes de refactor para monolitos, scripts ejecutables y reglas `.cursorrules`. Writer se enfoca en hechos deterministas; @ancleto/spec ya tiene skills, agents y memoria para decidir refactors.

- Writer publica `GOTCHAS.md` y métricas.
- No genera scripts de refactor ni reglas de agente.

## Proposed change

¿Writer debe proponer refactors o generar reglas para agentes (`.cursorrules`)?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. No implementar; spec decide.
B. Sugerencias read-only en `GOTCHAS.md`.
C. Scripts ejecutables (riesgoso).
D. Generar `.cursorrules`/reglas desde hechos.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Aplicar refactors automáticamente.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
