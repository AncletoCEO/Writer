# Design: Unsupported language visibility

## Approach

Extender el scan para clasificar archivos por extensión sin leer su contenido. Los archivos
soportados siguen el flujo actual; los de lenguajes conocidos no soportados se cuentan en una
colección aparte. No se parsean ni generan nodos.

## Architecture

- `src/scan/languages.js`: mapa conservador `extension -> language` (Python, Go, Rust, Java,
  C/C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Lua, Dart, Elixir, Nim, Shell, etc.).
- `src/scan/scanner.js`: agrega `unsupported` al resultado (`{ extension, language, path }`).
- `src/facts/unsupported.js`: agrega por extensión/lenguaje y limita la lista de archivos.
- `src/facts/build.js`: publica `facts/unsupported.json`.
- `src/render/markdown.js`: resumen en `GOTCHAS.md` e `inventory.md`.
- `src/config/load.js`: `unsupported.enabled` y `unsupported.maxFilesPerLanguage`.

## Data model

```json
{
  "schemaVersion": 1,
  "unsupported": [
    {
      "extension": ".py",
      "language": "python",
      "count": 42,
      "files": ["src/app.py", "src/db.py"]
    }
  ],
  "totals": { "files": 42, "languages": 1 }
}
```

## Validation

- Un `.py` se cuenta y no genera nodo.
- Un archivo binario o sin extensión conocida no se cuenta.
- Los paths excluidos por config no se cuentan.
- Los archivos JS/TS soportados no aparecen en `unsupported`.
- El fact es determinista y la lista se corta según config.
- `GOTCHAS.md`/`inventory.md` muestran el resumen con la aclaración de "no analizado".
