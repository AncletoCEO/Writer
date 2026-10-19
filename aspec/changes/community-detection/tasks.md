# Tasks: Community detection (Louvain/label propagation)

> Change de implementación. Issue #3.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] Nuevo `src/metrics/communities.js` con un algoritmo determinista (label propagation o Louvain simplificado) sobre aristas `import`.
- [x] Salida estable: comunidades ordenadas por tamaño y path; asignación `path -> community`.
- [x] `facts/communities.json` con `schemaVersion: 1`, `communities: [{ id, size, cohesion, files }]`.
- [x] Anotar nodos de archivo con `community` y agregar `graph.stats.communities`.
- [x] En `ARCHITECTURE.md`: listado de comunidades y subgrafos Mermaid por comunidad (con tope de nodos).
- [x] En `GOTCHAS.md`: comunidades grandes, baja cohesión y posibles seams.
- [x] Config mínima: `communities.enabled`, `communities.maxIterations`.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] `facts/communities.json` válido con `schemaVersion: 1`.
- [x] Dos builds sobre el mismo repo producen asignaciones idénticas.
- [x] `ARCHITECTURE.md` incluye comunidades y subgrafos Mermaid.
- [x] Tests con un grafo conocido (dos clusters + puente) y con grafo vacío.
- [x] `npm test` y `npm run lint` en verde.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
