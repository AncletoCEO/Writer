# Tasks: PHP language adapter

> Change de implementación. Issue [#36](https://github.com/AncletoCEO/Writer/issues/36).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-php@0.24.2` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar namespaces, `use`, grupos, clases/interfaces/traits/enums y métodos.
- [x] Definir resolución por namespace con caída iterativa.

## Fase 1 — Adapter PHP

- [x] Crear `packages/writer-languages/src/php.js`.
- [x] Extraer namespaces file-scoped y block.
- [x] Extraer `use` normal/alias/function/const/grupo.
- [x] Extraer clases, interfaces, traits, enums y funciones.
- [x] Extraer métodos, constructores, herencia/implementación y llamadas.
- [x] Extraer docblocks como `summary`.
- [x] Implementar resolver por namespace.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-php` a dependencies del pack.

## Fase 2 — Integración y contrato

- [x] Agregar `php` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.php` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con PHP.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver PHP.
- [x] Integración `runBuild` con namespaces locales multi-archivo.
- [x] Verificar `extends` vs `implements`.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #36 y memoria.
- [x] Archivar el change.
