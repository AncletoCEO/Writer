# Proposal: Rust language adapter

> Issue: [#31](https://github.com/AncletoCEO/Writer/issues/31)
> Base: [`aspec/changes/archive/2026-10-19-go-language-adapter/`](../archive/2026-10-19-go-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation

## Problem

Go validó el boundary del pack y la resolución multi-target. Rust es el siguiente lenguaje P1:
sus imports usan módulos (`use crate::...`, `super`, `self`), los métodos viven en bloques
`impl` y los traits se implementan explícitamente (`impl Trait for Type`). El parser necesita
mapear esa estructura al contrato actual sin agregar dependencias al core.

## Proposed change

- Agregar el adapter `rust` a `@ancleto/writer-languages` con `tree-sitter-rust`.
- Extraer `use`, `mod`, structs, enums, unions, traits, type aliases, funciones, métodos,
  impls, supertraits, llamadas y doc comments `///`.
- Resolver imports locales:
  - `crate::` desde `src/` (o el root si no hay `src/`);
  - `self::` desde el módulo actual;
  - `super::` subiendo niveles;
  - `mod foo;` como dependencia de archivo;
  - candidatos `.rs` y `/mod.rs`.
- Modelar `impl Trait for Type` como arista `inherits`/`implements`.
- Mantener `lang: rust` aditivo y el core sin dependencias.
- Tests unitarios, integración, fallback y documentación.

## Scope

In scope: extensión `.rs`, parser/resolver Rust, doc comments, impls/traits, tests y docs.

Out of scope: macro expansion, type checking, resolución de crates externos, `#[path]`,
workspaces, build scripts y P2/P3.

## Risks

- **Grammar:** `tree-sitter-rust@0.24.0` declara peer `^0.22.1`; se valida contra
  `tree-sitter@0.25.1` en Node 24 y se documenta el resultado.
- **Módulos:** la resolución es estructural (`.rs`/`mod.rs`), no usa `rustc`; `#[path]` y
  layouts atípicos quedan fuera.
- **Traits:** la implementación se extrae de `impl Trait for Type`; no se infieren impls
  implícitas ni blanket impls.
- **Duplicados:** nombres en módulos distintos pueden colisionar en `symbols.json` por nombre;
  las aristas usan el símbolo local determinista.
