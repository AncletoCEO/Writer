# Tasks: Community detection (Louvain/label propagation)

> Change de implementación. Issue #3.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] Nuevo `src/metrics/communities.js` con un algoritmo determinista (label propagation o Louvain simplificado) sobre aristas `import`.
- [ ] Salida estable: comunidades ordenadas por tamaño y path; asignación `path -> community`.
- [ ] `facts/communities.json` con `schemaVersion: 1`, `communities: [{ id, size, cohesion, files }]`.
- [ ] Anotar nodos de archivo con `community` y agregar `graph.stats.communities`.
- [ ] En `ARCHITECTURE.md`: listado de comunidades y subgrafos Mermaid por comunidad (con tope de nodos).
- [ ] En `GOTCHAS.md`: comunidades grandes, baja cohesión y posibles seams.
- [ ] Config mínima: `communities.enabled`, `communities.maxIterations`.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] `facts/communities.json` válido con `schemaVersion: 1`.
- [ ] Dos builds sobre el mismo repo producen asignaciones idénticas.
- [ ] `ARCHITECTURE.md` incluye comunidades y subgrafos Mermaid.
- [ ] Tests con un grafo conocido (dos clusters + puente) y con grafo vacío.
- [ ] `npm test` y `npm run lint` en verde.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
