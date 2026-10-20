# Proposal: Community detection (Louvain/label propagation)

> Issue: [#3 — Community detection (Louvain/label propagation)](https://github.com/AncletoCEO/Writer/issues/3)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator agrupa archivos en comunidades cohesivas y las usa para explicar la arquitectura, detectar seams y generar subgrafos. Writer hoy solo tiene capas heurísticas por path, no comunidades. `@ancleto/spec` se beneficia de una vista de subsistemas reales en el technical seed y en `GOTCHAS.md`.

- `src/graph/build.js` construye nodos/aristas de import, call e inherits.
- `src/metrics/layers.js` clasifica capas por path.
- No existe `facts/communities.json` ni un campo `community` en los nodos.
- `src/render/markdown.js` genera `ARCHITECTURE.md` con capas y Mermaid.

## Proposed change

- Nuevo `src/metrics/communities.js` con un algoritmo determinista (label propagation o Louvain simplificado) sobre aristas `import`.
- Salida estable: comunidades ordenadas por tamaño y path; asignación `path -> community`.
- `facts/communities.json` con `schemaVersion: 1`, `communities: [{ id, size, cohesion, files }]`.
- Anotar nodos de archivo con `community` y agregar `graph.stats.communities`.
- En `ARCHITECTURE.md`: listado de comunidades y subgrafos Mermaid por comunidad (con tope de nodos).
- En `GOTCHAS.md`: comunidades grandes, baja cohesión y posibles seams.
- Config mínima: `communities.enabled`, `communities.maxIterations`.

## Scope

Incluye: cálculo, facts, anotación de nodos, docs y tests.
No incluye: mapas vis.js/3D, detección de comunidades sobre call graph ni análisis semántico.

## Risks

- Riesgo: el algoritmo puede ser sensible al orden; mitigar con orden estable y tests de determinismo.
- Dependencia: ninguna; conviene implementarlo antes de surprising connections.
