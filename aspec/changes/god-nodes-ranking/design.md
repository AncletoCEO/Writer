# Design: God nodes ranking

## Approach

- Nuevo `src/facts/god-nodes.js` o cálculo dentro de `src/metrics/index.js`.
- Ranking determinista: PageRank normalizado + fan-in + cantidad de símbolos exportados; top N configurable (default 20).
- `facts/god-nodes.json` con `{ path, score, pageRank, fanIn, fanOut, symbols }`.
- Sección "God nodes" en `GOTCHAS.md` e `INDEX.md`.
- Config: `godNodes.limit`.

## Architecture

Áreas afectadas: src/metrics/index.js, src/facts/god-nodes.js, src/render/markdown.js, tests de ranking.

## Validation

- [ ] `facts/god-nodes.json` con `schemaVersion: 1`.
- [ ] Orden determinista y desempate por path.
- [ ] Sección visible en `GOTCHAS.md`.
- [ ] Tests con grafos de distinta centralidad.
