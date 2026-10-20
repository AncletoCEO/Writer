# Design: Kotlin language adapter

## Approach

El adapter Kotlin reutiliza el índice de namespaces/packages del core. No requiere cambios de
core.

## Parser Kotlin

### Package e imports

- `package com.example.app` → `parse.namespaces` incluye `com.example.app`.
- `import com.example.services.Service` → specifier completo, nombre `Service`.
- `import com.example.contracts.Runner as RunnerContract` → alias.
- `import com.example.db.*` → specifier `com.example.db`, wildcard, sin nombre.

### Símbolos

| Kotlin | `kind` | Notas |
|---|---|---|
| `class X` | `class` | |
| `data class X` | `class` | |
| `sealed class X` | `class` | |
| `interface X` | `interface` | métodos con `owner: X` |
| `object X` | `class` | `signature: object X` |
| `enum class X` | `enum` | |
| `fun f` | `function`/`method` | `owner` si está en tipo |
| `constructor(...)` | `method` | `signature: constructor(...)` |
| `companion object` | — | métodos con `owner` de la clase contenedora |
| `typealias X` | `type` | |

- `exported`: default `public`; `private`/`protected`/`internal` no.
- `summary`: KDoc `/** ... */` o `//` anterior; se quitan `*` y tags `@`.
- `signature`: `name(params)`; constructores `constructor(params)`.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Herencia

- `delegation_specifiers` de clases, interfaces, objects y enums.
- `constructor_invocation` (`Base()`) o `user_type` (`IRunner`) → parent.
- Todos se emiten con `implements: false`; el core convierte a `implements` si el padre local
  es `interface`.

### Llamadas

- `call_expression` con `identifier` o `navigation_expression` (`obj.run` → `run`).
- Solo se emiten si el callee coincide con una función/método local.
- Caller por rango de offsets.

## Resolver Kotlin

Dado `import com.example.services.Service` y el índice:

```text
com.example.services -> [Service.kt]
```

1. Probar `com.example.services.Service` (no es package).
2. Probar `com.example.services` (existe) → targets.
3. Excluir el archivo actual.
4. Si ningún prefijo es un package local → `external`.

`import ... *` usa el package exacto; los alias no cambian el target.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `kotlin`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: kotlin`.
- `@ancleto/writer-languages` agrega `@tree-sitter-grammars/tree-sitter-kotlin`.
- El core sigue sin `dependencies`.

## Carga del grammar y peers

`@tree-sitter-grammars/tree-sitter-kotlin@1.1.0` tiene peer `tree-sitter@^0.22.4` y prebuilds.
El root agrega:

```json
"overrides": {
  "@tree-sitter-grammars/tree-sitter-kotlin": {
    "tree-sitter": "0.25.1"
  }
}
```

npm instala el pack con `tree-sitter@0.25.1` anidado y deja 0.22.4 para peers viejos. El adapter
usa el `tree-sitter` del pack.

## Validation

- Unit: package, imports normal/alias/wildcard, clases/interfaces/objects/enums/data/sealed,
  typealias, funciones/métodos/constructores, companion, herencia, summaries y llamadas.
- Resolver: import de clase → package multi-archivo, wildcard, externo, auto-exclusión.
- Integración: build con packages locales; aristas a todos los archivos del package;
  `extends`/`implements`; `API.md`, `UML.md`, `unsupported`.
- Fallback: pack deshabilitado mantiene `.kt`/`.kts` unsupported.
- Regresión: 189 tests previos + lint + check-syntax.
