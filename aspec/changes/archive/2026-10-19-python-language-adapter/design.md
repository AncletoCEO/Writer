# Design: Python language adapter

## Approach

El core conserva el parser JS/TS y agrega un boundary mínimo para adapters externos. El primer
adapter vive en un paquete workspace separado, `@ancleto/writer-languages`, que declara
`tree-sitter` y `tree-sitter-python` como dependencias propias. El core intenta cargarlo de
forma sincrónica (`createRequire`); si no está instalado, sigue funcionando como hoy.

## Architecture

```text
@ancleto/writer
├── src/languages/registry.js       # carga opcional del pack, mapa extensión → adapter
├── src/scan/scanner.js             # extensiones externas + unsupported
├── src/graph/build.js              # dispatch parser/resolver por lenguaje
└── src/analyze.js                  # carga el pack una vez y lo pasa al scan/graph

@ancleto/writer-languages
├── package.json
└── src/
    ├── index.js                    # export { adapters }
    └── python.js                   # parser + resolver Python
```

### Adapter contract

```js
{
  id: 'python',
  extensions: ['.py', '.pyi'],
  parse({ path, lang, source }) {
    return {
      path,
      lang,
      imports: [{ specifier, kind: 'static', line, confidence: 'extracted' }],
      unresolved: [],
      symbols: [{
        name, kind, exported, owner, summary, line, endLine, signature,
        nameOffset, startOffset, endOffset
      }],
      calls: [{ caller, callerLine, callee, line, confidence: 'inferred' }],
      inheritance: [{ child, parent, line, implements: false, confidence }],
      importedNames: []
    }
  },
  resolveImport({ specifier, fromFileAbs, rootAbs }) {
    return { type: 'resolved', target } | { type: 'external' } |
      { type: 'unresolved', reason, candidates? }
  }
}
```

El contrato es **aditivo**: no cambia `schemaVersion` ni los campos existentes. `lang` pasa a
admitir `python` cuando el pack está activo.

### Carga del pack

- Config nueva: `languagePack: { enabled: true, module: '@ancleto/writer-languages' }`.
- `registry.js` usa `createRequire(import.meta.url)` y captura cualquier error de carga.
- Si el pack falta o falla, devuelve `{ adapters: [], extensions: {} }` y el build sigue.
- Las extensiones del pack se habilitan automáticamente; `languages` sigue filtrando el core.
- `unsupported` se calcula después de aplicar las extensiones: `.py` deja de ser unsupported
  cuando el pack está activo.

### Scanner

`scanRepository` acepta `languageExtensions`. El mapa efectivo es:

```text
LANGUAGE_BY_EXT (core) + languageExtensions (pack)
```

Un archivo se analiza si su lenguaje está en `config.languages` o si pertenece a una extensión
del pack. Si la extensión no está mapeada, se mantiene el reporte de `unsupported`.

### Graph

`buildGraph` recibe `adapters` y construye `adapterById`. Para cada archivo:

- `js|ts|jsx|tsx` → `parseJavaScript` + resolver JS/TS existente.
- `python` → `adapter.parse` + `adapter.resolveImport`.
- Cualquier otro lenguaje sin adapter se ignora (no debería llegar desde el scanner).

La resolución de imports reutiliza `resolveImports`; solo cambia la función `resolve`. Las
aristas, símbolos, llamadas y herencia usan el mismo pipeline y formato.

### Python parser

- Parser tree-sitter reutilizado por adapter; `parse()` es sincrónico.
- Imports:
  - `import a.b as c` → specifier `a.b`, imported name `c` (o `a`).
  - `from .mod import X as Y` → specifier `.mod`, imported name `Y`.
  - `from __future__ import ...` → externo por el resolver.
  - `importlib.import_module(...)` no se resuelve (fuera de alcance).
- Símbolos:
  - clases top-level (`kind: class`), funciones top-level (`kind: function`).
  - métodos dentro de clases (`kind: method`, `owner`).
  - `exported`: top-level y nombre sin `_` inicial; métodos `false`.
  - `summary`: primer docstring de la clase/función.
  - decoradores: se usa la definición decorada; el rango empieza en el decorador.
- Herencia: cada base de `class Child(Base, mixin.Base)` con `implements: false`; la confianza
  se ajusta en `buildGraph` según símbolos locales/importados.
- Llamadas: `call` con función `identifier` o `attribute`; solo se emiten si el nombre calza con
  un símbolo local. El caller se busca por rango de offsets.

### Python resolver

- Relativo: `from . import x` (nivel 1), `from ..pkg import y` (nivel 2), contando puntos.
  - Candidatos: `<base>/<resto>.py`, `<base>/<resto>.pyi`,
    `<base>/<resto>/__init__.py`, `<base>/<resto>/__init__.pyi`.
  - Si el resto está vacío, el target es `<base>/__init__.py(i)`.
- Absoluto: `<root>/<specifier>.py(i)` o `<root>/<specifier>/__init__.py(i)`.
- Si no existe en el root → `external` (stdlib/third-party).
- Varios candidatos → `unresolved` con `reason: ambiguous`.
- Fuera del root → `unresolved` con `reason: outside-root`.

### Config y contrato

- `ALLOWED_LANGUAGES` agrega `python`.
- `languagePack` se valida (`enabled` boolean, `module` string no vacío).
- `docs/contracts/writer-artifacts-v1.md` documenta `lang: python`, el pack opcional y el
  fallback.
- El paquete del core sigue sin `dependencies`; el pack declara las suyas.

## Validation

- Unit tests del adapter con fixtures Python: imports, clases, métodos, herencia, llamadas,
  docstrings.
- Integración: `runBuild` sobre un repo Python; `graph.json`, `symbols.json`,
  `agent/API.md`, `agent/UML.md` y `facts/unsupported.json`.
- Fallback: `languagePack.enabled=false` deja `.py` como unsupported.
- Regresión: suite JS/TS completa, lint y check de sintaxis.
- Benchmark del adapter con el corpus del spike (Informativo; no bloquea el change).
