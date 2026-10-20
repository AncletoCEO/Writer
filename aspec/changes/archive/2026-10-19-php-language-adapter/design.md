# Design: PHP language adapter

## Approach

El adapter PHP reutiliza el índice de namespaces del core y el soporte multi-target. No
requiere cambios de core.

## Parser PHP

### Namespaces

- `namespace App\Core;` (file-scoped) se publica en `parse.namespaces` y aplica a los items
  siguientes.
- `namespace App\Core { ... }` se registra y se recorren sus items.

### Imports

- `use App\Services\Service;` → specifier completo, nombre `Service`.
- `use App\Contracts\Runner as RunnerContract;` → alias `RunnerContract`.
- `use function App\Util\helper;` → specifier completo, nombre `helper`.
- `use const App\Util\VERSION;` → specifier completo, nombre `VERSION`.
- `use App\Services\{Repo, Cache as C};` → dos imports:
  `App\Services\Repo` y `App\Services\Cache` (alias `C`).
- `use Loggable;` dentro de una clase es trait use, no import de archivo; se ignora para el
  grafo.

### Símbolos

| PHP | `kind` | Notas |
|---|---|---|
| `class X` | `class` | |
| `interface X` | `interface` | métodos con `owner: X` |
| `trait X` | `class` | `signature: trait X` |
| `enum X` | `enum` | |
| método | `method` | `owner` = tipo |
| constructor | `method` | `__construct(...)` |
| función top-level | `function` | |

- `exported`: métodos `public` (default) y funciones top-level; `private`/`protected` no.
- `summary`: docblock `/** ... */` o `//` anterior; se quitan `*`, tags `@...` y se toma la
  primera línea no vacía.
- `line`/`endLine` desde tree-sitter; `startOffset`/`endOffset` para el caller.

### Herencia

- `class X extends Base` → `implements: false`.
- `class X implements I1, I2` → `implements: true`.
- `interface X extends I` → `implements: false`; el core lo convierte a `implements` porque el
  padre local es interfaz.
- `enum X implements I` → `implements: true`.
- Trait use dentro de clase no genera arista.

### Llamadas

- `function_call_expression`, `member_call_expression` y `scoped_call_expression`.
- Callee = `name` (último segmento para `qualified_name`).
- Solo se emiten si el callee coincide con una función/método local.
- Caller por rango de offsets.

## Resolver PHP

Dado `use App\Services\Service;` y el índice:

```text
App\Services -> [Repo.php, Service.php]
```

1. Probar `App\Services\Service` (no es namespace).
2. Probar `App\Services` (existe) → targets.
3. Excluir el archivo actual.
4. Si ningún prefijo es un namespace local → `external`.

El mismo mecanismo cubre `use function`/`use const` (se quita el nombre del miembro) y los
grupos (cada leaf se resuelve por separado).

## Config y contrato

- `ALLOWED_LANGUAGES` agrega `php`.
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: php`.
- `@ancleto/writer-languages` agrega `tree-sitter-php` como dependency.
- El core sigue sin `dependencies`.

## Validation

- Unit: namespaces, use normal/alias/function/const/grupo, clases/interfaces/traits/enums,
  métodos/constructores, herencia, docblocks y llamadas.
- Resolver: clase → namespace multi-archivo, función → namespace, namespace exacto, externo,
  auto-exclusión.
- Integración: build con namespaces locales; aristas a todos los archivos del namespace;
  `extends`/`implements`; `API.md`, `UML.md`, `unsupported`.
- Fallback: pack deshabilitado mantiene `.php` unsupported.
- Regresión: 177 tests previos + lint + check-syntax.
