# Proposal: Docstring summary and coverage

> Issue: [#11](https://github.com/AncletoCEO/Writer/issues/11)
> Analysis: [`aspec/changes/docstrings-purpose-coverage/analysis.md`](../docstrings-purpose-coverage/analysis.md)
> Tipo: implementation

## Problem

Writer extrae firmas pero no summaries; `INDEX.md` y `SYMBOLS.md` no explican qué hace cada
símbolo y no hay cobertura de documentación. El análisis #11 aprobó una extracción liviana sin
dependencias.

## Proposed change

- Capturar el bloque de comentario inmediatamente anterior a cada declaración y usar su primera
  línea no vacía como `summary`.
- Agregar `summary` opcional a `symbols.json` y a los nodos de símbolo del grafo.
- Publicar `facts/doc-coverage.json` con cobertura por archivo y total.
- Mostrar summaries en `INDEX.md`/`SYMBOLS.md` y baja cobertura en `GOTCHAS.md`.
- Config `docs: { enabled, minCoverage }`.

## Scope

In scope: comentarios de bloque/línea, asociación inmediata, summary, cobertura y docs.
Out of scope: parseo estructurado de tags JSDoc/TSDoc, API docs, TypeScript compiler y LLM.

## Risks

- **Asociación incorrecta:** solo asociar si no hay línea en blanco entre comentario y
  declaración; tests con decoradores y comentarios sueltos.
- **Código minificado o generado:** bajar cobertura esperada; no inventar summaries.
- **Ruido en GOTCHAS:** `minCoverage` configurable y sección acotada.
- **Contrato:** `summary` es opcional y aditivo; no rompe consumidores v1.
