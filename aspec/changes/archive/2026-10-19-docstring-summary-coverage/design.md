# Design: Docstring summary and coverage

## Approach

El lexer ya recorre comentarios y strings; se agrega una colección de comentarios con posición
y texto, sin convertirlos en tokens del parser. El parser asocia a cada símbolo el comentario
cuyo `end` está en la línea inmediatamente anterior al `start` de la declaración (sin líneas en
blanco intermedias) y toma la primera línea no vacía como `summary`.

## Architecture

- `src/parsers/lexer.js`: opción `withComments` (o `tokenizeWithComments`) que devuelve
  `{ tokens, comments }`; `tokenize` sigue devolviendo tokens para no romper tests.
- `src/parsers/javascript.js`: `attachSummaries(symbols, comments)`; agrega `summary` a
  funciones, clases, métodos, interfaces, types y enums.
- `src/graph/build.js`: copia `summary` al nodo de símbolo.
- `src/facts/symbols.js`: incluye `summary` si existe.
- `src/facts/doc-coverage.js`: calcula cobertura por archivo y total.
- `src/facts/build.js`: publica `facts/doc-coverage.json`.
- `src/render/markdown.js`: summaries en `INDEX`/`SYMBOLS` y baja cobertura en `GOTCHAS`.
- `src/config/load.js`: `docs.enabled` y `docs.minCoverage`.

## Data model

```json
{
  "schemaVersion": 1,
  "files": [
    { "path": "src/a.js", "documented": 2, "total": 3, "ratio": 0.6667 }
  ],
  "totals": { "documented": 10, "total": 20, "ratio": 0.5 }
}
```

## Validation

- Tests con comentario de bloque, comentario de línea, comentario separado por línea en blanco
  y declaración sin comentario.
- Verificar que `summary` no incluya `/**`/`*/` ni tags.
- Verificar que la cobertura sea determinista y excluya tests/config si se configura.
- Verificar que `symbols.json` siga siendo válido sin `summary` en símbolos no documentados.
