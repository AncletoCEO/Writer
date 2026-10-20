# Proposal: Swift language adapter

> Issue: [#38](https://github.com/AncletoCEO/Writer/issues/38)
> Base: [`aspec/changes/archive/2026-10-19-ruby-language-adapter/`](../archive/2026-10-19-ruby-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

Swift declara clases, structs, enums y extensions con el mismo nodo
`class_declaration`, y usa `import` a nivel de módulo. Sin configuración de SwiftPM no hay una
relación fiable módulo↔archivo, así que los imports se reportan como externos. La conformancia
usa la misma sintaxis que la herencia (`: Base, Protocol`), y el core ya distingue por el tipo
del padre local.

## Proposed change

- Agregar el adapter `swift` a `@ancleto/writer-languages` con `tree-sitter-swift`.
- Distinguir `class`/`struct`/`enum`/`actor`/`extension` por la keyword del nodo.
- Extraer protocolos, clases, structs, enums, extensions, typealiases, funciones, métodos,
  inicializadores, deinitializadores, herencia/conformancia, llamadas y doc comments.
- Publicar protocolos como `interface` y clases/structs/actors como `class`; enums como `enum`.
- Tratar los `import` como externos y contarlos en `facts/externals.json`.
- Mantener `lang: swift` aditivo y el core sin dependencias.

## Scope

In scope: extensión `.swift`, parser, herencia/conformancia, extensions, tests y docs.

Out of scope: resolución de módulos SwiftPM, type checking, macros, property wrappers,
`@objc`, `class << self`, y P3.

## Risks

- **Peer conflict:** `tree-sitter-swift@0.7.1` declara peer `tree-sitter@^0.22.1`; se fuerza
  `0.25.1` con `overrides` en el root y se valida en Node 24. El layout de npm anida versiones.
- **Imports externos:** no se emiten aristas de import para Swift; solo `stats.externalImports`.
- **Extensions:** aportan métodos al tipo pero no crean un símbolo; si el tipo está en otro
  archivo, el método queda con `owner` pero sin clase local para UML.
- **Nodo compartido:** `class_declaration` se usa para struct/enum/extension; se detecta por la
  keyword inicial.
