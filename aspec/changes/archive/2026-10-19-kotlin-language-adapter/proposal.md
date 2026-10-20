# Proposal: Kotlin language adapter

> Issue: [#39](https://github.com/AncletoCEO/Writer/issues/39)
> Base: [`aspec/changes/archive/2026-10-19-swift-language-adapter/`](../archive/2026-10-19-swift-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

Kotlin usa packages e imports fully-qualified, y una clase puede heredar de una superclase y
varios interfaces con la misma sintaxis (`: Base(), IRunner`). El core ya distingue
`extends`/`implements` por el tipo del padre local. El grammar `tree-sitter-kotlin@0.3.8` no
incluye prebuilds para Node 24; se usa `@tree-sitter-grammars/tree-sitter-kotlin@1.1.0`, que sí
los trae.

## Proposed change

- Agregar el adapter `kotlin` a `@ancleto/writer-languages` con
  `@tree-sitter-grammars/tree-sitter-kotlin`.
- Extraer `package`, imports (normal, alias, wildcard), clases, interfaces, objects, enums,
  data/sealed classes, typealiases, funciones, métodos, constructores secundarios, companion
  objects, herencia y llamadas.
- Resolver imports contra el índice de packages con caída iterativa por `.`.
- Mantener `lang: kotlin` aditivo y el core sin dependencias.

## Scope

In scope: extensiones `.kt`/`.kts`, parser/resolver Kotlin, herencia, objects/companions,
tests y docs.

Out of scope: resolución de módulos Gradle/Kotlin Multiplatform, type checking, extension
functions como miembros, properties, expect/actual y P3.

## Risks

- **Grammar alternativo:** se usa `@tree-sitter-grammars/tree-sitter-kotlin@1.1.0` con
  prebuilds para linux-x64, en lugar de `tree-sitter-kotlin` (sin prebuilds para Node 24).
- **Peer conflict:** peer `^0.22.4`; se fuerza `0.25.1` con `overrides` en el root.
- **Package vs archivo:** un import de clase resuelve a todos los archivos del package.
- **Objects/companions:** los `object` son `class`; los métodos de `companion object` se
  atribuyen a la clase contenedora.
