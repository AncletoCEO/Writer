# Proposal: C language adapter

> Issue: [#34](https://github.com/AncletoCEO/Writer/issues/34)
> Base: [`aspec/changes/archive/2026-10-19-java-language-adapter/`](../archive/2026-10-19-java-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

C no tiene packages ni imports: los headers se cargan con `#include`, y la diferencia entre
`"foo.h"` (búsqueda local) y `<stdio.h>` (system/external) es semántica. El resolver actual
solo recibe el specifier; necesita además el contexto del import (`quoted`) para distinguir
ambos casos.

## Proposed change

- Agregar el adapter `c` a `@ancleto/writer-languages` con `tree-sitter-c`.
- Extraer `#include` quoted/system, structs, typedefs, enums, prototipos, definiciones,
  llamadas y comentarios de documentación.
- Pasar la entrada completa del import a `resolveImport` (aditivo) para exponer `quoted`.
- Resolver includes quoted contra:
  1. el directorio del archivo;
  2. el root;
  3. `<root>/include`;
  y dejar los system includes como externos.
- Mantener `lang: c` aditivo y el core sin dependencias.

## Scope

In scope: extensiones `.c`/`.h`, parser/resolver C, prototipos, structs/typedefs/enums, tests
y docs.

Out of scope: preprocesador/macros, include search paths configurables, compilación real,
cross-file call graph, function pointers complejos y P3.

## Risks

- **Includes:** la búsqueda es determinista pero limitada a tres ubicaciones; headers en otras
  rutas quedan unresolved.
- **Prototipos y definiciones:** se extraen ambos; pueden aparecer símbolos duplicados por
  nombre en archivos distintos.
- **Sin herencia:** C no tiene herencia; no se emiten aristas `inherits`.
- **Exportación:** no hay `public`; se usa `static` para marcar funciones no exportadas.
