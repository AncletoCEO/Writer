# Tasks: Docstring summary and coverage

> Change de implementación. Issue #11. Depende de que el lexer exponga comentarios.

## Fase 0 — Relevamiento

- [ ] Revisar el lexer y confirmar dónde se descartan los comentarios.
- [ ] Definir la regla de asociación (misma línea anterior, sin línea en blanco).
- [ ] Definir `docs.enabled`/`docs.minCoverage`.

## Fase 1 — Extracción y asociación

- [ ] Agregar recolección de comentarios al lexer sin romper `tokenize`.
- [ ] Implementar `attachSummaries` en el parser.
- [ ] Agregar `summary` a símbolos y nodos de grafo.
- [ ] Incluir `summary` en `symbols.json`.

## Fase 2 — Cobertura y docs

- [ ] Implementar `src/facts/doc-coverage.js` y publicar el fact.
- [ ] Mostrar summaries en `INDEX.md`/`SYMBOLS.md`.
- [ ] Agregar baja cobertura a `GOTCHAS.md` según `docs.minCoverage`.
- [ ] Actualizar contrato y README.

## Fase 3 — Tests

- [ ] Comentario de bloque y de línea.
- [ ] Comentario separado por línea en blanco no se asocia.
- [ ] Declaración sin comentario no inventa summary.
- [ ] Cobertura por archivo/total y determinismo.
- [ ] `npm test`, `npm run lint`, `npm run build`.
