# @ancleto/writer

Motor de conocimiento estático, determinista y offline para complementar
[`@ancleto/spec`](https://github.com/damianarganaras/spec). Escanea un repositorio
JavaScript/TypeScript, construye un grafo de código y publica hechos que spec puede consumir
como contexto, sin LLM y sin gastar tokens.

> **Estado:** MVP implementado (fases 1-10). Falta la verificación final y la publicación en
> npm. Hasta entonces se usa localmente con `npm link` o `node src/cli/index.js`.

## Qué hace

Writer produce un paquete versionado en `.ancleto/writer/` con:

- imports, símbolos, llamadas intra-archivo y herencia;
- fan-in/fan-out, ciclos, PageRank, capas, hotspots y blast radius;
- documentación accionable para agentes (`INDEX`, `SYMBOLS`, `GOTCHAS`, `ARCHITECTURE`);
- un `manifest.json` con commit, fingerprint y hashes para verificar frescura.

`@ancleto/spec` lo consume de forma **opcional**: si writer no está instalado, está viejo o
su `schemaVersion` no coincide, spec sigue funcionando con su discovery y affected-set
actuales.

## Requisitos

- Node.js ≥ 24
- Cero dependencias de runtime
- Git opcional (solo para `gitCommit` y archivos cambiados; se usa en modo lectura)

## Instalación

```bash
# cuando esté publicado
npm install -g @ancleto/writer
npx @ancleto/writer --help

# desarrollo local
npm install
npm link
ancleto-writer --help
```

El nombre y el binario son `@ancleto/writer` y `ancleto-writer`.

## Uso rápido

```bash
# en la raíz del repositorio a analizar
ancleto-writer init
ancleto-writer build
ancleto-writer check

# diagnóstico del entorno
ancleto-writer doctor
```

### Comandos

| Comando | Descripción |
|---|---|
| `ancleto-writer init [--force]` | Crea `.ancleto-writer.json` sin sobrescribir salvo `--force` |
| `ancleto-writer build [--root <dir>] [--out <dir>] [--json] [--quiet]` | Escanea, analiza y publica `.ancleto/writer/` |
| `ancleto-writer check [--root <dir>] [--json]` | Verifica frescura y compatibilidad sin escribir |
| `ancleto-writer doctor [--root <dir>] [--json]` | Diagnostica Node, git, permisos, memoria y configuración |
| `ancleto-writer --help` | Uso y aviso legal |
| `ancleto-writer --version` | Versión, copyright y licencia |

Códigos de salida: `0` OK, `1` uso/config, `2` análisis/publicación, `3` stale,
`4` esquema incompatible.

## Contrato de artefactos

```text
.ancleto/writer/
├── manifest.json
├── graph.json
├── symbols.json
├── facts/
│   ├── cycles.json
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

## Principios

- **Determinista:** mismo estado del repositorio, mismo JSON.
- **Sin red:** no descarga nada ni ejecuta código del repositorio analizado.
- **Sin efectos laterales:** solo escribe dentro de `outputDir`.
- **Opcional:** spec nunca depende de writer.

## Alcance del MVP

Incluido: JavaScript, TypeScript, JSX, TSX; imports, símbolos, llamadas intra-archivo,
herencia, métricas y documentos Markdown/Mermaid.

Fuera del MVP: otros lenguajes, visores HTML/3D, video, GraphRAG, wiki, API docs, MCP,
inyección de README, escritura en la memoria del proyecto y stubs multi-lenguaje.

## Desarrollo

```bash
npm install
npm run build     # valida sintaxis de todos los .js
npm test          # suite de tests
npm run lint
```

La suite cubre fixtures vacío, mixto, monorepo con alias, ciclos y archivos omitidos;
contrato, determinismo, frontera, consumo y un smoke de 2.000 archivos.

- Contrato: [`docs/contracts/writer-artifacts-v1.md`](docs/contracts/writer-artifacts-v1.md)
- Flujo de ramas: [`docs/branching.md`](docs/branching.md)
- Procedencia del port: [`docs/provenance.md`](docs/provenance.md)
- Cambio activo: `aspec/changes/ancleto-writer/`

## Licencia y atribución

Este programa es software libre: podés redistribuirlo y/o modificarlo bajo los términos de
la GNU Affero General Public License, versión 3. Se distribuye con la esperanza de que sea
útil, pero **sin ninguna garantía**. Ver [`LICENSE`](LICENSE).

El proyecto está basado en [ReadMenator](https://github.com/grisuno/ReadMenator), de Gris
Iscomeback, también bajo AGPL-3.0. La atribución completa, el commit upstream, los archivos
derivados y las superficies que no se portan están en [`NOTICE`](NOTICE) y
[`docs/provenance.md`](docs/provenance.md).
