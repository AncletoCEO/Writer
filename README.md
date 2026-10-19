# @ancleto/writer

Motor de conocimiento estático, determinista y offline para complementar
[`@ancleto/spec`](https://github.com/damianarganaras/spec). Escanea un repositorio
JavaScript/TypeScript, construye un grafo de código y publica hechos que spec puede consumir
como contexto, sin LLM y sin gastar tokens.

> **Estado:** Fase 1 — scaffold del paquete. El paquete todavía no se publica y los comandos
> `init`, `build`, `check` y `doctor` se implementan en las fases 2-11. Hoy funcionan
> `--version` y `--help`.

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
npm install -g @ancleto/writer
# o
npx @ancleto/writer --help
```

El nombre y el binario son `@ancleto/writer` y `ancleto-writer`.

## Comandos

| Comando | Estado | Descripción |
|---|---|---|
| `ancleto-writer init` | planificado | Crea `.ancleto-writer.json` sin sobrescribir salvo `--force` |
| `ancleto-writer build` | planificado | Escanea, analiza y publica `.ancleto/writer/` |
| `ancleto-writer check` | planificado | Verifica frescura y compatibilidad sin escribir |
| `ancleto-writer doctor` | planificado | Diagnostica Node, git, permisos, memoria y configuración |
| `ancleto-writer --help` | disponible | Uso y aviso legal |
| `ancleto-writer --version` | disponible | Versión, copyright y licencia |

Códigos de salida previstos: `0` OK, `1` uso/config, `2` análisis/publicación, `3` stale,
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
npm test
npm run lint
npm run build
```

- El flujo de ramas está en [`docs/branching.md`](docs/branching.md).
- La procedencia del port está en [`docs/provenance.md`](docs/provenance.md).
- El cambio activo está en `aspec/changes/ancleto-writer/`.

## Licencia y atribución

Este programa es software libre: podés redistribuirlo y/o modificarlo bajo los términos de
la GNU Affero General Public License, versión 3. Se distribuye con la esperanza de que sea
útil, pero **sin ninguna garantía**. Ver [`LICENSE`](LICENSE).

El proyecto está basado en [ReadMenator](https://github.com/grisuno/ReadMenator), de Gris
Iscomeback, también bajo AGPL-3.0. La atribución completa, el commit upstream y las
superficies que no se portan están en [`NOTICE`](NOTICE).
