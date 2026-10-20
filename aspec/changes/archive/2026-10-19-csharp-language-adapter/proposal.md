# Proposal: C# language adapter

> Issue: [#33](https://github.com/AncletoCEO/Writer/issues/33)
> Base: [`aspec/changes/archive/2026-10-19-rust-language-adapter/`](../archive/2026-10-19-rust-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

C# organiza el código por **namespaces**, no por archivos: un `using MyApp.Services;` puede
apuntar a varios archivos y no existe una relación 1:1 entre namespace y path. El resolver
actual recibe imports mientras parsea archivo por archivo, así que no puede saber qué archivos
pertenecen a un namespace hasta haber parseado el repo completo.

## Proposed change

- Agregar el adapter `csharp` a `@ancleto/writer-languages` con `tree-sitter-c-sharp`.
- Extraer `using` (normal, `static`, alias, `global`), namespaces (block y file-scoped),
  clases, interfaces, structs, records, enums, delegates, métodos, constructores, herencia,
  llamadas y doc comments XML.
- Construir un **índice de namespaces** en `buildGraph` después de parsear todos los archivos,
  y pasarlo a los adapters para resolver `using` a todos los archivos del namespace.
- Refinar `inheritsKind`: si el padre local es `interface`, la arista es `implements` aunque
  la sintaxis no lo distinga.
- Mantener `lang: csharp` aditivo y el core sin dependencias.

## Scope

In scope: extensión `.cs`, parser/resolver C#, índice de namespaces, herencia, tests y docs.

Out of scope: resolución semántica de tipos, alias a tipos, `using static` a miembros,
partial classes con merge de símbolos, Razor, source generators, proyectos `.csproj` y P3.

## Risks

- **Namespace vs archivo:** un namespace se resuelve a todos sus archivos; las aristas son de
  dependencia de namespace, no de tipo exacto.
- **Alias a tipos:** `using Alias = MyApp.Core.Store;` solo resuelve si `Store` es un
  namespace; si es un tipo, queda externo. Se documenta.
- **Grammar ESM con top-level await:** `tree-sitter-c-sharp@0.23.5` no se puede cargar con
  `require(esm)`; se carga el binding prebuilt con un shim CJS (`node-gyp-build`).
- **Herencia:** C# no distingue base class de interfaz en la sintaxis; se usa el símbolo local
  para decidir `extends` vs `implements`.
