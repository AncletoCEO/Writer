# @ancleto/writer

[![npm version](https://img.shields.io/npm/v/@ancleto/writer?logo=npm)](https://www.npmjs.com/package/@ancleto/writer)
[![npm downloads](https://img.shields.io/npm/dm/@ancleto/writer?logo=npm)](https://www.npmjs.com/package/@ancleto/writer)
[![license](https://img.shields.io/npm/l/@ancleto/writer)](LICENSE)
[![Node](https://img.shields.io/node/v/@ancleto/writer)](package.json)
[![CI](https://github.com/AncletoCEO/Writer/actions/workflows/ci.yml/badge.svg)](https://github.com/AncletoCEO/Writer/actions/workflows/ci.yml)
[![Publish](https://github.com/AncletoCEO/Writer/actions/workflows/publish.yml/badge.svg)](https://github.com/AncletoCEO/Writer/actions/workflows/publish.yml)

Motor de conocimiento estático, determinista y offline para complementar
[`@ancleto/spec`](https://github.com/damianarganaras/spec). Escanea un repositorio
JavaScript/TypeScript (y, con el language pack opcional, Python, Go, Rust, C#, Java, C, C++,
PHP, Ruby, Swift y Kotlin), construye un grafo de código y publica hechos que spec puede
consumir como contexto, sin LLM y sin gastar tokens.

> **Estado:** `0.3.1` — release actual con el language pack P1+P2 (11 lenguajes). Licencia
> AGPL-3.0-only, Node ≥ 24 y cero dependencias de runtime en el core. El badge de npm muestra
> la última versión publicada.

## Contenido

- [Qué hace](#qué-hace)
- [Instalación](#instalación)
- [Language pack](#language-pack)
- [Uso rápido](#uso-rápido)
- [Vista humana](#vista-humana)
- [Ejemplo de salida](#ejemplo-de-salida)
- [Contrato de artefactos](#contrato-de-artefactos)
- [Integración con `@ancleto/spec`](#integración-con-ancletospec)
- [Configuración](#configuración)
- [Cómo funciona](#cómo-funciona)
- [Seguridad y límites](#seguridad-y-límites)
- [Alcance del MVP](#alcance-del-mvp)
- [Preguntas frecuentes](#preguntas-frecuentes)
- [Desarrollo](#desarrollo)
- [CI/CD y releases](#cicd-y-releases)
- [Contribución](#contribución)
- [Licencia y atribución](#licencia-y-atribución)

## Qué hace

Writer produce un paquete versionado en `.ancleto/writer/` con:

- imports, símbolos, llamadas intra-archivo y herencia;
- fan-in/fan-out, ciclos, PageRank, capas, comunidades, god nodes, conexiones inesperadas, hotspots y blast radius;
- documentación accionable para agentes (`INDEX`, `SYMBOLS`, `GOTCHAS`, `ARCHITECTURE`);
- reporte de archivos de lenguajes no soportados (salvo que tengan un adapter activo), sin analizarlos;
- candidatos a archivos huérfanos con exclusiones y confianza;
- summaries de símbolos y cobertura de documentación;
- `API.md` liviano con la API pública exportada;
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

## Language pack

`@ancleto/writer` analiza JavaScript, TypeScript, JSX y TSX sin dependencias de runtime. Los
demás lenguajes viven en un paquete opcional separado:

```bash
npm install @ancleto/writer @ancleto/writer-languages
```

`npx @ancleto/writer` instala solo el core. Para usar el pack, instalá ambos paquetes en el
proyecto (o ambos globalmente). En esta release: core `0.3.1` + pack `0.1.0`.

### Por qué es un paquete aparte

- **Core liviano:** quien solo analiza JS/TS no instala tree-sitter ni 11 grammars nativas.
- **Cero dependencias en el core:** el contrato y el arranque no cambian.
- **Opcional de verdad:** sin el pack, Writer funciona y publica `facts/unsupported.json`.
- **Versionado independiente:** el pack puede sumar lenguajes sin release del core.
- **Fallback explícito:** si el pack falta, falla o se desactiva, el core degrada a JS/TS.

El core carga el pack si está instalado. Si no está, o si `languagePack.enabled` es `false`,
los archivos de otros lenguajes se reportan como no soportados y no generan nodos.

### Lenguajes y cobertura

| Lenguaje | Extensiones | `lang` | Extrae | Resolución / límites |
|---|---|---|---|---|
| Python | `.py`, `.pyi` | `python` | imports, clases, funciones, métodos, herencia, llamadas, docstrings | imports absolutos/relativos y `__init__.py`; stdlib/third-party externos |
| Go | `.go` | `go` | imports, structs, interfaces, funciones, métodos, embebido, llamadas, doc comments | paquetes vía `go.mod`; una arista por `.go` no-test; sin `replace`/`vendor` |
| Rust | `.rs` | `rust` | `use`, `mod`, structs, enums, traits, impls, funciones, métodos, llamadas, docs | `crate`/`self`/`super` a `.rs`/`mod.rs`; sin macros ni `#[path]` |
| C# | `.cs` | `csharp` | `using`, namespaces, clases, structs, records, interfaces, enums, delegates, métodos, constructores, docs XML | `using` contra índice de namespaces; alias a tipos queda externo |
| Java | `.java` | `java` | package, imports, clases, interfaces, enums, records, anotaciones, métodos, constructores, Javadoc | package index con caída iterativa; imports static/wildcard |
| C | `.c`, `.h` | `c` | `#include`, structs, typedefs, enums, prototipos, definiciones, llamadas | quoted: directorio/root/`include/`; system externo; sin herencia |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh`, `.hxx` | `cpp` | includes, namespaces, clases/structs, templates, métodos, constructores, herencia | misma búsqueda que C; `.h` queda en C; out-of-line atribuido a la clase |
| PHP | `.php` | `php` | namespaces, `use`, clases, interfaces, traits, enums, métodos, constructores, docblocks | `use` contra índice de namespaces; alias a tipos externo; trait use sin arista |
| Ruby | `.rb` | `ruby` | `require`/`require_relative`, clases, módulos, mixins, métodos, herencia | solo `require_relative` local; `require` externo; `private`/`protected` |
| Swift | `.swift` | `swift` | imports, protocolos, clases, structs, enums, actors, extensions, métodos, conformancia | imports externos (sin SwiftPM); extensions sin símbolo propio |
| Kotlin | `.kt`, `.kts` | `kotlin` | package, imports, clases, interfaces, objects, enums, data/sealed, companions, funciones, herencia | package index con caída iterativa; imports alias/wildcard |

La resolución es **estructural**, no semántica: no hay type checking ni expansión de macros.
Las llamadas se resuelven dentro del mismo archivo; los imports sí cruzan archivos. Los límites
específicos están en el change archivado de cada lenguaje y en el contrato.

### Configuración del pack

```json
{
  "languagePack": {
    "enabled": true,
    "module": "@ancleto/writer-languages"
  }
}
```

- `enabled: false` desactiva la carga aunque el pack esté instalado.
- `module` permite apuntar a otro paquete compatible.
- Las extensiones del pack se habilitan automáticamente; `languages` sigue filtrando el core.
- `schemaVersion: 1` no cambia: `lang` es un campo aditivo.

### Instalación y peers

El pack trae tree-sitter y sus grammars como dependencias propias. Algunas grammars (Swift y
Kotlin) declaran peers de `tree-sitter` más viejos que el usado por el pack; npm puede mostrar
warnings de peer. Con npm 12 la instalación se completa y el pack usa su `tree-sitter@0.25.1`
anidado. Si una versión de npm rechaza la instalación:

```bash
npm install @ancleto/writer @ancleto/writer-languages --legacy-peer-deps
```

No muevas tree-sitter al core: el core debe seguir sin dependencias de runtime.

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
| `ancleto-writer human [--root <dir>] [--out <dir>] [--top N] [--max-classes N] [--max-nodes N] [--max-communities N] [--interactive] [--json]` | Genera una vista humana compacta desde el paquete ya construido |
| `ancleto-writer doctor [--root <dir>] [--json]` | Diagnostica Node, git, permisos, memoria y configuración |
| `ancleto-writer --help` | Uso y aviso legal |
| `ancleto-writer --version` | Versión, copyright y licencia |

Códigos de salida: `0` OK, `1` uso/config, `2` análisis/publicación, `3` stale,
`4` esquema incompatible, `5` violaciones de `lint`.

## Vista humana

Los artefactos de `agent/` están pensados para agentes y pueden ser enormes en repos grandes.
Para una lectura humana hay una proyección compacta y opcional:

```bash
ancleto-writer build
ancleto-writer human
```

Genera, dentro de `outputDir`:

```text
.ancleto/writer/human/
├── OVERVIEW.md       # resumen, lenguajes, god nodes, hotspots, ciclos, huérfanos
├── ARCHITECTURE.md   # capas, comunidades, UML acotado, imports y ciclos
└── data.json         # los mismos datos curados, deterministas
```

Características:

- **Derivada:** lee `graph.json` y `facts/*`; no reescanea ni reparsea.
- **Acotada:** `--top` (default 20), `--max-classes` (20), `--max-nodes` (30) y
  `--max-communities` (6) evitan documentos gigantes.
- **Determinista:** dos ejecuciones sobre el mismo paquete producen los mismos bytes.
- **Fuera del manifest:** `human/` es una salida humana opcional; el contrato de agentes y
  `schemaVersion: 1` no cambian.
- **Sin dependencias nuevas:** HTML/CSS/SVG inline, Markdown/Mermaid y JSON. Sin frameworks, JS externo, CDN ni red.
- **Offline:** `index.html` se abre directo en el navegador y los diagramas ya están renderizados como SVG.
- **Interactivo opcional:** `--interactive` agrega `interactive.html` con Cytoscape vendorizado (MIT, ~426 KB inline), grafo de comunidades, búsqueda, filtros, layouts, zoom/pan y drill-down a archivos. La licencia está en `src/human/vendor/CYTOSCAPE-LICENSE` y no agrega una dependencia de runtime.
- **Seguro:** todo path/nombre del repo se escapa antes de entrar al HTML/SVG/DOM.

Ejemplos:

```bash
ancleto-writer human --top 30
ancleto-writer human --max-classes 10 --max-nodes 20
ancleto-writer human --interactive
ancleto-writer human --interactive --max-communities 12 --json
```

## Ejemplo de salida

```text
$ ancleto-writer build
ancleto-writer: publicado .ancleto/writer (25 archivos, 458 aristas, 109 ms)
```

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
│   ├── skipped.json
│   ├── dead-code.json
│   ├── doc-coverage.json
│   └── unsupported.json
└── agent/
    ├── INDEX.md
    ├── API.md
    ├── SYMBOLS.md
    ├── GOTCHAS.md
    └── ARCHITECTURE.md
```

`manifest.json`:

```json
{
  "schemaVersion": 1,
  "writerVersion": "0.3.1",
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

`graph.json` y `symbols.json` publican `lang` por archivo. Los valores del core son `js`, `ts`,
`jsx` y `tsx`; con el pack se agregan `python`, `go`, `rust`, `csharp`, `java`, `c`, `cpp`,
`php`, `ruby`, `swift` y `kotlin`. El `schemaVersion` sigue en `1`: un consumidor que no conoce
un `lang` nuevo puede ignorarlo sin romper el contrato. Sin pack, `.py`, `.go`, etc. aparecen en
`facts/unsupported.json` y no generan nodos.

`human/` es una salida derivada y opcional (`index.html`, `interactive.html` opcional,
Markdown y JSON). No aparece en `manifest.outputs` ni en el fingerprint; un consumidor de
agentes puede ignorarla. Se regenera con `ancleto-writer human`.

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
  "languagePack": {
    "enabled": true,
    "module": "@ancleto/writer-languages"
  },
  "uml": {
    "maxClasses": 40
  },
  "lint": {
    "cycles": true,
    "layerViolations": true,
    "unresolved": true,
    "maxBlastRadius": null,
    "orphanFiles": false
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
- **parse:** lexer/parser para JS, TS, JSX y TSX, más los adapters del language pack (Python, Go, Rust, C#, Java, C, C++, PHP, Ruby, Swift y Kotlin).
- **resolve:** relativos, extensiones, `index.*`, `__init__.py`, paquetes de Go vía `go.mod`, módulos de Rust (`crate`/`self`/`super`), namespaces de C#, packages de Java/Kotlin, headers de C/C++, namespaces de PHP, `require_relative` de Ruby, imports externos de Swift, alias de `tsconfig` y detección de externos.
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

Language pack opcional (`@ancleto/writer-languages`): 11 lenguajes P1+P2. La tabla de
cobertura, resolución y límites está en [Language pack](#language-pack). P3 está planificado
en el issue [#9](https://github.com/AncletoCEO/Writer/issues/9) con un change por lenguaje.

Fuera del MVP: visores HTML/3D, video, GraphRAG, wiki, MCP, inyección de README y escritura en
la memoria del proyecto.

## Preguntas frecuentes

### ¿Necesito instalar el language pack?

Solo si querés analizar lenguajes además de JS/TS. Sin el pack, Writer sigue siendo útil para
proyectos JavaScript/TypeScript.

### ¿Por qué no viene incluido en `@ancleto/writer`?

Porque tree-sitter y las grammars son nativas y pesadas. Incluirlas obligaría a todos los
usuarios a instalarlas y rompería la regla de cero dependencias del core. El pack es opcional,
separado y versionado aparte.

### ¿Cómo verifico que el pack está activo?

Si el pack está instalado y `languagePack.enabled` no es `false`, los archivos de sus
extensiones se analizan y no aparecen en `facts/unsupported.json`. Podés comprobarlo con:

```bash
ancleto-writer build
node -e "console.log(require('./.ancleto/writer/facts/unsupported.json').totals)"
```

### ¿Qué pasa si el pack falla o falta?

El build no se cae: el core degrada a JS/TS y reporta las extensiones afectadas en
`facts/unsupported.json`. Un error de carga del pack tampoco revienta el proceso.

### ¿Por qué npm muestra warnings de peer en Swift/Kotlin?

Porque esas grammars declaran peers de tree-sitter más viejos. El pack usa su propia versión de
tree-sitter y funciona; si tu npm rechaza la instalación, usá `--legacy-peer-deps`.

### ¿Cómo actualizo core y pack?

Mantené ambos actualizados y respetá el `schemaVersion` del contrato:

```bash
npm install @ancleto/writer@latest @ancleto/writer-languages@latest
```

### ¿El pack cambia el contrato?

No. `schemaVersion` sigue en `1`; `lang` es aditivo. Los consumidores que no conocen un lenguaje
nuevo pueden ignorarlo.

## Desarrollo

```bash
npm install
npm run build     # valida sintaxis de todos los .js
npm test          # 202 tests
npm run lint
npm pack --dry-run
```

Estructura:

```text
src/
├── cli/        # comandos y validación de flags
├── config/     # glob, defaults y precedencia
├── scan/       # walk seguro, hash y git read-only
├── languages/  # carga opcional del language pack
├── human/      # proyección humana (HTML/SVG, Cytoscape opcional, OVERVIEW, ARCHITECTURE, data.json)
├── parsers/    # lexer y parser JS/TS/JSX/TSX
├── resolve/    # imports, JSONC y tsconfig
├── graph/      # nodos y aristas
├── metrics/    # ciclos, PageRank, capas, hotspots, blast radius
├── facts/      # JSON y symbols
├── render/     # Markdown y Mermaid
├── memory/     # lectura read-only de memory.db
├── contract/   # manifest, validación y publicación atómica
└── build/      # pipeline completo

packages/
└── writer-languages/  # language pack opcional (@ancleto/writer-languages)
    ├── src/           # adapters: python, go, rust, csharp, java, c, cpp, php, ruby, swift, kotlin
    ├── README.md
    ├── LICENSE
    └── NOTICE
```

La suite cubre fixtures vacío, mixto, monorepo con alias, ciclos y archivos omitidos;
contrato, determinismo, frontera, consumo, un smoke de 2.000 archivos y tests de parser,
resolver, integración y fallback para cada adapter del pack.

### Uso en CI

```yaml
# npx instala solo el core. Para el pack, agregá antes:
#   npm install @ancleto/writer-languages
- run: npx @ancleto/writer@0.3.1 build --json
- run: npx @ancleto/writer@0.3.1 lint --json
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
  `NPM_TOKEN`, con provenance y GitHub Release. Publica el core y, si corresponde, el pack.
- El pack se configura con `npm trust github` y se publica con provenance. La primera
  publicación del pack es manual porque npm exige que el paquete exista antes del trust.
- `0.1.0` fue la primera publicación manual. `0.1.1` fue la primera release por OIDC con
  provenance. `0.2.0` agrega comunidades, god nodes, conexiones inesperadas, UML, lint e
  impact. `0.3.0` agrega el language pack opcional P1+P2 (`@ancleto/writer-languages@0.1.0`).
  `0.3.1` es un patch de documentación: README completo del pack y guía de release. Las
  siguientes salen por el workflow.
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
