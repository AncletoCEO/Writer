# Design: Java language adapter

## Approach

El adapter Java reutiliza el índice global de namespaces/packages del core. Cada archivo
publica su package en `parse.namespaces`; `buildGraph` construye `package -> [files]` y se lo
pasa a `resolveImport`. No hacen falta cambios adicionales de core.

## Parser Java

### Package e imports

- `package com.example.app;` → `namespaces: ['com.example.app']`.
- `import java.util.List;` → specifier `java.util.List`, nombre `List`.
- `import static com.example.util.Utils.helper;` → specifier completo, nombre `helper`.
- `import com.example.db.*;` → specifier `com.example.db`, wildcard, sin nombre.
- `import` dentro de archivos con package se extrae igual.

### Símbolos

| Java | `kind` | Notas |
|---|---|---|
| `class X` | `class` | |
| `record X` | `class` | `signature: record X` |
| `interface X` | `interface` | métodos con `owner: X` |
| `@interface X` | `interface` | `signature: @interface X` |
| `enum X` | `enum` | |
| método | `method` | `owner` = tipo |
| constructor | `method` | `owner` = tipo, `signature: Tipo(params)` |

- `exported`: modificador `public`; métodos de interfaz son públicos por definición.
- `summary`: Javadoc `/** ... */` (o `//`) anterior; se quitan `*`, tags `@param`/`@return` y
  se toma la primera línea no vacía. Se saltean anotaciones `@Override`.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Herencia

- `class Child extends Base implements I1, I2`:
  - `Base` → `implements: false` (el core lo deja `extends` si es clase);
  - `I1`, `I2` → `implements: true`.
- `interface IChild extends I1, I2` → `implements: true` para cada padre.
- `record`/`enum` con `implements` → `implements: true`.
- El core refina a `implements` si el padre local es una interfaz.

### Llamadas

- `method_invocation` con `name`:
  - `helper(x)` → `helper`;
  - `obj.run()` → `run`.
- Solo se emiten si el callee coincide con un método local.
- Caller por rango de offsets.

## Resolver Java

Dado `import com.example.db.Store;` y el índice:

```text
com.example.db -> [Repo.java, Store.java]
```

1. Probar `com.example.db.Store` (no existe como package).
2. Probar `com.example.db` (existe) → targets `Repo.java`, `Store.java`.
3. Excluir el archivo actual.
4. Si no hay package conocido en ningún prefijo → `external`.

Para `import static ...Utils.helper`, se quitan dos segmentos hasta `com.example.util`.
Para `com.example.db.*`, el specifier ya es el package exacto.

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `java`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: java` y la resolución por package.
- `@ancleto/writer-languages` agrega `tree-sitter-java` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: package, imports normal/static/wildcard, clases/interfaces/enums/records/anotaciones,
  métodos/constructores, herencia, Javadoc y llamadas.
- Resolver: import de clase → package multi-archivo, static → package, wildcard, externo,
  auto-exclusión.
- Integración: build con packages locales; aristas a todos los archivos del package;
  `extends` vs `implements`; `API.md`, `UML.md`, `unsupported`.
- Fallback: pack deshabilitado mantiene `.java` unsupported.
- Regresión: 165 tests previos + lint + check-syntax.
