# Proposal: Dead code and orphan symbols

> Issue: [#10 — Dead code and orphan symbols](https://github.com/AncletoCEO/Writer/issues/10)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator reporta archivos/símbolos huérfanos. Writer no detecta código muerto; solo construye imports, llamadas intra-archivo y herencia. En JS/TS hay dynamic imports, re-exports, frameworks, tests y entrypoints que complican la definición de "muerto".

- `src/graph/build.js` tiene fan-in/out y aristas.
- `src/facts/unresolved.json` registra imports no resueltos.
- No hay `facts/dead-code.json` ni análisis de símbolos sin referencias.

## Proposed change

¿Se puede detectar código muerto en JS/TS con suficiente precisión para que sea útil en `review`, sin generar una lluvia de falsos positivos?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Archivos huérfanos: sin inbound imports y que no sean entrypoint/config/test.
B. Símbolos huérfanos: sin llamadas/referencias conocidas, con confianza `inferred`.
C. Integrar ESLint/TypeScript (`no-unused-vars`) como dependencia opcional.
D. No implementarlo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Eliminación automática de código.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
