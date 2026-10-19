# Design: Surprising connections between communities

## Approach

- Nuevo `src/metrics/bridges.js`: para cada arista `import` cuyo origen y destino estén en comunidades distintas, calcular un score con:
  - PageRank de ambos extremos;
  - fan-in del destino;
  - diferencia de comunidades y cohesión;
  - si la arista cruza capas.
- Top N configurable (default 20), deduplicado por par `from/to`.
- `facts/bridges.json` con `schemaVersion: 1` y `bridges: [{ from, to, fromCommunity, toCommunity, score, line }]`.
- Sección "Conexiones inesperadas" en `GOTCHAS.md`.
- Tests con dos comunidades y un puente conocido.

## Architecture

Áreas afectadas: src/metrics/bridges.js, src/metrics/communities.js, src/facts/build.js, src/render/markdown.js, tests de puentes.

## Validation

- [ ] `facts/bridges.json` válido y determinista.
- [ ] El puente del fixture aparece primero.
- [ ] Sección en `GOTCHAS.md`.
- [ ] Sin comunidades, el fact queda vacío y el build no falla.
