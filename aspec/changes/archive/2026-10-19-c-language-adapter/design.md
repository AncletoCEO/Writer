# Design: C language adapter

## Approach

El adapter C se suma al pack. La única extensión de core es pasar la entrada del import a
`resolveImport`, porque el adapter necesita saber si el include fue quoted o system.

## Core: contexto del import

`resolveImports` llama:

```js
resolve(entry.specifier, file.absPath, entry)
```

y `buildGraph` entrega `importEntry` al adapter. Los adapters existentes lo ignoran. No cambia
el contrato de `graph.json` ni el `schemaVersion`.

## Parser C

### Includes

- `#include "foo.h"` → specifier `foo.h`, `quoted: true`.
- `#include <stdio.h>` → specifier `stdio.h`, `quoted: false`.
- `#include "sub/bar.h"` → specifier `sub/bar.h`, `quoted: true`.

### Símbolos

| C | `kind` | Notas |
|---|---|---|
| `struct X { ... }` | `class` | `signature: struct X` |
| `typedef struct { ... } X` | `class` | `signature: typedef struct X` |
| `typedef struct Y { ... } X` | `class` + `type` | struct `Y` y alias `X` si difieren |
| `enum X { ... }` | `enum` | |
| `typedef ... X` | `type` | alias no estructural |
| `int f(...)` (prototipo) | `function` | |
| `int f(...) { ... }` | `function` | `exported: false` si `static` |

- `summary`: bloque `/* ... */` o `/** ... */` o líneas `//` inmediatamente anteriores.
- `exported`: funciones sin `static`; structs/enums/typedefs siempre.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.
- No se extraen campos de structs ni enumeradores.

### Llamadas

- `call_expression` con `function`:
  - `identifier` → función local;
  - `field_expression` → último nombre.
- Solo se emiten si el callee coincide con una función local.
- Caller por rango de offsets.

## Resolver C

Para un include quoted:

1. `<dir del archivo>/<specifier>`
2. `<root>/<specifier>`
3. `<root>/include/<specifier>`

Se usa el primer archivo existente. Si el target cae fuera del root → `outside-root`. Si no
existe en ninguna ubicación → `not-found`.

Para includes system (`<...>`) → `external`.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `c`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: c` y los límites de headers.
- `@ancleto/writer-languages` agrega `tree-sitter-c` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: includes quoted/system, structs/typedefs/enums, prototipos/definiciones, static,
  summaries y llamadas.
- Resolver: mismo directorio, subdirectorio, root, `include/`, system, missing.
- Integración: build con headers y `.c`; aristas de includes; structs/prototipos en API;
  `unsupported`.
- Fallback: pack deshabilitado mantiene `.c`/`.h` unsupported.
- Regresión: 169 tests previos + lint + check-syntax.
