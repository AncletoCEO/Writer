# Proposal: Go language adapter

> Issue: [#30](https://github.com/AncletoCEO/Writer/issues/30)
> Base: [`aspec/changes/archive/2026-10-19-python-language-adapter/`](../archive/2026-10-19-python-language-adapter/)
> Analysis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation

## Problem

Python ya validó el boundary del language pack. Go es el siguiente lenguaje P1 y tiene una
diferencia estructural importante: los imports apuntan a **paquetes** (directorios), no a un
archivo. El grafo actual asume un target por import, así que hace falta una extensión aditiva
para resolver paquetes a múltiples archivos `.go`.

## Proposed change

- Agregar el adapter `go` a `@ancleto/writer-languages` con `tree-sitter-go`.
- Extraer imports, structs, interfaces, funciones, métodos, embebido, llamadas y doc comments.
- Resolver imports locales usando `go.mod` (`module` + prefijo del path) y devolver todos los
  archivos `.go` del paquete destino (excluyendo `_test.go`).
- Extender el core para aceptar `{ type: 'resolved', targets: [...] }` y emitir una arista por
  target, sin romper el contrato de un solo `target`.
- Mantener `lang: go` aditivo y el core sin dependencias.
- Tests unitarios, integración con `runBuild`, fallback y documentación.

## Scope

In scope: extensión `.go`, parser/resolver Go, doc comments, embebido como relación de
composición, multi-target de imports de paquete, tests y docs.

Out of scope: resolución de `replace`/`vendor`, implementación implícita de interfaces,
genéricos avanzados, type checking, Go modules fuera del root y P2/P3.

## Risks

- **Imports de paquete:** un import puede apuntar a varios archivos; se resuelve con múltiples
  aristas y se documenta que es dependencia de paquete, no de archivo exacto.
- **Embebido:** Go no tiene herencia; se representa como `inherits`/`extends` para reutilizar
  UML, documentado como composición.
- **go.mod ausente o con replace:** los imports locales no se resuelven; quedan externos o
  unresolved según corresponda.
- **Interfaces implícitas:** no se infieren implementaciones; solo se extraen embebidos.
