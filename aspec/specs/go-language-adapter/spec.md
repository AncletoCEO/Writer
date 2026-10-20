# Spec: go-language-adapter

## Purpose

Define el adapter de Go del language pack opcional: descubrimiento de `.go`, parsing de
imports, tipos, funciones, métodos, embebido, llamadas y doc comments, y resolución de imports
locales mediante `go.mod` con soporte de paquetes multi-archivo.

## Requirements

### Requirement: Adapter de Go

The system SHALL incluir archivos `.go` cuando el language pack está activo y SHALL extraer
imports, structs, interfaces, tipos, funciones, métodos, embebido, llamadas intra-archivo y doc
comments con el mismo formato que los demás adapters.

#### Scenario: Struct, interfaz y métodos

- **WHEN** un archivo contiene `type App struct { Base }` y `func (a *App) Run()`
- **THEN** `symbols.json` incluye `App` con `kind: class` y `Run` con `kind: method` y
  `owner: App`
- **AND** `Base` aparece como relación de embebido
- **AND** una interfaz se publica con `kind: interface` y sus métodos como `kind: method`

#### Scenario: Doc comment

- **WHEN** una declaración tiene un comentario `//` inmediatamente anterior
- **THEN** el símbolo publica `summary` con la primera línea no vacía del comentario

#### Scenario: Llamada local

- **WHEN** una función o método llama a otro símbolo local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de imports Go

The system SHALL resolver imports que empiezan con el `module` de `go.mod` hacia el directorio
del paquete dentro del root, y SHALL emitir una arista por cada archivo `.go` no-test del
paquete destino. Los imports de stdlib/third-party SHALL quedar externos.

#### Scenario: Paquete local multi-archivo

- **WHEN** `go.mod` declara `module example.com/app` y un archivo importa
  `example.com/app/internal/db`
- **AND** `internal/db` contiene `db.go` y `store.go`
- **THEN** se emiten aristas `import` hacia ambos archivos
- **AND** no se emite arista hacia archivos `_test.go`

#### Scenario: Paquete externo

- **WHEN** un archivo importa `fmt` o `github.com/acme/lib`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

#### Scenario: Paquete local inexistente

- **WHEN** un import empieza con el module path pero el directorio no existe o no tiene `.go`
- **THEN** se registra en `facts/unresolved.json` con `reason: not-found`

### Requirement: Fallback de Go sin pack

The system SHALL mantener `.go` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `main.go` y el pack no está activo
- **THEN** no se emite nodo `lang: go`
- **AND** aparece en `facts/unsupported.json`
