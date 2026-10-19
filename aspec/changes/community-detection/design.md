# Design: Community detection (Louvain/label propagation)

## Approach

- Nuevo `src/metrics/communities.js` con un algoritmo determinista (label propagation o Louvain simplificado) sobre aristas `import`.
- Salida estable: comunidades ordenadas por tamaño y path; asignación `path -> community`.
- `facts/communities.json` con `schemaVersion: 1`, `communities: [{ id, size, cohesion, files }]`.
- Anotar nodos de archivo con `community` y agregar `graph.stats.communities`.
- En `ARCHITECTURE.md`: listado de comunidades y subgrafos Mermaid por comunidad (con tope de nodos).
- En `GOTCHAS.md`: comunidades grandes, baja cohesión y posibles seams.
- Config mínima: `communities.enabled`, `communities.maxIterations`.

## Architecture

Áreas afectadas: src/metrics/communities.js, src/metrics/index.js, src/facts/build.js, src/render/markdown.js, tests de métricas y docs de contrato.

## Validation

- [ ] `facts/communities.json` válido con `schemaVersion: 1`.
- [ ] Dos builds sobre el mismo repo producen asignaciones idénticas.
- [ ] `ARCHITECTURE.md` incluye comunidades y subgrafos Mermaid.
- [ ] Tests con un grafo conocido (dos clusters + puente) y con grafo vacío.
- [ ] `npm test` y `npm run lint` en verde.
