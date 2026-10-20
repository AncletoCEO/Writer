# Tasks: Rust language adapter

> Change de implementación. Issue [#31](https://github.com/AncletoCEO/Writer/issues/31).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-rust@0.24.0` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar `use`, `mod`, `impl`, `trait`, funciones y doc comments.
- [x] Definir resolución `crate`/`self`/`super` y `.rs`/`mod.rs`.

## Fase 1 — Adapter Rust

- [x] Crear `packages/writer-languages/src/rust.js`.
- [x] Aplanar `use` (simple, agrupado, alias, wildcard, `self`).
- [x] Extraer `mod` inline y `mod foo;` como import.
- [x] Extraer structs, enums, unions, traits, type aliases y funciones.
- [x] Extraer métodos de `impl`, métodos de trait y `impl Trait for Type`.
- [x] Extraer supertraits, llamadas intra-archivo y doc comments.
- [x] Implementar resolver de módulos.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-rust` a dependencies del pack.

## Fase 2 — Integración y contrato

- [x] Agregar `rust` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.rs` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Rust.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver Rust.
- [x] Integración `runBuild` con repo Rust (`crate`, `mod`, `impl`).
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #31 y memoria.
- [x] Archivar el change.
