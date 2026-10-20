# Design: C++ language adapter

## Approach

El adapter C++ reutiliza la resolución de headers y el contexto `importEntry.quoted` ya
introducidos para C. No requiere cambios de core.

## Parser C++

### Includes

- `#include "base.hpp"` → quoted; se resuelve contra directorio, root e `include/`.
- `#include <iostream>` → system/external.

### Símbolos

| C++ | `kind` | Notas |
|---|---|---|
| `class X` / `struct X` / `union X` | `class` | `signature: class/struct/union X` |
| `enum X` / `enum class X` | `enum` | |
| `using X = ...` / `typedef ... X` | `type` | |
| función libre | `function` | `exported: false` si `static` |
| método/prototipo en clase | `method` | `owner` = clase |
| definición out-of-line `X::m` | `method` | `owner` = `X` |
| constructor/destructor | `method` | `signature: X(...)` / `~X(...)` |

- `exported`: métodos en sección `public`; definiciones out-of-line se asumen públicas;
  funciones libres sin `static`.
- `summary`: comentario `/** ... */`, `/* ... */` o `//` anterior.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Namespaces, templates y linkage

- `namespace X { ... }` se recorre; no se prefija el nombre de los símbolos.
- `template <...> class/function` se procesa el elemento interno.
- `extern "C" { ... }` y bloques `#ifdef` se recorren.

### Herencia

- `base_class_clause` de clases/structs: se extraen los tipos base; se omiten
  `access_specifier`/`virtual`.
- Todas las bases se emiten con `implements: false`; el core las deja `extends`.

### Llamadas

- `call_expression` con `function`:
  - `identifier`, `qualified_identifier` (último segmento), `field_expression`,
    `template_function`.
- Solo se emiten si el callee coincide con una función/método local.
- Caller por rango de offsets.

## Resolver C++

Igual que C:

1. `<dir del archivo>/<specifier>`
2. `<root>/<specifier>`
3. `<root>/include/<specifier>`

System includes → `external`; missing quoted → `not-found`.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `cpp`.
- Extensiones `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh`, `.hxx`; `.h` sigue en C.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: cpp`.
- `@ancleto/writer-languages` agrega `tree-sitter-cpp` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: includes, namespaces, clases/structs, enums, templates, métodos, constructores,
  destructores, herencia, summaries y llamadas.
- Resolver: mismo directorio, subdirectorio, root, `include/`, system, missing.
- Integración: build con headers y fuentes; aristas de includes; herencia; API/UML.
- Fallback: pack deshabilitado mantiene `.cpp`/`.hpp` unsupported.
- Regresión: 173 tests previos + lint + check-syntax.
