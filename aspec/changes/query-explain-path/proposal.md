# Proposal: Query, explain and path exploration

> Issue: [#14 — Query, explain and path exploration](https://github.com/AncletoCEO/Writer/issues/14)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator permite preguntar en lenguaje natural (BM25), explicar un símbolo y encontrar caminos entre símbolos. Writer publica hechos, pero no tiene comandos de exploración. Un agente puede usar jq o el grafo, pero la UX es peor.

- `graph.json` y `symbols.json` tienen nodos/aristas.
- `src/metrics/blast-radius.js` resuelve impacto.
- No hay `query`, `explain` ni `path`.

## Proposed change

¿Writer necesita una capa de consulta interactiva (`query`, `explain`, `path`) o alcanza con que spec/agentes consuman `graph.json` y `facts/*`?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Comandos deterministas: `explain <symbol>`, `path <a> <b>`, `query` con filtros estructurados.
B. Búsqueda BM25/local sobre símbolos y docs.
C. MCP server (ver issue de GraphRAG/MCP).
D. Dejar la exploración a spec/IDE.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Consultas en lenguaje natural con LLM.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
