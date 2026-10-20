# Design: C# language adapter

## Approach

El adapter C# se suma al pack. La diferencia con los anteriores es que `using` referencia
namespaces, así que el core construye un índice global después de parsear todos los archivos y
se lo entrega a los adapters en `resolveImport`. No hay cambios de contrato: `graph.json`
mantiene `schemaVersion: 1` y los `lang` siguen siendo aditivos.

## Core: índice de namespaces

`buildGraph` pasa a dos fases:

1. Parsear todos los archivos y guardar `{ file, parse }`.
2. Construir `namespaceIndex: Map<string, string[]>` con `parse.namespaces` de cada archivo
   (paths ordenados y deduplicados).
3. Resolver imports con el adapter, pasando `namespaces: namespaceIndex`.

Un adapter puede resolver a un solo `target` o a `targets` múltiples; `resolveImports` ya
soporta ambos.

## Core: tipo de herencia

`buildGraph` decide `inheritsKind` así:

```text
implements si inherit.implements === true
o si el símbolo padre local es kind: interface
extends en caso contrario
```

Esto permite que `class App : Base, IRunner` produzca `extends` para `Base` e `implements`
para `IRunner` sin que el parser C# tenga que resolver tipos.

## Parser C#

### Imports

- `using System;` → `System`.
- `using System.Collections.Generic;` → `System.Collections.Generic`.
- `using static System.Math;` → `System.Math`.
- `using Alias = MyApp.Core.Store;` → `MyApp.Core.Store`, nombre importado `Alias`.
- `global using MyApp.Services;` → `MyApp.Services`.
- `using` dentro de un namespace se extrae igual.

### Namespaces

- `namespace MyApp.Core { ... }` → namespace `MyApp.Core`; se recorren sus items.
- `namespace MyApp.Core;` (file-scoped) → namespace `MyApp.Core` para los items siguientes.
- Namespaces anidados → `A`, `A.B`.
- Los namespaces se publican en `parse.namespaces`; no son símbolos.

### Símbolos

| C# | `kind` | Notas |
|---|---|---|
| `class X` | `class` | |
| `struct X` | `class` | `signature: struct X` |
| `record X` | `class` | `signature: record X` |
| `interface X` | `interface` | métodos con `owner: X` |
| `enum X` | `enum` | |
| `delegate` | `type` | `signature: delegate X(params)` |
| método | `method` | `owner` = tipo |
| constructor | `method` | `owner` = tipo, `signature: Tipo(params)` |

- `exported`: modificador `public`; métodos de interfaz heredan la visibilidad de la interfaz.
- `summary`: doc comments XML `///`; se juntan líneas, se quitan tags (`<summary>`) y se toma
  el primer texto no vacío. Se saltean atributos `[...]`.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Herencia

- `base_list` de clases, structs, records e interfaces.
- Cada base genera `inheritance` con `implements: false`; el core lo convierte en
  `implements` si el padre local es una interfaz.
- Clases parciales y tipos externos no se mergean.

### Llamadas

- `invocation_expression` con `function`:
  - `identifier` → función/método local;
  - `member_access_expression` → último nombre (`obj.Run()` → `Run`);
  - `generic_name` → nombre sin argumentos.
- Solo se emiten si el callee coincide con un método local.
- Caller por rango de offsets.

## Resolver C#

```js
using MyApp.Services;
```

- Si `namespaceIndex` tiene `MyApp.Services`, devuelve todos sus archivos, excluyendo el
  archivo actual.
- Si no existe, `external` (BCL/third-party o alias a un tipo).
- Sin targets después de excluir el archivo actual → `external`.

## Carga del grammar

`tree-sitter-c-sharp@0.23.5` es ESM y su wrapper usa **top-level await**, por lo que
`require(esm)` falla con `ERR_REQUIRE_ASYNC_MODULE`. El adapter no importa el wrapper: resuelve
`tree-sitter-c-sharp/package.json`, crea un `require` desde ese paquete y carga el binding
prebuilt con `node-gyp-build`. Así el pack sigue siendo cargable con `require` desde el core.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `csharp`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: csharp`, namespaces y límites.
- `@ancleto/writer-languages` agrega `tree-sitter-c-sharp` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: usings, namespaces block/file-scoped, clases/interfaces/structs/records/enums/delegates,
  métodos/constructores, herencia, summaries XML, llamadas.
- Resolver: namespace exacto, multi-archivo, auto-exclusión, externo.
- Integración: build con namespaces locales; aristas a todos los archivos del namespace;
  `extends` vs `implements`; `API.md`, `UML.md`, `unsupported`.
- Fallback: pack deshabilitado mantiene `.cs` unsupported.
- Regresión: 161 tests previos + lint + check-syntax.
