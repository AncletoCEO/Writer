# Design: Lightweight API Markdown view

## Approach

Derivar `agent/API.md` de `symbols.json` en el render. No requiere un nuevo fact: se agrupa por
archivo, se filtran `exported: true` y se ordena por path/línea. El `summary` es opcional y
proviene de #11.

## Architecture

- `src/render/api.js`: `renderApi(symbolsJson)` → mapa de páginas Markdown.
- `src/render/markdown.js`: `renderDocuments` incluye `agent/API.md` si `config.apiDocs.enabled`.
- `src/build/run.js`: pasa `config` (ya lo hace).
- `docs/contracts/writer-artifacts-v1.md`: agrega `agent/API.md` al layout.
- `src/config/load.js`: `apiDocs.enabled` (default `true`).

## Output

```markdown
# API

## src/core/engine.js

- `run(input)` — Ejecuta el motor.
- `createEngine(options)` — Crea una instancia.
```

Sin exportados, el documento indica "Sin símbolos exportados".

## Validation

- `API.md` incluye solo exportados.
- Incluye `summary` cuando existe y firma siempre.
- Pagina a 500 líneas.
- No cambia `SYMBOLS.md` ni `symbols.json`.
- Tests de render, filtrado y paginación.
