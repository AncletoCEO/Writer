# Design: Query, explain and path exploration

## Approach

¿Writer necesita una capa de consulta interactiva (`query`, `explain`, `path`) o alcanza con que spec/agentes consuman `graph.json` y `facts/*`?

A. Comandos deterministas: `explain <symbol>`, `path <a> <b>`, `query` con filtros estructurados.
B. Búsqueda BM25/local sobre símbolos y docs.
C. MCP server (ver issue de GraphRAG/MCP).
D. Dejar la exploración a spec/IDE.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `graph.json` y `symbols.json` tienen nodos/aristas.
- `src/metrics/blast-radius.js` resuelve impacto.
- No hay `query`, `explain` ni `path`.

## Validation

ADR con comandos, sintaxis, algoritmos (BFS bidireccional, ranking) y ejemplos. No implementar.

- Demanda real de usuarios/agentes.
- Solapamiento con spec y con el IDE.
- Costo de mantener un lenguaje de consulta.
- Calidad de resultados sin LLM.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
