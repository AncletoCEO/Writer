# Tasks: C++ language adapter

> Change de implementación. Issue [#35](https://github.com/AncletoCEO/Writer/issues/35).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-cpp@0.23.4` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar namespaces, clases, métodos, out-of-line, templates y herencia.
- [x] Confirmar `.h` asignado a C y extensiones C++ separadas.

## Fase 1 — Adapter C++

- [x] Crear `packages/writer-languages/src/cpp.js`.
- [x] Extraer includes quoted/system.
- [x] Extraer namespaces, clases/structs/unions, enums, aliases y templates.
- [x] Extraer métodos, constructores, destructores y prototipos.
- [x] Extraer herencia, llamadas y summaries.
- [x] Implementar resolución de headers.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-cpp` a dependencies del pack.

## Fase 2 — Integración y contrato

- [x] Agregar `cpp` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.cpp`/`.hpp` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con C++.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver C++.
- [x] Integración `runBuild` con headers y fuentes.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #35 y memoria.
- [x] Archivar el change.
