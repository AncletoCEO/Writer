# Tasks: Docstring summary and coverage

> Change de implementación. Issue #11. Depende de que el lexer exponga comentarios.

## Fase 0 — Relevamiento

- [x] Revisar el lexer y confirmar dónde se descartan los comentarios.
- [x] Definir la regla de asociación (misma línea anterior, sin línea en blanco).
- [x] Definir `docs.enabled`/`docs.minCoverage`.

## Fase 1 — Extracción y asociación

- [x] Agregar recolección de comentarios al lexer sin romper `tokenize`.
- [x] Implementar `attachSummaries` en el parser.
- [x] Agregar `summary` a símbolos y nodos de grafo.
- [x] Incluir `summary` en `symbols.json`.

## Fase 2 — Cobertura y docs

- [x] Implementar `src/facts/doc-coverage.js` y publicar el fact.
- [x] Mostrar summaries en `INDEX.md`/`SYMBOLS.md`.
- [x] Agregar baja cobertura a `GOTCHAS.md` según `docs.minCoverage`.
- [x] Actualizar contrato y README.

## Fase 3 — Tests

- [x] Comentario de bloque y de línea.
- [x] Comentario separado por línea en blanco no se asocia.
- [x] Declaración sin comentario no inventa summary.
- [x] Cobertura por archivo/total y determinismo.
- [x] `npm test`, `npm run lint`, `npm run build`.
