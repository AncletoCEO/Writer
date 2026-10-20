## ADDED Requirements

### Requirement: Adapter de Rust

The system SHALL incluir archivos `.rs` cuando el language pack está activo y SHALL extraer
imports, módulos, structs, enums, unions, traits, type aliases, funciones, métodos, impls,
llamadas intra-archivo y doc comments con el mismo formato que los demás adapters.

#### Scenario: Struct, trait e impl

- **WHEN** un archivo contiene `struct App`, `trait Base` e `impl Base for App`
- **THEN** `symbols.json` incluye `App` con `kind: class` y `Base` con `kind: interface`
- **AND** se emite una arista `inherits` de `App` hacia `Base` con
  `inheritsKind: implements`

#### Scenario: Métodos de impl y de trait

- **WHEN** un archivo contiene `impl App { pub fn new() }` y `trait Base { fn run(&self); }`
- **THEN** `new` se publica como `method` con `owner: App`
- **AND** `run` se publica como `method` con `owner: Base`

#### Scenario: Doc comment

- **WHEN** una declaración tiene `///` inmediatamente anterior, con atributos intermedios
- **THEN** el símbolo publica `summary` con la primera línea no vacía del doc comment

#### Scenario: Llamada local

- **WHEN** una función o método llama a otro símbolo local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de módulos Rust

The system SHALL resolver `crate::`, `self::` y `super::` hacia archivos `.rs` o `mod.rs`
dentro del crate, y SHALL resolver `mod foo;` como dependencia del archivo de módulo. Los
crates externos SHALL quedar externos.

#### Scenario: `use crate` con item

- **WHEN** un archivo contiene `use crate::db::Store` y existe `src/db.rs`
- **THEN** se emite una arista `import` hacia `src/db.rs`

#### Scenario: `use super`

- **WHEN** `src/foo/bar.rs` contiene `use super::util::*` y existe `src/foo/util.rs`
- **THEN** se emite una arista `import` hacia `src/foo/util.rs`

#### Scenario: `mod foo;`

- **WHEN** `src/lib.rs` contiene `mod db;` y existe `src/db.rs`
- **THEN** se emite una arista `import` hacia `src/db.rs`

#### Scenario: `mod.rs`

- **WHEN** un import apunta a un módulo implementado en `src/db/mod.rs`
- **THEN** la arista apunta a ese archivo

#### Scenario: crate externo

- **WHEN** un archivo contiene `use std::collections::HashMap` o `use serde::Serialize`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

### Requirement: Fallback de Rust sin pack

The system SHALL mantener `.rs` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/lib.rs` y el pack no está activo
- **THEN** no se emite nodo `lang: rust`
- **AND** aparece en `facts/unsupported.json`
