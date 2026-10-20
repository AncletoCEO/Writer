# Proposal: PHP language adapter

> Issue: [#36](https://github.com/AncletoCEO/Writer/issues/36)
> Base: [`aspec/changes/archive/2026-10-19-cpp-language-adapter/`](../archive/2026-10-19-cpp-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

PHP organiza el código en namespaces y usa `use` para importar clases, interfaces, traits,
funciones y constantes. El namespace no mapea 1:1 a un archivo, así que el resolver debe usar
el índice global ya construido por el core y probar prefijos hasta encontrar un namespace.

## Proposed change

- Agregar el adapter `php` a `@ancleto/writer-languages` con `tree-sitter-php`.
- Extraer namespaces (file-scoped y block), `use` normal/alias/`function`/`const`/grupos,
  clases, interfaces, traits, enums, métodos, constructores, herencia/implementación,
  llamadas y docblocks.
- Resolver `use` contra el índice de namespaces:
  - probar el nombre completo y quitar segmentos hasta encontrar un namespace;
  - emitir una arista por archivo del namespace;
  - excluir el archivo actual;
  - dejar clases/funciones externas como externas.
- Mantener `lang: php` aditivo y el core sin dependencias.

## Scope

In scope: extensión `.php`, parser/resolver PHP, traits, enums, docblocks, tests y docs.

Out of scope: autoload/PSR-4, `require`/`include`, evaluación dinámica, traits use como
relación, `use` de funciones/constantes más allá del namespace, frameworks y P3.

## Risks

- **Namespace vs archivo:** un `use` de clase resuelve a todos los archivos del namespace; la
  arista es de dependencia de namespace.
- **Grupos:** `use App\Services\{A, B}` se aplana a dos imports.
- **Traits:** se publican como `class` con firma `trait X`; su uso dentro de una clase no se
  modela como herencia.
- **Docblocks:** se toma la primera línea de texto, salteando tags `@...`.
