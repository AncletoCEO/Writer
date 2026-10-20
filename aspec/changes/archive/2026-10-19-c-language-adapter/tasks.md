# Tasks: C language adapter

> Change de implementación. Issue [#34](https://github.com/AncletoCEO/Writer/issues/34).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-c@0.24.1` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar includes, structs, typedefs, enums, prototipos y funciones.
- [x] Definir búsqueda de headers y contexto `quoted`.

## Fase 1 — Core

- [x] Pasar la entrada del import a `resolveImport`.
- [x] Exponer `importEntry` en el contexto del adapter.

## Fase 2 — Adapter C

- [x] Crear `packages/writer-languages/src/c.js`.
- [x] Extraer includes quoted/system.
- [x] Extraer structs, typedefs, enums y type aliases.
- [x] Extraer prototipos y definiciones; marcar `static`.
- [x] Extraer llamadas y summaries.
- [x] Implementar resolver de headers.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-c` a dependencies del pack.

## Fase 3 — Integración y contrato

- [x] Agregar `c` a `ALLOWED_LANGUAGES` y extensiones `.c`/`.h`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.c`/`.h` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con C.

## Fase 4 — Tests y verificación

- [x] Unit tests de parser y resolver C.
- [x] Integración `runBuild` con headers y fuentes.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 5 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #34 y memoria.
- [x] Archivar el change.
