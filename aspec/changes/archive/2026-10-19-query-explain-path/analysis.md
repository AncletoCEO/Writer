# Analysis: Query, explain and path exploration

> Issue: [#14](https://github.com/AncletoCEO/Writer/issues/14)
> Change: `query-explain-path`
> Fecha: 2026-10-19

## Pregunta

¿Writer necesita una capa de consulta interactiva (`query`, `explain`, `path`) o alcanza con
que spec/agentes consuman `graph.json` y `facts/*`?

## Evidencia

- `graph.json` y `symbols.json` contienen nodos, aristas, firmas y líneas.
- `ancleto-writer impact` ya resuelve la pregunta principal: qué se ve afectado por un cambio.
- `GOTCHAS.md`, `hotspots.json` y `bridges.json` cubren anomalías.
- No hay `query`, `explain` ni `path`.

## Opciones

### A. Comandos deterministas

- `explain <symbol>`: definición, firma, archivo, fan-in/out, llamadas y herencia.
- `path <a> <b>`: BFS bidireccional sobre imports.
- `query` con filtros estructurados (por capa, comunidad, hotspot).
- Sin dependencias; buena UX para agentes.

### B. Búsqueda BM25/local

- Índice sobre símbolos y summaries; más potente, pero requiere indexación y mantenimiento.

### C. MCP server

- Expone tools; ver issue #19. Agrega auth/transporte y duplica el acceso a JSON.

### D. Dejar la exploración a spec/IDE

- No agregar superficie; los consumidores leen JSON.

## Recomendación

**D por ahora, con una excepción futura:** `impact` cubre el flujo de cambio. Si aparece
demanda, agregar **`explain`** (determinista, barato) y, solo después, `path`. No implementar
`query` en lenguaje natural ni BM25 en el core; el IDE/spec ya pueden buscar.

## Criterios para revisar

- Pedidos de usuarios/agentes que no se resuelvan con `graph.json` + `impact`.
- Que el reference graph cross-file esté disponible para `explain`/`path` con precisión.
- Costo de mantener una sintaxis de query.

## Decisión

Diferir `query`/`path`; considerar `explain` como follow-up de bajo costo. No implementar
BM25/LLM en el core.
