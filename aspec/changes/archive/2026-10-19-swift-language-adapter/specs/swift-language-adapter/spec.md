## ADDED Requirements

### Requirement: Adapter de Swift

The system SHALL incluir archivos `.swift` cuando el language pack está activo y SHALL extraer
imports, protocolos, clases, structs, enums, actors, extensions, typealiases, funciones,
métodos, inicializadores, deinitializadores, herencia/conformancia, llamadas y doc comments.

#### Scenario: Imports externos

- **WHEN** un archivo contiene `import Foundation` y `import UIKit`
- **THEN** ambos se extraen como imports
- **AND** el resolver los deja externos
- **AND** se incrementa `stats.externalImports`

#### Scenario: Protocolo y conformancia

- **WHEN** un archivo contiene `protocol Runner` y `class App: Base, Runner`
- **THEN** `Runner` se publica con `kind: interface`
- **AND** `App` se publica con `kind: class`
- **AND** el core emite `extends` hacia `Base` e `implements` hacia `Runner` cuando ambos son
  locales

#### Scenario: Struct, enum y actor

- **WHEN** un archivo contiene `struct Point`, `enum Kind` y `actor Worker`
- **THEN** `Point` y `Worker` se publican como `class`
- **AND** `Kind` se publica como `enum`
- **AND** las firmas indican `struct Point`, `enum Kind` y `actor Worker`

#### Scenario: Extensión

- **WHEN** un archivo contiene `extension App: CustomStringConvertible`
- **THEN** sus métodos se publican con `owner: App`
- **AND** no se crea un símbolo nuevo para la extensión

#### Scenario: Visibilidad

- **WHEN** una clase declara métodos `public` y `private`
- **THEN** solo el público se marca `exported: true`

#### Scenario: Doc comment

- **WHEN** una declaración tiene `///` o `/** ... */` anterior
- **THEN** el símbolo publica `summary` con la primera línea útil

#### Scenario: Llamada local

- **WHEN** una función o método llama a otra función/método local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Fallback de Swift sin pack

The system SHALL mantener `.swift` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/App.swift` y el pack no está activo
- **THEN** no se emite nodo `lang: swift`
- **AND** aparece en `facts/unsupported.json`
