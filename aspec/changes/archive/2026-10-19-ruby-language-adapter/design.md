# Design: Ruby language adapter

## Approach

El adapter Ruby es path-based para `require_relative`; no necesita el índice de namespaces.
No requiere cambios de core.

## Parser Ruby

### Requires

- `require 'json'` → specifier `json`, `relative: false`; el resolver lo deja externo.
- `require_relative 'lib/base'` → specifier `lib/base`, `relative: true`.
- `require_relative '../shared'` → relativo al archivo actual.
- Un `require_relative` no literal se registra como `unresolved` (`non-literal`).

### Símbolos

| Ruby | `kind` | Notas |
|---|---|---|
| `class X` | `class` | `signature: class X` |
| `module M` | `class` | `signature: module M` |
| `def m` | `method`/`function` | `owner` si está en clase/módulo |
| `def self.m` | `method`/`function` | owner si está en clase/módulo |
| `def initialize` | `method` | constructor |

- `exported`: métodos `public` (default); `private`/`protected` no. Funciones top-level
  públicas.
- `summary`: comentarios `#` inmediatamente anteriores; se saltean
  `frozen_string_literal`, `encoding:` y `rubocop:`.
- `signature`: `name(params)`; sin params → `name()`.

### Herencia y mixins

- `class X < Base` → `inheritance` con `implements: false`.
- `include M`, `extend M`, `prepend M` → `inheritance` con `implements: true`; el módulo se
  publica como `class` (`module M`), así que el core emite `implements`.
- `include`/`extend` múltiples se emiten como entradas separadas; el grafo deduplica aristas.

### Visibilidad

- `private`, `protected`, `public` sin argumentos cambian la visibilidad de los métodos
  siguientes en el mismo body.
- `private :foo` con argumentos no se resuelve por método.

### Llamadas

- `call` con `method` field; `require`/`include` no coinciden con métodos locales.
- Solo se emiten si el callee coincide con una función/método local.
- Caller por rango de offsets.

## Resolver Ruby

Para `require_relative`:

1. `<dir del archivo>/<specifier>`
2. `<dir del archivo>/<specifier>.rb` si no termina en `.rb`

Primer archivo existente; fuera del root → `outside-root`; sin archivo → `not-found`.
Para `require` → `external`.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `ruby`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: ruby`.
- `@ancleto/writer-languages` agrega `tree-sitter-ruby` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: require/require_relative, clases/módulos, mixins, métodos, visibilidad, summaries y
  llamadas.
- Resolver: relativo directo, `.rb` implícito, `../`, externo, missing.
- Integración: build con `require_relative`, herencia y mixin; API/UML.
- Fallback: pack deshabilitado mantiene `.rb` unsupported.
- Regresión: 181 tests previos + lint + check-syntax.
