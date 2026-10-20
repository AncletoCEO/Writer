# Design: Rust language adapter

## Approach

El adapter Rust reutiliza el boundary del pack. No requiere cambios de core: cada import
resuelve a un archivo de módulo (`.rs` o `mod.rs`), y `mod foo;` se modela como un import
`self::foo`.

## Parser

### Imports

Se aplana el árbol de `use`:

- `use std::collections::HashMap` → specifier `std::collections::HashMap`, nombre `HashMap`.
- `use crate::db::{Store, Connection as Conn}` → dos imports:
  `crate::db::Store` (Store) y `crate::db::Connection` (Conn).
- `use super::util::*` → specifier `super::util`, wildcard.
- `use self::inner::Thing` → specifier `self::inner::Thing`, nombre `Thing`.
- `use crate::db::{self, Store}` → `crate::db` (nombre `db`) y `crate::db::Store`.
- `mod foo;` → import `self::foo` (dependencia de archivo); `mod foo { ... }` inline no genera
  import y sus items se recorren.

`use` con `crate`/`self`/`super` es local; cualquier otro primer segmento es externo.

### Símbolos

| Rust | `kind` | Notas |
|---|---|---|
| `struct X` | `class` | `signature: struct X` |
| `enum X` | `enum` | `signature: enum X` |
| `union X` | `class` | `signature: union X` |
| `trait X` | `interface` | métodos del trait como `method` |
| `type X = ...` | `type` | alias |
| `fn f` | `function` | top-level/módulo |
| `fn (r) m` en `impl` | `method` | `owner` = tipo |
| `fn m` en trait | `method` | `owner` = trait |

- `exported`: presencia de `visibility_modifier` (`pub`, `pub(crate)`); métodos de trait se
  marcan exportados si el trait lo está; métodos de `impl Trait for Type` se marcan exportados.
- `summary`: `///`/`//!` inmediatamente anteriores, salteando atributos `#[...]`.
- `signature`: `name(params) -> ret` para funciones/métodos; `struct/enum/trait/union/type
  Name` para tipos.
- Items dentro de `mod` inline se recorren recursivamente; no se prefija el nombre del módulo.

### Relaciones

- `impl Trait for Type` → `inheritance` con `child: Type`, `parent: Trait`,
  `implements: true`.
- `trait Child: Base` → `inheritance` con `child: Child`, `parent: Base`,
  `implements: true`.
- `impl Type` solo aporta métodos; no genera herencia.
- La confianza y resolución final las decide `buildGraph` con los símbolos locales/importados.

### Llamadas

- `call_expression`:
  - `identifier` → función local;
  - `scoped_identifier` → último segmento (`foo::bar` → `bar`);
  - `field_expression` → campo (`obj.method()` → `method`).
- Solo se emiten si el callee coincide con un símbolo local.
- Caller por rango de offsets.

## Resolver

Contexto:

- `crateRootDir = <root>/src` si existe; si no, `<root>`.
- `currentModuleDir`:
  - `lib.rs`/`main.rs` → `crateRootDir`;
  - `.../mod.rs` → su directorio;
  - `.../foo.rs` → `.../foo` (directorio de hijos del módulo `foo`).
- `crate::` empieza en `crateRootDir`.
- `self::` empieza en `currentModuleDir`.
- `super::` sube desde `currentModuleDir`; si sale del crate → `outside-root`.
- Otros prefijos → `external`.

Para los segmentos restantes:

1. Probar el path completo como módulo: `<base>.rs` o `<base>/mod.rs`.
2. Si no existe, quitar el último segmento (probablemente un item) y reintentar.
3. Sin candidatos → `unresolved` (`not-found`).
4. Más de un candidato → `unresolved` (`ambiguous`).
5. `crate` sin segmentos → `lib.rs` (preferido) o `main.rs`.

`#[path]`, workspaces y layouts fuera de `src` quedan documentados como límite. Un
`use crate::Item` de un solo segmento se resuelve al módulo raíz (`lib.rs`/`main.rs`); no se
valida que el item exista.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `rust`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: rust`.
- `@ancleto/writer-languages` agrega `tree-sitter-rust` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: `use` simple/agrupado/alias/wildcard/self, `mod`, structs/enums/traits/types,
  impls, trait methods, supertraits, calls, doc comments.
- Resolver: crate/self/super, `.rs` vs `mod.rs`, item leaf, missing, external.
- Integración: `runBuild` con repo Rust; `graph.json`, `symbols.json`, `API.md`, `UML.md`,
  `facts/unsupported.json`.
- Fallback: pack deshabilitado mantiene `.rs` unsupported.
- Regresión: 157 tests previos + lint + check-syntax.
