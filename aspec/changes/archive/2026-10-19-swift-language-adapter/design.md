# Design: Swift language adapter

## Approach

El adapter Swift no resuelve imports locales; el resto del grafo es equivalente al de los
otros adapters. No requiere cambios de core.

## Parser Swift

### Imports

- `import Foundation` / `import UIKit` → specifier, `kind: static`; el resolver devuelve
  `external`.
- No se emiten aristas de import; se cuentan en `stats.externalImports`.

### Detección de declaración

El grammar usa `class_declaration` para:

- `class`
- `struct`
- `enum` (con `enum_class_body`)
- `actor`
- `extension` (con `user_type` en lugar de `type_identifier`)

Se toma la primera keyword de `class|struct|enum|actor|extension` del texto del nodo.

### Símbolos

| Swift | `kind` | Notas |
|---|---|---|
| `protocol X` | `interface` | métodos `protocol_function_declaration` |
| `class X` | `class` | |
| `struct X` | `class` | `signature: struct X` |
| `actor X` | `class` | `signature: actor X` |
| `enum X` | `enum` | |
| `extension X` | — | no crea símbolo; métodos con `owner: X` |
| `typealias X` | `type` | |
| `func f` | `function`/`method` | `owner` si está en tipo |
| `init` | `method` | `signature: init(params)` |
| `deinit` | `method` | `signature: deinit()` |

- `exported`: `public`/`open`; protocolos exportados propagan a sus métodos.
- `summary`: `///`/`//!` o bloque `/** ... */` anterior; se saltean atributos `@...`.
- `signature`: `name(params)`; los parámetros se reconstruyen desde nodos `parameter`.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Herencia y conformancia

- `inheritance_specifier` de clases/protocolos/extensions.
- Todos los padres se emiten con `implements: false`; el core convierte a `implements` si el
  símbolo padre local es `interface` (protocolo).

### Llamadas

- `call_expression` con `simple_identifier` o `navigation_expression` (`obj.run` → `run`).
- Solo se emiten si el callee coincide con una función/método local.
- Caller por rango de offsets.

## Resolver Swift

Todos los `import` → `external`. La resolución de módulos SwiftPM queda fuera de alcance.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `swift`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: swift`.
- `@ancleto/writer-languages` agrega `tree-sitter-swift` como dependency.
- El core sigue sin `dependencies`.

## Carga del grammar y peers

`tree-sitter-swift@0.7.1` tiene peer `tree-sitter@^0.22.1`. El root agrega:

```json
"overrides": {
  "tree-sitter-swift": {
    "tree-sitter": "0.25.1"
  }
}
```

npm instala el pack con `tree-sitter@0.25.1` anidado y deja una copia 0.22.4 para peers viejos.
El adapter usa el `tree-sitter` del pack. Se documenta el conflicto para la release.

## Validation

- Unit: imports externos, protocolos, clases/structs/enums/actors, extensions, typealiases,
  métodos/init/deinit, visibilidad, herencia/conformancia, summaries y llamadas.
- Integración: build con protocolo/clase/local; `implements` por protocolo; API/UML.
- Fallback: pack deshabilitado mantiene `.swift` unsupported.
- Regresión: 185 tests previos + lint + check-syntax.
