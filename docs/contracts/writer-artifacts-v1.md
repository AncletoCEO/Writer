# Contrato de artefactos `@ancleto/writer` — v1

Este documento define el contrato entre `@ancleto/writer` (productor) y cualquier consumidor,
principalmente `@ancleto/spec`. El contrato es versionado con `schemaVersion: 1` y es
**opcional**: un consumidor que no lo entiende debe usar su fallback.

## Layout

El productor escribe todo dentro de `outputDir` (default `.ancleto/writer/`):

```text
.ancleto/writer/
├── README.md
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
    ├── API.md
    ├── SYMBOLS.md
    ├── GOTCHAS.md
    └── ARCHITECTURE.md
```

`README.md` describe el propio paquete y cómo regenerarlo. No reemplaza ni modifica el README
del repositorio del usuario.

Los documentos de `agent/` pueden paginarse como `NAME_p2.md`, `NAME_p3.md`, etc. Cada página
tiene como máximo 500 líneas. Los consumidores deben considerar todas las páginas que existan.

`API.md` lista solo los símbolos exportados, agrupados por archivo, con firma y `summary`
opcional. `ARCHITECTURE.md` incluye capas, comunidades, un diagrama UML Mermaid de clases e
interfaces, el grafo de imports y los ciclos.

## `manifest.json`

```json
{
  "schemaVersion": 1,
  "writerVersion": "0.2.0",
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
- `lang`: `js`, `ts`, `jsx`, `tsx` y, cuando el language pack está activo, `python`, `go`,
  `rust`, `csharp`, `java`, `c`, `cpp`, `php`, `ruby`, `swift` y `kotlin`. Los lenguajes del
  pack son aditivos: el `schemaVersion` no cambia.

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
          "summary": "Runs the input.",
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
| `dead-code.json` | `{ orphanFiles: [{ path, reason, confidence }], excluded: [{ path, reason }], dynamicImports }` |
| `doc-coverage.json` | `{ files: [{ path, documented, total, ratio }], totals }` |
| `bridges.json` | `{ bridges: [{ from, to, fromCommunity, toCommunity, score, line }] }` |
| `communities.json` | `{ communities: [{ id, size, cohesion, files }] }` |
| `god-nodes.json` | `{ godNodes: [{ path, score, pageRank, fanIn, fanOut, symbols, exportedSymbols }] }` |
| `layers.json` | `{ layers: { path: layer }, violations: [{ from, to, fromLayer, toLayer, line }] }` |
| `hotspots.json` | `{ hotspots: [{ path, score, fanIn, fanOut, symbols, cycle }] }` |
| `blast-radius.json` | `{ seeds: [{ path, reason, direct, transitive, dependents }] }` |
| `unresolved.json` | `{ unresolved: [{ path, specifier, kind, line, reason }] }` |
| `externals.json` | `{ externals: [{ specifier, count, files }] }` |
| `skipped.json` | `{ skipped: [{ path, reason }] }` |
| `unsupported.json` | `{ unsupported: [{ extension, language, count, files }], totals }` |

`facts/inventory.md` es Markdown libre.

`unsupported.json` reporta archivos de lenguajes conocidos que Writer todavía no analiza. No
generan nodos ni aristas; existen solo para que el consumidor vea la cobertura faltante. Un
lenguaje deja de aparecer cuando su adapter está instalado y activo (por ejemplo, `.py` con
`@ancleto/writer-languages`).

## Language pack opcional

`@ancleto/writer` mantiene cero dependencias de runtime. Los lenguajes adicionales viven en
`@ancleto/writer-languages`, un paquete opcional:

```bash
npm install @ancleto/writer-languages
```

Cuando está instalado, el core lo carga automáticamente y habilita sus extensiones. Si falta o
falla la carga, el build sigue con JS/TS y los archivos afectados aparecen en
`facts/unsupported.json`. Se puede desactivar con:

```json
{ "languagePack": { "enabled": false } }
```

El adapter de Python extrae imports (`import`, `from ... import`), clases, funciones
top-level, métodos, herencia, llamadas intra-archivo y docstrings. La resolución de imports
cubre rutas absolutas del root y relativas (`.`/`..`) incluyendo `__init__.py`; stdlib y
third-party quedan como externos.

El adapter de Go extrae imports, structs, interfaces, tipos, funciones, métodos, embebido,
llamadas y doc comments. Los imports locales se resuelven con el `module` de `go.mod` y
generan una arista por cada archivo `.go` no-test del paquete destino; stdlib y third-party
quedan externos. El embebido se modela como relación `inherits`/`extends` (composición, no
herencia clásica).

El adapter de Rust extrae `use`, `mod`, structs, enums, unions, traits, type aliases,
funciones, métodos, impls, supertraits, llamadas y doc comments `///`. `crate::`, `self::`,
`super::` y `mod foo;` se resuelven a `.rs` o `mod.rs` dentro de `src/`; los crates externos
quedan externos. `impl Trait for Type` se modela como `inherits` con
`inheritsKind: implements`.

El adapter de C# extrae `using` (normal, `static`, alias y `global`), namespaces block y
file-scoped, clases, structs, records, interfaces, enums, delegates, métodos, constructores,
herencia, llamadas y doc comments XML. Los `using` locales se resuelven contra un índice de
namespaces construido con todos los archivos parseados y generan una arista por cada archivo
del namespace; BCL/third-party quedan externos. Los alias a tipos no se resuelven como
namespaces.

El adapter de Java extrae `package`, imports (normal, `static` y wildcard), clases,
interfaces, enums, records, anotaciones, métodos, constructores, herencia/implementación,
llamadas y Javadoc. Los imports locales se resuelven contra el índice de packages: se prueba
el path completo y se va quitando el último segmento hasta encontrar un package conocido;
cada archivo de ese package genera una arista. `extends`/`implements` se distinguen por
sintaxis y por el tipo del padre local.

El adapter de C extrae `#include`, structs, typedefs, enums, prototipos de funciones,
definiciones, llamadas y comentarios de documentación. Los includes con comillas se resuelven
contra el directorio del archivo, el root y `include/` (en ese orden); los includes con
ángulos quedan externos. Los prototipos y las definiciones se extraen como funciones; las
funciones `static` no se marcan como exportadas.

El adapter de C++ extrae `#include`, namespaces, clases, structs, unions, enums, templates,
métodos, constructores, destructores, herencia, llamadas y comentarios. Los métodos respetan
la sección de acceso (`public`/`private`/`protected`) cuando están en la clase; las
definiciones out-of-line (`App::run`) se atribuyen a la clase. Los headers se resuelven con la
misma búsqueda que C. `.h` queda asignado a C; C++ usa `.hpp`/`.hh`/`.hxx` para headers.

El adapter de PHP extrae namespaces, `use` (normal, alias, `function`, `const` y grupos),
clases, interfaces, traits, enums, métodos, constructores, herencia/implementación, llamadas y
docblocks. Los `use` se resuelven contra el índice de namespaces probando el nombre completo y
quitando segmentos hasta encontrar un namespace conocido; cada archivo de ese namespace genera
una arista. Las traits se publican como `class` con firma `trait X`; el `use` de traits dentro
de una clase no genera arista.

El adapter de Ruby extrae `require`/`require_relative`, clases, módulos, mixins
(`include`/`extend`/`prepend`), métodos, constructores, herencia, llamadas y comentarios.
`require_relative` se resuelve contra el directorio del archivo (con `.rb` opcional); `require`
queda externo. Los módulos se publican como `class` con firma `module X`; los mixins se
modelan como `inherits`/`implements`. La visibilidad `private`/`protected` se respeta para los
métodos.

El adapter de Swift extrae `import`, protocolos, clases, structs, enums, extensions,
typealiases, funciones, métodos, inicializadores, deinitializadores, herencia/conformancia,
llamadas y doc comments. Los `import` de Swift se cuentan como externos (no hay resolución de
módulos SwiftPM). Los protocolos se publican como `interface`; clases/structs/actors como
`class`; enums como `enum`. Las extensiones aportan métodos al tipo pero no crean un símbolo
nuevo.

El adapter de Kotlin extrae `package`, imports (normal, alias y wildcard), clases,
interfaces, objects, enums, data/sealed classes, typealiases, funciones, métodos,
constructores secundarios, companion objects, herencia y llamadas. Los imports se resuelven
contra el índice de packages probando el nombre completo y quitando segmentos hasta encontrar
un package conocido; cada archivo de ese package genera una arista. Los `object` se publican
como `class` con firma `object X`.

`dead-code.json` reporta candidatos a archivos huérfanos (sin imports entrantes) con
exclusiones de entrypoints, tests, config y scripts. No elimina código ni detecta símbolos
huérfanos.

`doc-coverage.json` mide símbolos con `summary` sobre el total, por archivo y agregado.
`summary` es opcional en `symbols.json` y `graph.json`; se extrae del comentario inmediatamente
anterior a la declaración.

`communities.json` agrupa archivos por modularidad sobre el grafo de imports. `cohesion` es la
cantidad de aristas internas dividida por las aristas incidentes a la comunidad (0 a 1). Los
nodos de archivo en `graph.json` incluyen el campo `community` con el id de la comunidad.

`god-nodes.json` ordena archivos por `score = 0.5*pageRankNorm + 0.3*fanInNorm +
0.2*exportedSymbolsNorm`, con desempate por path ascendente y un límite configurable.

`bridges.json` puntúa aristas de import entre comunidades distintas con
`score = 0.35*pageRankPromedio + 0.30*fanInNormalizadoDestino + 0.20*sorpresaComunidad +
0.15*cruceDeCapa`. `sorpresaComunidad = 1 - promedio(cohesión de ambas comunidades)`.

## Vista humana derivada

`ancleto-writer human` publica una proyección humana opcional en `human/`:

```text
human/
├── index.html
├── OVERVIEW.md
├── ARCHITECTURE.md
└── data.json
```

- Es derivada de `graph.json` y `facts/*`; no reanaliza el repositorio.
- No forma parte de `manifest.outputs` ni del fingerprint.
- No cambia `schemaVersion`.
- Los consumidores de agentes pueden ignorarla.
- Los límites (`--top`, `--max-classes`, `--max-nodes`, `--max-communities`) controlan el
  tamaño de tablas y diagramas.
- `index.html` es autocontenido: CSS inline y SVG inline, sin JS externo, CDN ni red.
- `data.json` usa rutas relativas y no incluye timestamps.

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

## Impact

`ancleto-writer impact <archivo...>` lee un paquete fresco (o reconstruye con `--build`) y
devuelve dependientes directos y transitivos, ciclos afectados, capas y archivos de test.
Acepta `--depth N` (default sin límite) y `--json`. Devuelve `3` si el paquete está stale,
`4` si es incompatible y `1` si un archivo no existe en el grafo.

## Lint

`ancleto-writer lint` reconstruye el análisis en memoria, no escribe artefactos y evalúa
reglas configurables: ciclos, violaciones de capa, imports no resueltos y un umbral de blast
radius. Devuelve exit `5` si hay hallazgos y `0` si el repositorio está limpio. `--json`
publica los hallazgos estructurados.

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
