# Proposal: GraphRAG and MCP server

> Issue: [#19 — GraphRAG and MCP server](https://github.com/AncletoCEO/Writer/issues/19)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator construye un índice GraphRAG y un MCP server. @ancleto/spec ya tiene un MCP de memoria y consume el technical seed. Duplicar GraphRAG/MCP podría agregar mantenimiento y confusión sobre la fuente de verdad.

- `graph.json`, `symbols.json` y `facts/*` son consumibles por archivos.
- No hay GraphRAG ni MCP en Writer.
- spec tiene su propio MCP de memoria y su pipeline de discovery.

## Proposed change

¿Writer debe exponer GraphRAG/MCP o dejar que spec y sus agentes consuman los facts?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. No implementar; spec consume los JSON.
B. MCP de solo lectura sobre `graph.json`/`symbols.json`.
C. GraphRAG local (entidades, relaciones, reportes).
D. Integrar el MCP de ReadMenator como herramienta externa.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
GraphRAG con LLM o embeddings.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
