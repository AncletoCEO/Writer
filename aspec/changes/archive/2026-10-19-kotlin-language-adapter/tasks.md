# Tasks: Kotlin language adapter

> Change de implementación. Issue [#39](https://github.com/AncletoCEO/Writer/issues/39).

## Fase 0 — Relevamiento

- [x] Verificar `@tree-sitter-grammars/tree-sitter-kotlin@1.1.0` con prebuilds en Node 24.
- [x] Descartar `tree-sitter-kotlin@0.3.8` por falta de prebuilds.
- [x] Inspeccionar package/import, class/object/interface, delegation y métodos.
- [x] Definir resolución por package con caída iterativa.

## Fase 1 — Adapter Kotlin

- [x] Crear `packages/writer-languages/src/kotlin.js`.
- [x] Extraer package e imports normal/alias/wildcard.
- [x] Extraer clases, interfaces, objects, enums, data/sealed y typealiases.
- [x] Extraer funciones, métodos, constructores secundarios y companions.
- [x] Extraer herencia, llamadas y summaries.
- [x] Implementar resolver por package.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar la grammar y el override al root.

## Fase 2 — Integración y contrato

- [x] Agregar `kotlin` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.kt`/`.kts` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Kotlin.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver Kotlin.
- [x] Integración `runBuild` con packages locales multi-archivo.
- [x] Verificar `extends` vs `implements`.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #39 y memoria.
- [x] Archivar el change.
