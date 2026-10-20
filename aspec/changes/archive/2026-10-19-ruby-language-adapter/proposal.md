# Proposal: Ruby language adapter

> Issue: [#37](https://github.com/AncletoCEO/Writer/issues/37)
> Base: [`aspec/changes/archive/2026-10-19-php-language-adapter/`](../archive/2026-10-19-php-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P2)

## Problem

Ruby organiza el código con `require`/`require_relative`, clases, módulos y mixins. La
dependencia de archivo explícita es `require_relative`; `require` busca en el load path y
normalmente referencia stdlib/gems, así que no se puede resolver sin configuración adicional.

## Proposed change

- Agregar el adapter `ruby` a `@ancleto/writer-languages` con `tree-sitter-ruby`.
- Extraer `require`/`require_relative`, clases, módulos, mixins (`include`/`extend`/`prepend`),
  métodos, constructores, herencia, visibilidad, llamadas y comentarios.
- Resolver `require_relative` contra el directorio del archivo, con `.rb` opcional; dejar
  `require` como externo.
- Modelar módulos como `class` con firma `module X` y los mixins como relaciones
  `inherits`/`implements`.
- Mantener `lang: ruby` aditivo y el core sin dependencias.

## Scope

In scope: extensión `.rb`, parser/resolver Ruby, mixins, visibilidad, tests y docs.

Out of scope: load path, gems, `require` dinámico, `class << self`, metaprogramación,
`private :symbol`, Rails autoload y P3.

## Risks

- **`require` externo:** solo `require_relative` genera aristas; `require` queda en
  `facts/externals.json`.
- **Mixins:** se modelan como `implements` aunque Ruby no tenga interfaces; se documenta.
- **Módulos anidados:** los nombres se publican sin prefijo de namespace.
- **Visibilidad:** `private :foo` (con args) no se resuelve por método.
