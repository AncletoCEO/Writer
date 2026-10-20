# Analysis: GraphRAG and MCP server

> Issue: [#19](https://github.com/AncletoCEO/Writer/issues/19)
> Change: `graphrag-mcp-server`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe exponer GraphRAG/MCP o dejar que spec y sus agentes consuman los facts?

## Evidencia

- `graph.json`, `symbols.json` y `facts/*` son consumibles por archivos.
- `@ancleto/spec` ya tiene un MCP de memoria y su pipeline de discovery/seed.
- Writer no tiene GraphRAG ni MCP.
- El paquete es cero-deps; un MCP agrega transporte, autenticación y una superficie de tools
  que viaja en cada request.

## Opciones

### A. No implementar

- Spec/agentes leen JSON/Markdown; cero mantenimiento y una sola fuente de verdad.

### B. MCP de solo lectura

- Tools `graph.search`, `symbols.get`, `impact` sobre JSON.
- Útil para agentes que no pueden leer archivos, pero duplica el acceso y agrega contexto de
  tools.

### C. GraphRAG local

- Entidades, relaciones, comunidades y reportes; mucho mantenimiento y riesgo de duplicar el
  seed de spec.

### D. Integrar el MCP de ReadMenator

- Acopla a un runtime Python y a su esquema; no recomendado para el core.

## Recomendación

**A.** Writer publica hechos; spec los consume. Si en el futuro hay agentes sin acceso a
archivos, evaluar **B (MCP de solo lectura)** como paquete separado. **No** construir GraphRAG:
el valor está en los hechos deterministas, no en otra capa de indexación semántica.

## Criterios para revisar

- Agentes que no puedan leer `.ancleto/writer/`.
- Demanda de consultas estructuradas que `graph.json` + `impact` no cubran.
- Costo de tools MCP en el contexto vs leer JSON.

## Decisión

No GraphRAG/MCP en el core. Un MCP read-only queda como follow-up condicionado a demanda.
