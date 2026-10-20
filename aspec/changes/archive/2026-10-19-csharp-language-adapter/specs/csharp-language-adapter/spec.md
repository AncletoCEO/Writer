## ADDED Requirements

## ADDED Requirements

### Requirement: Adapter de C#

The system SHALL incluir archivos `.cs` cuando el language pack está activo y SHALL extraer
`using`, namespaces, clases, structs, records, interfaces, enums, delegates, métodos,
constructores, herencia, llamadas intra-archivo y doc comments XML.

#### Scenario: Using normal, static, alias y global

- **WHEN** un archivo contiene `using System;`, `using static System.Math;`,
  `using A = MyApp.Core.Store;` y `global using MyApp.Services;`
- **THEN** se extraen los cuatro targets
- **AND** `A` se publica como nombre importado

#### Scenario: Namespace block y file-scoped

- **WHEN** un archivo declara `namespace MyApp.Core { ... }` o `namespace MyApp.Core;`
- **THEN** `parse.namespaces` incluye `MyApp.Core`
- **AND** los tipos del namespace se extraen como símbolos

#### Scenario: Clase con base e interfaz

- **WHEN** un archivo contiene `class App : Base, IRunner`
- **THEN** `symbols.json` incluye `App` con `kind: class`
- **AND** se emiten relaciones hacia `Base` e `IRunner`

#### Scenario: Métodos y constructores

- **WHEN** una clase contiene `public void Run()` y `public App()`
- **THEN** ambos se publican como `method` con `owner: App`
- **AND** `Run` conserva su `summary` XML

#### Scenario: Doc comment XML

- **WHEN** una declaración tiene `/// <summary>...</summary>`
- **THEN** el `summary` no incluye los tags XML

### Requirement: Resolución de `using` por namespace

The system SHALL resolver un `using` a todos los archivos del namespace cuando el namespace
existe en el índice global, excluyendo el archivo actual. Los namespaces externos SHALL quedar
externos.

#### Scenario: Namespace local multi-archivo

- **WHEN** `using MyApp.Services;` y dos archivos declaran `namespace MyApp.Services;`
- **THEN** se emiten aristas `import` hacia ambos archivos
- **AND** no se emite una arista hacia el archivo actual

#### Scenario: Namespace externo

- **WHEN** un archivo contiene `using System;` o `using Serilog;` sin archivos locales en ese
  namespace
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

#### Scenario: Alias a un tipo

- **WHEN** un archivo contiene `using Alias = MyApp.Core.Store;` y `Store` no es un namespace
- **THEN** el import queda externo
- **AND** se documenta la limitación

### Requirement: Fallback de C# sin pack

The system SHALL mantener `.cs` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/App.cs` y el pack no está activo
- **THEN** no se emite nodo `lang: csharp`
- **AND** aparece en `facts/unsupported.json`
