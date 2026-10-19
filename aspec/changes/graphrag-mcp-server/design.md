# Design: GraphRAG and MCP server

## Approach

¿Writer debe exponer GraphRAG/MCP o dejar que spec y sus agentes consuman los facts?

A. No implementar; spec consume los JSON.
B. MCP de solo lectura sobre `graph.json`/`symbols.json`.
C. GraphRAG local (entidades, relaciones, reportes).
D. Integrar el MCP de ReadMenator como herramienta externa.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `graph.json`, `symbols.json` y `facts/*` son consumibles por archivos.
- No hay GraphRAG ni MCP en Writer.
- spec tiene su propio MCP de memoria y su pipeline de discovery.

## Validation

ADR con decisión y, si se elige MCP, esquema de tools/recursos. No implementar.

- Solapamiento con spec/MCP de memoria.
- Costo de mantener auth, transporte y esquema MCP.
- Valor real para agentes vs leer JSON.
- Token/contexto que agrega cada tool MCP.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
