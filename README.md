# @ancleto/writer

[![npm version](https://img.shields.io/npm/v/@ancleto/writer?logo=npm)](https://www.npmjs.com/package/@ancleto/writer)
[![npm downloads](https://img.shields.io/npm/dm/@ancleto/writer?logo=npm)](https://www.npmjs.com/package/@ancleto/writer)
[![license](https://img.shields.io/npm/l/@ancleto/writer)](LICENSE)
[![Node](https://img.shields.io/node/v/@ancleto/writer)](package.json)
[![CI](https://github.com/AncletoCEO/Writer/actions/workflows/ci.yml/badge.svg)](https://github.com/AncletoCEO/Writer/actions/workflows/ci.yml)
[![Publish](https://github.com/AncletoCEO/Writer/actions/workflows/publish.yml/badge.svg)](https://github.com/AncletoCEO/Writer/actions/workflows/publish.yml)

Motor de conocimiento estático, determinista y offline para complementar
[`@ancleto/spec`](https://github.com/damianarganaras/spec). Escanea un repositorio
JavaScript/TypeScript, construye un grafo de código y publica hechos que spec puede consumir
como contexto, sin LLM y sin gastar tokens.

> **Estado:** `0.2.0` publicado en npm. Licencia AGPL-3.0-only, Node ≥ 24 y cero
> dependencias de runtime.

## Contenido

- [Qué hace](#qué-hace)
- [Instalación](#instalación)
- [Uso rápido](#uso-rápido)
- [Ejemplo de salida](#ejemplo-de-salida)
- [Contrato de artefactos](#contrato-de-artefactos)
- [Integración con `@ancleto/spec`](#integración-con-ancletospec)
- [Configuración](#configuración)
- [Cómo funciona](#cómo-funciona)
- [Seguridad y límites](#seguridad-y-límites)
- [Alcance del MVP](#alcance-del-mvp)
- [Desarrollo](#desarrollo)
- [CI/CD y releases](#cicd-y-releases)
- [Contribución](#contribución)
- [Licencia y atribución](#licencia-y-atribución)

## Qué hace

Writer produce un paquete versionado en `.ancleto/writer/` con:

- imports, símbolos, llamadas intra-archivo y herencia;
- fan-in/fan-out, ciclos, PageRank, capas, comunidades, god nodes, conexiones inesperadas, hotspots y blast radius;
- documentación accionable para agentes (`INDEX`, `SYMBOLS`, `GOTCHAS`, `ARCHITECTURE`);
- diagrama UML Mermaid de clases e interfaces;
- un `manifest.json` con commit, fingerprint y hashes para verificar frescura.

`@ancleto/spec` lo consume de forma **opcional**: si writer no está instalado, está viejo o
su `schemaVersion` no coincide, spec sigue funcionando con su discovery y affected-set
actuales.

## Instalación

```bash
# global
npm install -g @ancleto/writer

# sin instalar
npx @ancleto/writer --help

# desarrollo local
npm install
npm link
ancleto-writer --help
```

El paquete y el binario son `@ancleto/writer` y `ancleto-writer`.

## Uso rápido

```bash
# en la raíz del repositorio a analizar
ancleto-writer init
ancleto-writer build
ancleto-writer check

# impacto de un cambio
ancleto-writer impact src/core/engine.js

# diagnóstico del entorno
ancleto-writer doctor
```

### Comandos

| Comando | Descripción |
|---|---|
| `ancleto-writer init [--force]` | Crea `.ancleto-writer.json` sin sobrescribir salvo `--force` |
| `ancleto-writer build [--root <dir>] [--out <dir>] [--json] [--quiet]` | Escanea, analiza y publica `.ancleto/writer/` |
| `ancleto-writer check [--root <dir>] [--json]` | Verifica frescura y compatibilidad sin escribir |
| `ancleto-writer lint [--root <dir>] [--json]` | Evalúa reglas de arquitectura: ciclos, capas, imports no resueltos y blast radius |
| `ancleto-writer impact <archivo...> [--root <dir>] [--depth N] [--build] [--json]` | Dependientes directos y transitivos de uno o más archivos |
| `ancleto-writer doctor [--root <dir>] [--json]` | Diagnostica Node, git, permisos, memoria y configuración |
| `ancleto-writer --help` | Uso y aviso legal |
| `ancleto-writer --version` | Versión, copyright y licencia |

Códigos de salida: `0` OK, `1` uso/config, `2` análisis/publicación, `3` stale,
`4` esquema incompatible, `5` violaciones de `lint`.

## Ejemplo de salida

```text
$ ancleto-writer build
ancleto-writer: publicado .ancleto/writer (25 archivos, 458 aristas, 109 ms)
```

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

`manifest.json`:

```json
{
  "schemaVersion": 1,
  "writerVersion": "0.2.0",
  "gitCommit": "abc123",
  "gitDirty": false,
  "fingerprint": "sha256:...",
  "stats": {
    "files": 25,
    "symbols": 305,
    "edges": 458,
    "externalImports": 87,
    "cycles": 0,
    "unresolved": 0,
    "skipped": 0
  }
}
```

`graph.json` (fragmento):

```json
{
  "nodes": [
    { "id": "file:src/core/engine.js", "kind": "file", "path": "src/core/engine.js", "layer": "domain" },
    { "id": "sym:src/core/engine.js#run@12", "kind": "symbol", "name": "run", "symbolKind": "function" }
  ],
  "edges": [
    { "from": "file:src/core/engine.js", "to": "file:src/core/db.js", "kind": "import", "confidence": "extracted" }
  ]
}
```

`agent/GOTCHAS.md` (fragmento):

```markdown
## Hotspots
- `src/core/engine.js` — score 0.4298

## Violaciones de capa
- `src/core/engine.js` (domain) → `src/core/db.js` (infrastructure)

## Reglas del proyecto
- [api-errors] Usar JSON para errores.
```

## Contrato de artefactos

`manifest.json` declara `schemaVersion: 1`, versión de writer, commit, fingerprint del
contenido, estadísticas y hashes de las salidas. La publicación es atómica: se escribe en un
directorio temporal, se hace swap y el manifest se escribe al final. Nunca queda un estado
mixto.

El contrato completo —layout, esquemas, frescura, fallback y ejemplo de consumo— está en
[`docs/contracts/writer-artifacts-v1.md`](docs/contracts/writer-artifacts-v1.md).

## Integración con `@ancleto/spec`

| Momento | Uso |
|---|---|
| `discovery` / technical seed | hechos deterministas que reducen el contexto enviado al LLM |
| `affected-set` | blast radius real sobre el grafo |
| `review` / `verify` | ciclos, capas, hotspots y código sin uso |
| `propose` | módulos impactados antes de diseñar |

Writer **no** escribe en `aspec/`, `docs/technical-discovery/`, el README del usuario ni
`memory.db`. Solo lee las reglas activas de la memoria del proyecto en modo read-only para
enriquecer `GOTCHAS.md`.

Consumo mínimo del contrato, sin importar internals de writer:

```js
import { readFileSync } from 'node:fs'

const outputDir = '.ancleto/writer'
const manifest = JSON.parse(readFileSync(`${outputDir}/manifest.json`, 'utf8'))

if (manifest.schemaVersion !== 1) {
  return fallback('incompatible')
}

// El consumidor recalcula el fingerprint sobre los archivos que analiza.
// Si no coincide, usa su fallback.
if (manifest.fingerprint !== currentFingerprint) {
  return fallback('stale')
}

const graph = JSON.parse(readFileSync(`${outputDir}/graph.json`, 'utf8'))
return { mode: 'writer', graph }
```

El algoritmo de fingerprint y los casos de fallback están en el contrato.

## Configuración

`ancleto-writer init` crea `.ancleto-writer.json`. Ejemplo:

```json
{
  "schemaVersion": 1,
  "outputDir": ".ancleto/writer",
  "exclude": ["test", "**/*.test.js", "**/*.spec.js"],
  "maxFileSizeBytes": 1048576,
  "maxDepth": 32,
  "layers": {
    "overrides": {
      "domain": ["src/core/memory/database.js"]
    }
  },
  "communities": {
    "enabled": true,
    "maxIterations": 50
  },
  "godNodes": {
    "limit": 20
  },
  "bridges": {
    "limit": 20
  },
  "uml": {
    "maxClasses": 40
  },
  "lint": {
    "cycles": true,
    "layerViolations": true,
    "unresolved": true,
    "maxBlastRadius": null
  },
  "memory": {
    "enabled": true,
    "path": ".ancleto/memory.db",
    "scope": "project"
  }
}
```

Precedencia: flags de CLI > `.ancleto-writer.json` > `.ancletorc` (`discovery.exclude`) >
defaults. Los excludes se unen; el resto se sobrescribe.

La clasificación de capas es heurística. Un override angosto corrige un path puntual sin
cambiar el clasificador global.

## Cómo funciona

```text
scan → parse → resolve → graph → metrics → facts → render → atomic publish
```

- **scan:** recorre el repo, excluye paths, rechaza symlinks y calcula SHA-256 en una sola lectura.
- **parse:** lexer/parser para JS, TS, JSX y TSX.
- **resolve:** relativos, extensiones, `index.*`, alias de `tsconfig` y detección de externos.
- **graph:** nodos de archivo/símbolo y aristas `import`, `call` e `inherits`.
- **metrics:** ciclos, PageRank, capas, comunidades, god nodes, conexiones inesperadas, hotspots y blast radius.
- **facts:** JSON estable para agentes y consumidores.
- **render:** Markdown, Mermaid, UML y paginación de 500 líneas.
- **publish:** swap atómico con `manifest.json` al final.

## Seguridad y límites

- Sin red: no descarga nada.
- Sin ejecución: no importa ni ejecuta código del repositorio analizado.
- Sin symlinks; contención con `realpath`.
- Límites de tamaño por archivo y profundidad.
- Solo escribe dentro de `outputDir`.
- `memory.db` se abre en modo read-only.

## Alcance del MVP

Incluido: JavaScript, TypeScript, JSX, TSX; imports, símbolos, llamadas intra-archivo,
herencia, métricas y documentos Markdown/Mermaid.

Fuera del MVP: otros lenguajes, visores HTML/3D, video, GraphRAG, wiki, API docs, MCP,
inyección de README, escritura en la memoria del proyecto y stubs multi-lenguaje.

## Desarrollo

```bash
npm install
npm run build     # valida sintaxis de todos los .js
npm test          # 97 tests
npm run lint
npm pack --dry-run
```

Estructura:

```text
src/
├── cli/        # comandos y validación de flags
├── config/     # glob, defaults y precedencia
├── scan/       # walk seguro, hash y git read-only
├── parsers/    # lexer y parser JS/TS/JSX/TSX
├── resolve/    # imports, JSONC y tsconfig
├── graph/      # nodos y aristas
├── metrics/    # ciclos, PageRank, capas, hotspots, blast radius
├── facts/      # JSON y symbols
├── render/     # Markdown y Mermaid
├── memory/     # lectura read-only de memory.db
├── contract/   # manifest, validación y publicación atómica
└── build/      # pipeline completo
```

La suite cubre fixtures vacío, mixto, monorepo con alias, ciclos y archivos omitidos;
contrato, determinismo, frontera, consumo y un smoke de 2.000 archivos.

### Uso en CI

```yaml
- run: npx @ancleto/writer@0.2.0 build --json
- run: npx @ancleto/writer@0.2.0 lint --json
- uses: actions/upload-artifact@v4
  with:
    name: writer-context
    path: .ancleto/writer
```

### Documentación

- Contrato: [`docs/contracts/writer-artifacts-v1.md`](docs/contracts/writer-artifacts-v1.md)
- Flujo de ramas: [`docs/branching.md`](docs/branching.md)
- Procedencia del port: [`docs/provenance.md`](docs/provenance.md)
- Releases y rollback: [`docs/releasing.md`](docs/releasing.md)
- Cambio archivado: `aspec/changes/archive/2026-10-19-ancleto-writer/`

## CI/CD y releases

- CI (`.github/workflows/ci.yml`): build, tests, lint y `npm pack --dry-run` en pushes y PRs.
- Publish (`.github/workflows/publish.yml`): tags `v*`, Trusted Publishing por OIDC, sin
  `NPM_TOKEN`, con provenance y GitHub Release.
- `0.1.0` fue la primera publicación manual. `0.1.1` fue la primera release por OIDC con
  provenance. `0.2.0` agrega comunidades, god nodes, conexiones inesperadas, UML, lint e
  impact; las siguientes salen por el workflow.
- La ficha de npm muestra el README del tarball publicado: los cambios de este README se
  verán en npm al publicar la próxima versión.

El proceso completo está en [`docs/releasing.md`](docs/releasing.md).

## Contribución

Las contribuciones se aceptan bajo `AGPL-3.0-only`. No hay CLA: al enviar un cambio aceptás
que se distribuya bajo esa licencia. Un relicenciamiento futuro del paquete requeriría
reescribir el núcleo derivado de ReadMenator y obtener permiso del upstream.

## Licencia y atribución

Este programa es software libre: podés redistribuirlo y/o modificarlo bajo los términos de
la GNU Affero General Public License, versión 3. Se distribuye con la esperanza de que sea
útil, pero **sin ninguna garantía**. Ver [`LICENSE`](LICENSE).

El proyecto está basado en [ReadMenator](https://github.com/grisuno/ReadMenator), de Gris
Iscomeback, también bajo AGPL-3.0. La atribución completa, el commit upstream, los archivos
derivados y las superficies que no se portan están en [`NOTICE`](NOTICE) y
[`docs/provenance.md`](docs/provenance.md).
