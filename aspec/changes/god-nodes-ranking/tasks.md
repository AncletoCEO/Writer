# Tasks: God nodes ranking

> Change de implementación. Issue #4.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] Nuevo `src/facts/god-nodes.js` o cálculo dentro de `src/metrics/index.js`.
- [ ] Ranking determinista: PageRank normalizado + fan-in + cantidad de símbolos exportados; top N configurable (default 20).
- [ ] `facts/god-nodes.json` con `{ path, score, pageRank, fanIn, fanOut, symbols }`.
- [ ] Sección "God nodes" en `GOTCHAS.md` e `INDEX.md`.
- [ ] Config: `godNodes.limit`.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] `facts/god-nodes.json` con `schemaVersion: 1`.
- [ ] Orden determinista y desempate por path.
- [ ] Sección visible en `GOTCHAS.md`.
- [ ] Tests con grafos de distinta centralidad.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
