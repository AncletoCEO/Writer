# Proposal: Unsupported language visibility

> Issue: [#9](https://github.com/AncletoCEO/Writer/issues/9)
> Analysis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation

## Problem

Writer solo analiza JS/TS/JSX/TSX. En un repo de usuario políglota, los archivos de otros
lenguajes se ignoran silenciosamente, así que el usuario no sabe qué parte del proyecto quedó
fuera del contexto. El análisis #9 recomendó agregar visibilidad antes de comprometer un
language pack.

## Proposed change

- Agregar al scan una colección de archivos con extensiones de lenguajes conocidos pero no
  soportados.
- Publicar `facts/unsupported.json` con conteos por extensión/lenguaje y una lista acotada de
  archivos.
- Mostrar un resumen en `GOTCHAS.md` e `inventory.md`.
- No parsear ni agregar nodos al grafo.
- Config `unsupported: { enabled, maxFilesPerLanguage }`.

## Scope

In scope: detección por extensión, conteos, fact, docs y tests.
Out of scope: parsers, language pack, tree-sitter y resolución de imports de otros lenguajes.

## Risks

- **Extensiones ambiguas:** usar un mapa conservador de lenguajes conocidos; el resto se
  ignora.
- **Ruido en repos con vendor/generated:** respetar los excludes existentes; limitar la lista.
- **Falsa sensación de cobertura:** el fact debe decir explícitamente que esos archivos **no**
  se analizaron.
