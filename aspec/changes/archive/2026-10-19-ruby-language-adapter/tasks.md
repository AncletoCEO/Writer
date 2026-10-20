# Tasks: Ruby language adapter

> Change de implementación. Issue [#37](https://github.com/AncletoCEO/Writer/issues/37).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-ruby@0.23.1` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar require, clases, módulos, mixins, métodos y visibilidad.
- [x] Definir resolución de `require_relative`.

## Fase 1 — Adapter Ruby

- [x] Crear `packages/writer-languages/src/ruby.js`.
- [x] Extraer require/require_relative.
- [x] Extraer clases, módulos y mixins.
- [x] Extraer métodos, singleton methods, constructores y visibilidad.
- [x] Extraer herencia, llamadas y summaries.
- [x] Implementar resolver de `require_relative`.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-ruby` a dependencies del pack.

## Fase 2 — Integración y contrato

- [x] Agregar `ruby` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.rb` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Ruby.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver Ruby.
- [x] Integración `runBuild` con require_relative, herencia y mixin.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #37 y memoria.
- [x] Archivar el change.
