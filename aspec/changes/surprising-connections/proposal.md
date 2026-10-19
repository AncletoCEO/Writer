# Proposal: Surprising connections between communities

> Issue: [#5 — Surprising connections between communities](https://github.com/AncletoCEO/Writer/issues/5)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator detecta conexiones inesperadas entre comunidades (puentes que no siguen la arquitectura esperada). Son señales tempranas de acoplamiento. Writer ya tendrá comunidades y aristas de import; falta el ranking de puentes.

- `src/graph/build.js` produce aristas `import`.
- No hay comunidades (ver issue de community detection).
- No hay `facts/bridges.json`.

## Proposed change

- Nuevo `src/metrics/bridges.js`: para cada arista `import` cuyo origen y destino estén en comunidades distintas, calcular un score con:
  - PageRank de ambos extremos;
  - fan-in del destino;
  - diferencia de comunidades y cohesión;
  - si la arista cruza capas.
- Top N configurable (default 20), deduplicado por par `from/to`.
- `facts/bridges.json` con `schemaVersion: 1` y `bridges: [{ from, to, fromCommunity, toCommunity, score, line }]`.
- Sección "Conexiones inesperadas" en `GOTCHAS.md`.
- Tests con dos comunidades y un puente conocido.

## Scope

Incluye: ranking y docs.
No incluye: mapas visuales ni análisis semántico de la relación.

## Risks

- Dependencia: community detection.
- Riesgo: falsos positivos por capas heurísticas; marcar como warning, no error.
