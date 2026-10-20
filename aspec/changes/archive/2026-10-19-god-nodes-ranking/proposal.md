# Proposal: God nodes ranking

> Issue: [#4 — God nodes ranking](https://github.com/AncletoCEO/Writer/issues/4)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator identifica "god nodes": archivos o símbolos con alta centralidad que concentran responsabilidad y riesgo. Writer calcula PageRank, fan-in/out y hotspots, pero no expone un ranking explícito de god nodes. Es barato y mejora `GOTCHAS.md` y la lectura del technical seed.

- `src/metrics/pagerank.js` calcula PageRank.
- `src/metrics/hotspots.js` combina fan-in, fan-out, símbolos y ciclos.
- `graph.json` ya incluye `pageRank`, `fanIn`, `fanOut` y `hotspot` por archivo.
- No hay `facts/god-nodes.json` ni una sección dedicada.

## Proposed change

- Nuevo `src/facts/god-nodes.js` o cálculo dentro de `src/metrics/index.js`.
- Ranking determinista: PageRank normalizado + fan-in + cantidad de símbolos exportados; top N configurable (default 20).
- `facts/god-nodes.json` con `{ path, score, pageRank, fanIn, fanOut, symbols }`.
- Sección "God nodes" en `GOTCHAS.md` e `INDEX.md`.
- Config: `godNodes.limit`.

## Scope

Incluye: ranking de archivos (y opcionalmente símbolos) y docs.
No incluye: comunidades ni surprising connections.

## Risks

- Dependencia: ninguna. Puede reutilizar PageRank existente.
- Riesgo: no confundir god node con hotspot; documentar la diferencia.
