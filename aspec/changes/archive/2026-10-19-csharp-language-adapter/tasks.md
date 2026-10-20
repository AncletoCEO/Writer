# Tasks: C# language adapter

> Change de implementación. Issue [#33](https://github.com/AncletoCEO/Writer/issues/33).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-c-sharp@0.23.5` en Node 24.
- [x] Detectar que el wrapper ESM usa top-level await y no se puede `require`.
- [x] Definir carga del binding prebuilt con `node-gyp-build` (shim CJS).
- [x] Inspeccionar `using`, namespaces, tipos, miembros y base_list.

## Fase 1 — Core

- [x] `buildGraph` en dos fases: parsear todo y construir `namespaceIndex`.
- [x] Pasar `namespaces` a `adapter.resolveImport`.
- [x] Refinar `inheritsKind` según `kind: interface` del padre local.

## Fase 2 — Adapter C#

- [x] Crear `packages/writer-languages/src/csharp.js`.
- [x] Extraer `using` normal/static/alias/global.
- [x] Extraer namespaces block y file-scoped.
- [x] Extraer clases, structs, records, interfaces, enums y delegates.
- [x] Extraer métodos, constructores, herencia, llamadas y doc comments XML.
- [x] Implementar resolver contra `namespaceIndex`.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-c-sharp` a dependencies del pack.

## Fase 3 — Integración y contrato

- [x] Agregar `csharp` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.cs` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con C#.

## Fase 4 — Tests y verificación

- [x] Unit tests de parser y resolver C#.
- [x] Integración `runBuild` con namespaces locales multi-archivo.
- [x] Verificar `extends` vs `implements` por tipo de padre.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 5 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #33 y memoria.
- [x] Archivar el change.
