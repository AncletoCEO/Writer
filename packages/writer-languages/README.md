# @ancleto/writer-languages

Language pack opcional para [`@ancleto/writer`](https://www.npmjs.com/package/@ancleto/writer).
Agrega análisis estático de lenguajes adicionales sin sumar dependencias al core.

## Instalación

```bash
npm install @ancleto/writer @ancleto/writer-languages
```

El core detecta el pack automáticamente y habilita sus extensiones. Si el pack no está
instalado, Writer sigue funcionando con JS/TS y reporta los archivos afectados en
`facts/unsupported.json`.

## Lenguajes

| Lenguaje | Extensiones | `lang` |
|---|---|---|
| Python | `.py`, `.pyi` | `python` |
| Go | `.go` | `go` |
| Rust | `.rs` | `rust` |
| C# | `.cs` | `csharp` |
| Java | `.java` | `java` |
| C | `.c`, `.h` | `c` |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh`, `.hxx` | `cpp` |
| PHP | `.php` | `php` |
| Ruby | `.rb` | `ruby` |
| Swift | `.swift` | `swift` |
| Kotlin | `.kt`, `.kts` | `kotlin` |

## Uso

```bash
npx @ancleto/writer build
```

No requiere configuración adicional. Para desactivar el pack:

```json
{ "languagePack": { "enabled": false } }
```

## Requisitos y límites

- Node.js ≥ 24.
- Las grammars usan tree-sitter nativo; el pack trae sus propias dependencias.
- Algunas grammars declaran peers de tree-sitter más viejos que el usado por el pack. npm puede
  mostrar warnings de peer o requerir `--legacy-peer-deps` según la versión de npm.
- La resolución de imports es estructural (por archivo, package o namespace), no semántica.
  Los límites por lenguaje están documentados en el README de Writer.

## Licencia

AGPL-3.0-only. Ver `LICENSE` y `NOTICE`.
