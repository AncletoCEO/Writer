# Design: @ancleto/writer

## Approach

`@ancleto/writer` es una CLI Node independiente que produce un paquete de hechos deterministas sobre un repositorio y lo publica en `.ancleto/writer/`. `@ancleto/spec` lo consume de forma opcional: si el paquete no existe, está viejo o su esquema no coincide, spec sigue operando con su discovery y affected-set actuales.

La estrategia es **contrato primero**:

1. Congelar el contrato de artefactos (`schemaVersion: 1`) y sus reglas de frescura.
2. Portar el núcleo de análisis estático de ReadMenator (scanner, parser JS/TS, resolver, grafo, métricas, capas) bajo AGPL-3.0-only.
3. Producir solo JSON, Markdown y Mermaid propios; nada de HTML/JS copiado del upstream.
4. Publicar el paquete con fuente completa, `LICENSE`, `NOTICE` y procedencia por archivo.
5. Validar el contrato con un harness de consumo que simula a `@ancleto/spec` sin modificar ese repositorio.

Decisiones de diseño cerradas para el MVP:

| Decisión | Valor |
|---|---|
| Nombre / binario | `@ancleto/writer` / `ancleto-writer` |
| Runtime | Node ≥ 24, ESM, `"type": "module"` |
| Dependencias de runtime | Cero |
| Licencia | `AGPL-3.0-only` |
| Lenguajes | JavaScript, TypeScript, JSX, TSX |
| Salidas | JSON + Markdown + Mermaid |
| Integración | Opcional, por contrato versionado, con fallback total |
| Memoria | Lectura read-only de `.ancleto/memory.db`; nunca escritura |
| Publicación | Atómica por directorio; `manifest.json` escrito al final |
| Red / ejecución de código del repo | Prohibidas |

El puerto se mantiene en módulos identificables (`src/parsers/`, `src/graph/`, `src/metrics/`) con cabecera SPDX y un mapa de procedencia. El código propio (CLI, contrato, render, configuración) queda separado para que una futura reescritura clean-room no obligue a tocar toda la base.

## Architecture

### Layout del repositorio

```text
Writer/
├── package.json
├── LICENSE                  # AGPL-3.0
├── NOTICE                   # upstream, commit, archivos derivados
├── README.md
├── docs/
│   ├── provenance.md        # mapa ReadMenator → @ancleto/writer
│   └── contracts/
│       └── writer-artifacts-v1.md
├── src/
│   ├── cli/
│   │   ├── index.js         # dispatch, --help, --version, exit codes
│   │   └── commands/
│   │       ├── build.js
│   │       ├── check.js
│   │       ├── init.js
│   │       └── doctor.js
│   ├── config/
│   │   ├── load.js          # precedencia y defaults
│   │   └── glob.js          # matcher mínimo zero-dep
│   ├── scan/
│   │   ├── scanner.js       # walk seguro, límites, hashes
│   │   └── git.js           # rev-parse / diff read-only, opcional
│   ├── parsers/
│   │   ├── lexer.js         # tokens JS/TS/JSX/TSX
│   │   ├── javascript.js    # imports, símbolos, llamadas, herencia
│   │   └── tsconfig.js      # JSONC + paths/baseUrl
│   ├── resolve/
│   │   └── imports.js       # relativos, extensiones, index, alias
│   ├── graph/
│   │   └── build.js         # nodos, aristas, dedupe, orden estable
│   ├── metrics/
│   │   ├── cycles.js        # Tarjan SCC
│   │   ├── pagerank.js      # power iteration
│   │   ├── layers.js        # heurística + overrides
│   │   ├── hotspots.js
│   │   └── blast-radius.js  # reachability inversa acotada
│   ├── facts/
│   │   └── build.js         # agrega métricas en facts/*
│   ├── render/
│   │   ├── markdown.js      # INDEX, SYMBOLS, GOTCHAS, ARCHITECTURE
│   │   └── mermaid.js
│   ├── memory/
│   │   └── read-only.js     # node:sqlite, solo lectura
│   ├── contract/
│   │   ├── writer.js        # publicación atómica
│   │   ├── manifest.js      # frescura y fingerprint
│   │   └── validate.js      # schemaVersion + integridad
│   └── util/
│       ├── hash.js
│       ├── json.js
│       └── paths.js
└── test/
    ├── unit/
    ├── contract/
    ├── fixtures/
    └── consumers/
```

### Pipeline

```text
config ──▶ scan ──▶ parse ──▶ resolve ──▶ graph ──▶ metrics ──▶ facts ──▶ render ──▶ publish
            │          │          │           │          │          │          │
            │          │          │           │          │          │          └─ manifest.json (último)
            │          │          │           │          │          └─ agent/*.md
            │          │          │           │          └─ facts/*.json
            │          │          │           └─ graph.json + symbols.json
            │          │          └─ unresolved.json + externals
            │          └─ archivos con tokens/símbolos
            └─ file entries + sha256
```

Cada etapa es una función pura sobre la salida de la anterior. La única etapa con I/O de escritura es `publish`; la única lectura fuera del repo es `memory/read-only.js` y `git.js` (ambas opcionales).

### Modelo de datos

`graph.json` contiene nodos de archivo y de símbolo, y aristas tipadas:

```json
{
  "schemaVersion": 1,
  "stats": {
    "files": 123,
    "symbols": 456,
    "edges": 789,
    "externalImports": 42
  },
  "nodes": [
    {
      "id": "file:src/core/app.js",
      "kind": "file",
      "path": "src/core/app.js",
      "lang": "js",
      "size": 4096,
      "lines": 140,
      "symbolCount": 4,
      "fanIn": 2,
      "fanOut": 3,
      "pageRank": 0.0123,
      "layer": "application",
      "hotspot": 0.71
    },
    {
      "id": "sym:src/core/app.js#run@12",
      "kind": "symbol",
      "path": "src/core/app.js",
      "name": "run",
      "symbolKind": "function",
      "exported": true,
      "line": 12,
      "endLine": 30
    }
  ],
  "edges": [
    {
      "from": "file:src/core/app.js",
      "to": "file:src/core/db.js",
      "kind": "import",
      "confidence": "extracted",
      "line": 3
    },
    {
      "from": "sym:src/core/app.js#run@12",
      "to": "sym:src/core/app.js#helper@30",
      "kind": "call",
      "confidence": "inferred",
      "line": 18
    },
    {
      "from": "sym:src/core/app.js#App@5",
      "to": "sym:src/core/base.js#Base@4",
      "kind": "inherits",
      "confidence": "extracted",
      "line": 5
    }
  ]
}
```

Reglas del modelo:

- IDs estables: `file:<posix>` y `sym:<path>#<name>@<line>`.
- `kind` de arista: `import`, `call`, `inherits`.
- `confidence`: `extracted` (literal o sintaxis inequívoca) o `inferred` (resolución por nombre/heurística).
- Paquetes externos no generan nodos: se cuentan en `stats.externalImports` y se listan en `facts/externals.json`.
- Imports relativos no resueltos se reportan en `facts/unresolved.json` con `reason` (`not-found`, `non-literal`, `outside-root`, `ambiguous`).
- Archivos omitidos por límites se reportan en `facts/skipped.json` con `reason` (`too-large`, `too-deep`, `symlink`, `unreadable`).

`symbols.json` es un índice denormalizado para agentes:

```json
{
  "schemaVersion": 1,
  "files": [
    {
      "path": "src/core/app.js",
      "symbols": [
        {
          "id": "sym:src/core/app.js#run@12",
          "name": "run",
          "kind": "function",
          "exported": true,
          "line": 12,
          "endLine": 30,
          "signature": "run(input)"
        }
      ]
    }
  ]
}
```

`manifest.json` es el commit lógico del paquete:

```json
{
  "schemaVersion": 1,
  "writerVersion": "0.1.0",
  "generatedAt": "2026-10-19T12:00:00.000Z",
  "root": ".",
  "gitCommit": "abc123",
  "gitDirty": false,
  "fingerprint": "sha256:9f2c...",
  "stats": {
    "files": 123,
    "symbols": 456,
    "edges": 789,
    "cycles": 2,
    "externalImports": 42,
    "durationMs": 850
  },
  "outputs": [
    { "path": "graph.json", "sha256": "sha256:...", "bytes": 123456 },
    { "path": "symbols.json", "sha256": "sha256:...", "bytes": 45678 }
  ]
}
```

`fingerprint` se calcula sobre la lista ordenada de archivos incluidos: `path\0size\0sha256(content)`. No depende de timestamps ni del orden del filesystem.

### Algoritmos

- **Ciclos**: Tarjan SCC sobre aristas `import`. Se reportan SCC con más de un nodo y self-loops. Salida ordenada por tamaño y path.
- **PageRank**: power iteration sobre aristas `import`, damping `0.85`, tolerancia `1e-6`, máximo 100 iteraciones, orden determinista. Se normaliza a suma 1.
- **Capas**: rank por path (`shared=0`, `domain=1`, `infrastructure=2`, `application=3`, `presentation=4`) con overrides por config. Una arista de rank menor a mayor se reporta como `upward-import`; es un warning heurístico, no un error.
- **Hotspots**: `0.35*fanIn + 0.25*fanOut + 0.20*symbols + 0.20*cycleMembership`, con cada componente normalizado min-max sobre el repo. Desempate por path.
- **Blast radius**: reachability inversa BFS sobre aristas `import`. Semillas: top 100 por fan-in, archivos cambiados según `git diff --name-only HEAD` (si hay git), y `impactSeeds` de config. Dependientes listados con tope de 200 por semilla para acotar tamaño.
- **Llamadas**: solo intra-archivo en el MVP. Se resuelven contra símbolos locales; las llamadas no resueltas no generan arista y se cuentan en `stats`.
- **Herencia**: resolución local y por nombre importado; si hay más de un candidato, `confidence: inferred`. Si no se resuelve, no genera arista.

### Contrato, frescura y publicación atómica

Consumo del lado de `@ancleto/spec` (pseudocódigo, implementación futura en ese repo):

```text
manifest = readJson(.ancleto/writer/manifest.json)
if missing or manifest.schemaVersion != 1: fallback
if manifest.writerVersion incompatible: fallback
if not fresh(manifest): fallback
graph = readJson(.ancleto/writer/graph.json)
```

`fresh(manifest)`:

1. Si hay git y `manifest.gitCommit == HEAD` y `!manifest.gitDirty` → fresco.
2. Si hay git y el commit no coincide o el árbol está sucio → recalcular fingerprint y comparar.
3. Sin git → recalcular fingerprint y comparar.

`ancleto-writer check` aplica la misma lógica y devuelve:

| Exit | Significado |
|---|---|
| `0` | Fresco y compatible |
| `3` | Stale (fingerprint distinto) |
| `4` | Esquema incompatible |

Publicación atómica:

1. Escribir todo en `.ancleto/.writer.tmp-<pid>/`.
2. Escribir `manifest.json` al final del directorio temporal.
3. Si existe `.ancleto/writer/`, renombrarlo a `.ancleto/.writer.bak-<pid>`.
4. Renombrar el temporal a `.ancleto/writer/`.
5. Eliminar el backup; si el paso 4 falla, restaurar el backup.

Nunca queda un `graph.json` nuevo con un `manifest.json` viejo, ni viceversa. Los consumidores que lean durante el swap ven el paquete anterior o el nuevo, nunca un estado mixto.

### Documentación para agentes

Se generan cuatro documentos, cada uno con tope de 500 líneas y paginación `_p2.md`, `_p3.md`:

| Documento | Contenido |
|---|---|
| `agent/INDEX.md` | una línea por archivo: propósito, capa, used-by |
| `agent/SYMBOLS.md` | símbolos con `file:line`, exportados primero |
| `agent/GOTCHAS.md` | top blast radius, ciclos, hotspots, violaciones de capa, imports no resueltos y reglas activas del proyecto |
| `agent/ARCHITECTURE.md` | capas, ciclos y diagrama Mermaid |

`GOTCHAS.md` incluye una sección "Reglas del proyecto" con las `rule` activas de scope `project` leídas de `memory.db`. No intenta mapearlas semánticamente a archivos: las reproduce textualmente para que el agente las vea junto al contexto estructural.

### CLI

```text
ancleto-writer init [--force]
ancleto-writer build [--root <dir>] [--out <dir>] [--json] [--quiet]
ancleto-writer check [--root <dir>] [--json]
ancleto-writer doctor [--json]
ancleto-writer --help
ancleto-writer --version
```

`init` escribe `.ancleto-writer.json` sin sobrescribir salvo `--force`. `build` es idempotente. `check` no escribe. `doctor` reporta Node, git, permisos, DB de memoria (solo lectura), configuración efectiva y último manifest.

### Configuración y precedencia

```json
{
  "schemaVersion": 1,
  "root": ".",
  "outputDir": ".ancleto/writer",
  "include": ["**/*"],
  "exclude": [
    "node_modules",
    ".git",
    ".ancleto",
    "dist",
    "build",
    "coverage",
    "aspec"
  ],
  "languages": ["js", "ts", "jsx", "tsx"],
  "maxFileSizeBytes": 1048576,
  "maxDepth": 32,
  "followSymlinks": false,
  "resolve": {
    "tsconfig": "auto",
    "extensions": [".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".json"]
  },
  "layers": { "enabled": true, "overrides": {} },
  "impactSeeds": [],
  "memory": {
    "enabled": true,
    "path": ".ancleto/memory.db",
    "scope": "project"
  },
  "agentDocs": true
}
```

Precedencia: flags de CLI > `.ancleto-writer.json` > `.ancletorc` (`discovery.exclude`) > defaults. Los excludes se unen; el resto se sobrescribe.

### Seguridad y rendimiento

- Sin symlinks; se usa `lstat` y verificación de contención con `realpath` para no salir de `root`.
- Tope de 1 MiB por archivo y profundidad 32, configurables.
- Sin red, sin ejecutar código del repo, sin `eval`.
- Git solo se invoca en modo lectura (`rev-parse`, `diff --name-only`); si no existe, se omite.
- Escritura solo dentro de `outputDir`; nunca en `aspec/`, `docs/technical-discovery/` ni `memory.db`.
- Una sola lectura por archivo: el hash se calcula durante el scan.
- Objetivo de rendimiento: 2.000 archivos JS/TS < 5 s y 10.000 < 30 s en una laptop moderna; algoritmos O(V+E) y blast radius acotado.

### Licencia y procedencia

- `LICENSE` con el texto AGPL-3.0 y `"license": "AGPL-3.0-only"` en `package.json`.
- `NOTICE` con: proyecto upstream, URL, autor, commit exacto, lista de archivos derivados y fecha de modificación.
- Cabecera en cada archivo derivado:

```text
// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator <module> (commit <sha>), modified 2026-10-19.
```

- `README.md` con la atribución descriptiva y el aviso estándar de AGPL, sin usar la marca ReadMenator como nombre propio.
- `--version` y `--help` muestran copyright, licencia y ausencia de garantía.
- El tarball de npm incluye `src/`, `LICENSE`, `NOTICE`, `docs/` y `README.md`; el tag de GitHub identifica la fuente exacta.
- Las salidas generadas (JSON/Markdown/Mermaid) no incluyen plantillas AGPL ni código del upstream; pertenecen al usuario.
- No se agrega CLA. Las contribuciones quedan bajo AGPL. Cualquier relicenciamiento futuro requiere reescribir el núcleo portado y obtener permiso del upstream.

## Validation

| Nivel | Qué se valida |
|---|---|
| Unit | lexer, parser, resolver, Tarjan, PageRank, capas, hotspots, fingerprint |
| Contract | esquema v1, golden files, frescura, atomicidad, paginación de docs |
| Determinismo | dos `build` sobre el mismo fixture producen JSON idéntico salvo `generatedAt`/`durationMs` |
| Frontera | no se escribe fuera de `outputDir`; hash de `memory.db` sin cambios; sin red |
| CLI | comandos, flags, precedencia de config y exit codes `0/1/2/3/4` |
| Licencia | `npm pack --dry-run` incluye `LICENSE`, `NOTICE` y `src/`; cabeceras SPDX; aviso en `--version` |
| Rendimiento | smoke con 2.000 archivos sintéticos dentro del objetivo |
| Consumo | harness que lee el contrato como lo haría spec; casos fresco, stale, ausente y esquema incompatible |

Criterios de aceptación:

- Todos los requirements de `specs/` tienen al menos un test asociado.
- `npm test` y `npm run lint` en verde.
- `npm pack --dry-run` contiene la fuente completa y los archivos de licencia.
- Un repo fixture sin writer produce el mismo resultado en el consumidor que con writer ausente; el fallback no depende de writer.
- El paquete no declara `dependencies` y el CLI rechaza Node < 24 con un mensaje claro.
