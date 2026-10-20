# Design: Go language adapter

## Approach

El adapter Go vive en el mismo paquete que Python y reutiliza el contrato
`{ id, extensions, parse(), resolveImport() }`. La única extensión de core es permitir que un
import resuelto devuelva varios targets, porque un import de Go referencia un paquete completo.

## Core: imports multi-target

`resolveImports` acepta:

```js
{ type: 'resolved', target: 'pkg/a.go' }
// o
{ type: 'resolved', targets: ['pkg/a.go', 'pkg/b.go'] }
```

En el segundo caso emite una entrada `resolved` por target, ordenada y deduplicada. El graph
existente ya convierte cada entrada en una arista `import`, así que no cambia el contrato de
`graph.json`. El adapter de Python sigue usando `target`.

## Go parser

Parser tree-sitter reutilizado por adapter.

### Imports

- `import "fmt"` → specifier `fmt`.
- `import alias "example.com/app/db"` → specifier `example.com/app/db`, imported name `alias`.
- `import _ "embed"` → import externo, sin nombre importado.
- `import . "pkg"` → import externo/local con nombre `.`; se agrega el último segmento como
  nombre importado si aplica.
- `import_spec_list` agrupa varios `import_spec`.

### Símbolos

| Go | `kind` | Notas |
|---|---|---|
| `type X struct` | `class` | `signature: type X struct` |
| `type X interface` | `interface` | `signature: type X interface` |
| otro `type X` | `type` | alias/tipos no estructurales |
| `func F` | `function` | top-level |
| `func (r *T) M` | `method` | `owner: T` |
| `method_elem` en interfaz | `method` | `owner: X`, sin body |

- `exported`: primer carácter ASCII en mayúscula.
- `summary`: comentarios `//` inmediatamente anteriores; se toma la primera línea no vacía.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para resolver el caller.
- `signature`: `Name(params) result` para funciones/métodos; `type Name struct|interface` para
  tipos.

### Embebido

- Struct: `field_declaration` sin `name` → tipo embebido (`Base`, `*alias.Store`). Se usa el
  nombre base (`Base`, `alias.Store`) como `parent`.
- Interface: `type_elem` → interfaz embebida (`io.Reader`).
- Se emite `inheritance` con `implements: false`; se documenta como composición/embebido, no
  herencia clásica. La confianza la ajusta `buildGraph` según el símbolo local/importado.

### Llamadas

- `call_expression` con `function`:
  - `identifier` → función local;
  - `selector_expression` → último campo (`obj.Method()` → `Method`).
- Solo se emiten si el callee coincide con un símbolo local (función/método/type).
- Caller por rango de offsets, igual que Python.

## Go resolver

- Lee `go.mod` una vez por root (cache en el adapter):
  - `module example.com/app`.
- Import `example.com/app/internal/db` → directorio `root/internal/db`.
- Import exactamente `example.com/app` → root.
- Cualquier otro path → `external` (stdlib/third-party).
- En el directorio destino: `.go` files, ordenados, excluyendo `_test.go`.
- Sin archivos → `unresolved` (`not-found`).
- Fuera del root → `unresolved` (`outside-root`).
- `replace`/`vendor` no se resuelven en este change.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `go`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: go` y la resolución de paquetes.
- `@ancleto/writer-languages` agrega `tree-sitter-go` como dependency propia.
- El core sigue sin `dependencies`.

## Validation

- Unit tests: imports (single/grouped/alias/blank), structs/interfaces, embedded, funciones,
  métodos, interfaces methods, calls, summaries.
- Resolver: `go.mod`, root module, subpackage, external, missing package.
- Integración: `runBuild` con un repo Go; `graph.json`, `symbols.json`, `API.md`, `UML.md`,
  `facts/unsupported.json`; una arista por archivo del paquete importado.
- Fallback: sin pack o `languagePack.enabled=false`, `.go` sigue unsupported.
- Regresión: 152 tests previos + lint + check-syntax.
