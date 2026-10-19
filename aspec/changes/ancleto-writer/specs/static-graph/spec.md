# Spec: static-graph

## Purpose

Define cómo `@ancleto/writer` descubre archivos, extrae estructura de JavaScript/TypeScript, resuelve imports y construye el grafo determinista que alimenta las métricas y los artefactos de contexto.

## ADDED Requirements

### Requirement: Descubrimiento determinista de archivos fuente

The system SHALL recorrer el repositorio y seleccionar únicamente archivos JavaScript, TypeScript, JSX y TSX, aplicando las exclusiones efectivas, sin seguir symlinks y respetando los topes de tamaño y profundidad.

#### Scenario: Exclusiones por defecto

- **WHEN** se ejecuta un build sobre un repositorio con `node_modules`, `.git`, `dist`, `build`, `coverage` y `aspec`
- **THEN** ninguno de esos directorios aporta archivos al grafo
- **AND** el resultado es idéntico al de un repositorio que no los contiene

#### Scenario: Symlink fuera del root

- **WHEN** el scanner encuentra un symlink que apunta fuera del root
- **THEN** no lo sigue
- **AND** registra el archivo en `facts/skipped.json` con `reason: symlink`

#### Scenario: Archivo por encima del límite

- **WHEN** un archivo fuente supera `maxFileSizeBytes`
- **THEN** no se parsea
- **AND** se registra en `facts/skipped.json` con `reason: too-large`

#### Scenario: Orden estable

- **WHEN** dos builds recorren el mismo repositorio
- **THEN** los archivos se procesan y emiten en el mismo orden, independiente del orden del filesystem

### Requirement: Extracción de imports

The system SHALL extraer imports estáticos, imports side-effect, re-exports, `import()` con literal y `require()` con literal, marcando cada arista con `confidence: extracted`.

#### Scenario: Import estático

- **WHEN** un archivo contiene `import { x } from './b.js'`
- **THEN** se emite una arista `import` desde el archivo hacia `b.js` con la línea correspondiente

#### Scenario: Re-export

- **WHEN** un archivo contiene `export { x } from './b.js'`
- **THEN** se emite una arista `import` hacia `b.js`
- **AND** el símbolo re-exportado se refleja en `symbols.json` cuando es resoluble

#### Scenario: Import dinámico con literal

- **WHEN** un archivo contiene `import('./b.js')`
- **THEN** se emite una arista `import` hacia `b.js` con `confidence: extracted`

#### Scenario: Import dinámico no literal

- **WHEN** un archivo contiene `import(path)` donde `path` no es un literal puro
- **THEN** no se emite arista
- **AND** se registra en `facts/unresolved.json` con `reason: non-literal`

#### Scenario: Require con literal

- **WHEN** un archivo contiene `require('./b.cjs')`
- **THEN** se emite una arista `import` hacia `b.cjs`

### Requirement: Resolución de imports locales

The system SHALL resolver imports relativos considerando extensión explícita, lista de extensiones e `index.*`, y SHALL aplicar `baseUrl` y `paths` de `tsconfig.json` o `jsconfig.json` cuando existan.

#### Scenario: Extensión omitida

- **WHEN** un import relativo no declara extensión y existe `b.ts`
- **THEN** se resuelve a `b.ts`

#### Scenario: Index de directorio

- **WHEN** un import relativo apunta a un directorio con `index.ts`
- **THEN** se resuelve a `index.ts`

#### Scenario: Alias de tsconfig

- **WHEN** `tsconfig.json` declara `paths: { "@core/*": ["src/core/*"] }`
- **AND** un archivo importa `@core/db`
- **THEN** se resuelve a `src/core/db.ts`

#### Scenario: Paquete externo

- **WHEN** un archivo importa `node:fs` o `lodash`
- **THEN** no se crea un nodo
- **AND** se incrementa `stats.externalImports`
- **AND** el especificador se lista en `facts/externals.json`

#### Scenario: Relativo no resuelto

- **WHEN** un import relativo no encuentra archivo destino
- **THEN** se registra en `facts/unresolved.json` con `reason: not-found`
- **AND** no se emite arista

### Requirement: Símbolos, llamadas y herencia

The system SHALL extraer funciones, clases, métodos, const-arrow, interfaces, types y enums con `line`, `endLine`, `exported` y `signature`; SHALL emitir aristas de llamada intra-archivo resueltas y aristas de herencia locales o importadas.

#### Scenario: Función exportada

- **WHEN** un archivo declara `export function run(input) { ... }`
- **THEN** `symbols.json` contiene `run` con `kind: function`, `exported: true` y su rango de líneas

#### Scenario: Llamada intra-archivo

- **WHEN** una función del archivo llama a otro símbolo local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

#### Scenario: Llamada no resuelta

- **WHEN** una llamada no puede resolverse a un símbolo local
- **THEN** no se emite arista
- **AND** no se inventa un nodo

#### Scenario: Herencia local

- **WHEN** una clase extiende otra clase del mismo archivo
- **THEN** se emite una arista `inherits` con `confidence: extracted`

#### Scenario: Herencia importada ambigua

- **WHEN** una clase extiende un nombre importado y hay más de un candidato
- **THEN** se emite una arista `inherits` con `confidence: inferred`
- **AND** el destino elegido es determinista

### Requirement: Métricas estructurales

The system SHALL calcular fan-in, fan-out, ciclos, PageRank, capas, hotspots y blast radius de forma determinista.

#### Scenario: Ciclo de imports

- **WHEN** tres archivos forman un ciclo de imports
- **THEN** `facts/cycles.json` reporta una SCC con los tres archivos
- **AND** el orden de los archivos es estable

#### Scenario: Self-loop

- **WHEN** un archivo se importa a sí mismo
- **THEN** se reporta como self-loop en `facts/cycles.json`

#### Scenario: PageRank normalizado

- **WHEN** se calcula PageRank sobre un grafo con al menos un nodo
- **THEN** la suma de los valores es 1 dentro de la tolerancia declarada

#### Scenario: Violación de capa

- **WHEN** un archivo de `shared` importa un archivo de `presentation`
- **THEN** la arista se reporta como `upward-import` en `facts/layers.json`
- **AND** no se trata como error fatal

#### Scenario: Blast radius acotado

- **WHEN** se calcula blast radius para las semillas configuradas
- **THEN** cada semilla reporta dependientes directos y transitivos
- **AND** la lista de dependientes se corta en 200 elementos

### Requirement: Determinismo de la salida

The system SHALL producir JSON idéntico entre dos builds sobre el mismo estado del repositorio, salvo los campos declarados `generatedAt` y `durationMs` del manifest.

#### Scenario: Dos builds consecutivos

- **WHEN** se ejecuta `build` dos veces sin cambios en los archivos
- **THEN** `graph.json`, `symbols.json` y `facts/*` son byte-idénticos
- **AND** solo cambian los timestamps declarados del manifest
