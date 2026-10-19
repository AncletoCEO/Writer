# Tasks: God nodes ranking

> Change de implementación. Issue #4.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] Nuevo `src/facts/god-nodes.js` o cálculo dentro de `src/metrics/index.js`.
- [x] Ranking determinista: PageRank normalizado + fan-in + cantidad de símbolos exportados; top N configurable (default 20).
- [x] `facts/god-nodes.json` con `{ path, score, pageRank, fanIn, fanOut, symbols }`.
- [x] Sección "God nodes" en `GOTCHAS.md` e `INDEX.md`.
- [x] Config: `godNodes.limit`.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] `facts/god-nodes.json` con `schemaVersion: 1`.
- [x] Orden determinista y desempate por path.
- [x] Sección visible en `GOTCHAS.md`.
- [x] Tests con grafos de distinta centralidad.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
