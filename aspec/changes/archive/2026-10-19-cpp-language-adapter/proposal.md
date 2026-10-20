# Proposal: C++ language adapter

> Issue: [#35](https://github.com/AncletoCEO/Writer/issues/35)
> Base: [`aspec/changes/archive/2026-10-19-c-language-adapter/`](../archive/2026-10-19-c-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

C++ comparte los `#include` con C, pero agrega namespaces, clases/structs con métodos,
constructores/destructores, herencia, templates y definiciones out-of-line (`App::run`). El
adapter de C no cubre esa estructura; hace falta un adapter propio con `tree-sitter-cpp`.

## Proposed change

- Agregar el adapter `cpp` a `@ancleto/writer-languages` con `tree-sitter-cpp`.
- Extensiones: `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh`, `.hxx`. `.h` queda asignado a C para no
  romper headers de C.
- Extraer `#include` quoted/system, namespaces, clases/structs/unions, enums, templates,
  métodos, constructores, destructores, herencia, llamadas y comentarios.
- Respetar `public`/`private`/`protected` en métodos definidos dentro de la clase; atribuir
  definiciones out-of-line a su clase.
- Reutilizar la resolución de headers de C (directorio, root, `include/`; system externo).
- Mantener `lang: cpp` aditivo y el core sin dependencias.

## Scope

In scope: extensiones C++, parser/resolver, métodos/constructores/destructores, herencia,
templates, tests y docs.

Out of scope: semántica de templates, sobrecarga/ADL, preprocesador/macros, include paths
configurables, compilación real y P3.

## Risks

- **`.h` ambiguo:** se mantiene en C; los headers C++ deben usar `.hpp`/`.hh`/`.hxx`.
- **Acceso:** las definiciones out-of-line no llevan sección de acceso; se asumen públicas.
- **Templates:** se procesa el tipo/función interna, sin resolver parámetros ni
  especializaciones.
- **Herencia múltiple:** todas las bases se emiten como `extends`; C++ no tiene interfaces.
