# Contrato de artefactos `@ancleto/writer` — v1

Este documento define el contrato entre `@ancleto/writer` (productor) y cualquier consumidor,
principalmente `@ancleto/spec`. El contrato es versionado con `schemaVersion: 1` y es
**opcional**: un consumidor que no lo entiende debe usar su fallback.

## Layout

El productor escribe todo dentro de `outputDir` (default `.ancleto/writer/`):

```text
.ancleto/writer/
├── manifest.json
├── graph.json
├── symbols.json
├── facts/
│   ├── cycles.json
│   ├── bridges.json
│   ├── communities.json
│   ├── god-nodes.json
│   ├── layers.json
│   ├── hotspots.json
│   ├── blast-radius.json
│   ├── inventory.md
│   ├── unresolved.json
│   ├── externals.json
│   └── skipped.json
└── agent/
    ├── INDEX.md
    ├── SYMBOLS.md
    ├── GOTCHAS.md
    └── ARCHITECTURE.md
```

Los documentos de `agent/` pueden paginarse como `NAME_p2.md`, `NAME_p3.md`, etc. Cada página
tiene como máximo 500 líneas. Los consumidores deben considerar todas las páginas que existan.

`ARCHITECTURE.md` incluye capas, comunidades, un diagrama UML Mermaid de clases e interfaces,
el grafo de imports y los ciclos.

## `manifest.json`

```json
{
  "schemaVersion": 1,
  "writerVersion": "0.1.0",
  "generatedAt": "2026-10-19T12:00:00.000Z",
  "root": ".",
  "gitCommit": "abc123",
  "gitDirty": false,
  "fingerprint": "sha256:...",
  "stats": {
    "files": 123,
    "symbols": 456,
    "edges": 789,
    "externalImports": 42,
    "cycles": 2,
    "communities": 2,
    "selfLoops": 0,
    "unresolved": 1,
    "skipped": 0
  },
  "durationMs": 850,
  "outputs": [
    { "path": "graph.json", "sha256": "sha256:...", "bytes": 123456 }
  ]
}
```

Campos obligatorios y tipos:

| Campo | Tipo | Regla |
|---|---|---|
| `schemaVersion` | number | debe ser `1` |
| `writerVersion` | string | versión semver del productor |
| `generatedAt` | string | ISO-8601 parseable |
| `root` | string | `"."` |
| `gitCommit` | string \| null | commit de git si está disponible |
| `gitDirty` | boolean \| null | árbol sucio al generar |
| `fingerprint` | string | `sha256:<64 hex>` |
| `stats` | object | contadores numéricos |
| `outputs` | array | `{ path, sha256, bytes }` por salida |

`fingerprint` se calcula como SHA-256 sobre la lista ordenada
`path\0size\0sha256(content)` de todos los archivos fuente incluidos. No depende de
timestamps ni del orden del filesystem.

## `graph.json`

```json
{
  "schemaVersion": 1,
  "stats": { "files": 2, "symbols": 3, "edges": 1, "externalImports": 0 },
  "nodes": [
    {
      "id": "file:src/a.js",
      "kind": "file",
      "path": "src/a.js",
      "lang": "js",
      "size": 120,
      "lines": 6,
      "symbolCount": 1,
      "fanIn": 0,
      "fanOut": 1,
      "pageRank": 0.5,
      "layer": "application",
      "community": "c1",
      "exportedSymbols": 1,
      "hotspot": 0.2
    },
    {
      "id": "sym:src/a.js#run@3",
      "kind": "symbol",
      "path": "src/a.js",
      "name": "run",
      "symbolKind": "function",
      "exported": true,
      "line": 3,
      "endLine": 5,
      "signature": "run(input)"
    }
  ],
  "edges": [
    {
      "from": "file:src/a.js",
      "to": "file:src/b.js",
      "kind": "import",
      "confidence": "extracted",
      "line": 1
    }
  ]
}
```

- IDs de archivo: `file:<posix path>`.
- IDs de símbolo: `sym:<path>#<name>@<line>`.
- `kind` de arista: `import`, `call`, `inherits`.
- `confidence`: `extracted` o `inferred`.
- Los paquetes externos no generan nodos; se cuentan en `stats.externalImports`.

## `symbols.json`

```json
{
  "schemaVersion": 1,
  "files": [
    {
      "path": "src/a.js",
      "symbols": [
        {
          "id": "sym:src/a.js#run@3",
          "name": "run",
          "kind": "function",
          "exported": true,
          "line": 3,
          "endLine": 5,
          "signature": "run(input)"
        }
      ]
    }
  ]
}
```

## `facts/*.json`

Todos declaran `schemaVersion: 1`:

| Archivo | Contenido |
|---|---|
| `cycles.json` | `{ cycles: [{ size, files }], selfLoops: [id] }` |
| `bridges.json` | `{ bridges: [{ from, to, fromCommunity, toCommunity, score, line }] }` |
| `communities.json` | `{ communities: [{ id, size, cohesion, files }] }` |
| `god-nodes.json` | `{ godNodes: [{ path, score, pageRank, fanIn, fanOut, symbols, exportedSymbols }] }` |
| `layers.json` | `{ layers: { path: layer }, violations: [{ from, to, fromLayer, toLayer, line }] }` |
| `hotspots.json` | `{ hotspots: [{ path, score, fanIn, fanOut, symbols, cycle }] }` |
| `blast-radius.json` | `{ seeds: [{ path, reason, direct, transitive, dependents }] }` |
| `unresolved.json` | `{ unresolved: [{ path, specifier, kind, line, reason }] }` |
| `externals.json` | `{ externals: [{ specifier, count, files }] }` |
| `skipped.json` | `{ skipped: [{ path, reason }] }` |

`facts/inventory.md` es Markdown libre.

`communities.json` agrupa archivos por modularidad sobre el grafo de imports. `cohesion` es la
cantidad de aristas internas dividida por las aristas incidentes a la comunidad (0 a 1). Los
nodos de archivo en `graph.json` incluyen el campo `community` con el id de la comunidad.

`god-nodes.json` ordena archivos por `score = 0.5*pageRankNorm + 0.3*fanInNorm +
0.2*exportedSymbolsNorm`, con desempate por path ascendente y un límite configurable.

`bridges.json` puntúa aristas de import entre comunidades distintas con
`score = 0.35*pageRankPromedio + 0.30*fanInNormalizadoDestino + 0.20*sorpresaComunidad +
0.15*cruceDeCapa`. `sorpresaComunidad = 1 - promedio(cohesión de ambas comunidades)`.

## Frescura

Un consumidor debe considerar el paquete fresco solo si:

1. `manifest.json` existe y es JSON válido.
2. `manifest.schemaVersion === 1`.
3. `manifest.fingerprint` coincide con el fingerprint recalculado del estado actual.

Opcionalmente, un consumidor puede comparar `manifest.outputs` con los archivos publicados
para detectar corrupción o ediciones manuales.

## Fallback

El consumidor debe ignorar el paquete y usar su propio mecanismo cuando:

- el manifest no existe;
- `schemaVersion` es desconocido o mayor;
- el fingerprint no coincide (stale);
- el manifest o una salida están corruptos.

El fallback nunca debe fallar por culpa de writer.

## Ejemplo de consumo

```js
import { computeFingerprint, readManifest } from '@ancleto/writer/contract/manifest'

const manifest = readManifest(outputDir)
if (!manifest || manifest.schemaVersion !== 1) return fallback('missing-or-incompatible')

const fingerprint = computeFingerprint(scanResult.files)
if (manifest.fingerprint !== fingerprint) return fallback('stale')

const graph = readJson(`${outputDir}/graph.json`)
return { mode: 'writer', graph }
```

## Garantías del productor

- Determinista: mismo estado del repositorio, mismo JSON (salvo `generatedAt` y `durationMs`).
- Publicación atómica: nunca queda un estado mixto entre artefactos.
- Solo escribe dentro de `outputDir`.
- Nunca escribe en `aspec/`, `docs/technical-discovery/`, `README.md` ni `.ancleto/memory.db`.
- Abre `memory.db` en modo read-only.
- No accede a la red ni ejecuta código del repositorio analizado.
