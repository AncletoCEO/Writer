# Design: Orphan file detection

## Approach

Detectar archivos sin aristas `import` entrantes sobre el grafo ya construido. La detección
ocurre después de `applyMetrics` y antes de `buildFacts`, usando el `fanIn` de los nodos y el
`package.json` del proyecto para excluir entrypoints.

## Architecture

- `src/metrics/orphans.js`:
  - `detectOrphanFiles({ fileNodes, edges, packageJson, rootAbs, config })`.
  - Construye el conjunto de entrypoints desde `bin`, `main`, `module` y `exports`.
  - Excluye tests (`test/`, `tests/`, `*.test.*`, `*.spec.*`), config (`*.config.*`,
    `tsconfig*.json`, etc.), `scripts/`, `migrations/` y `orphans.entrypoints`.
  - Marca `confidence: low` si `unresolved` tiene dynamic imports no literales o imports no
    resueltos; `medium` en caso contrario.
  - Devuelve `{ orphanFiles, excluded, dynamicImports }`.
- `src/build/analyze.js`: lee `package.json` una vez y calcula `orphans` después de metrics.
- `src/facts/dead-code.js`: serializa `facts/dead-code.json`.
- `src/facts/build.js`: agrega el fact.
- `src/render/markdown.js`: sección "Archivos huérfanos" en `GOTCHAS.md`.
- `src/cli/commands/lint.js`: regla `orphanFiles` opt-in.
- `src/config/load.js`: defaults/validación de `orphans` y `lint.orphanFiles`.

## Data model

```json
{
  "schemaVersion": 1,
  "orphanFiles": [
    { "path": "src/legacy.js", "reason": "no-inbound-imports", "confidence": "medium" }
  ],
  "excluded": [
    { "path": "src/cli/index.js", "reason": "entrypoint:bin" },
    { "path": "test/a.test.js", "reason": "test" }
  ],
  "dynamicImports": false
}
```

## Validation

- Tests de archivo huérfano, entrypoint, test, config, script, dynamic import y lint opt-in.
- Verificar que los archivos excluidos no aparezcan como candidatos.
- Verificar que el fact sea determinista (orden por path).
- Verificar que `lint` no falle por huérfanos salvo que `lint.orphanFiles` sea `true`.
