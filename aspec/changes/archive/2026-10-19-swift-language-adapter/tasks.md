# Tasks: Swift language adapter

> Change de implementación. Issue [#38](https://github.com/AncletoCEO/Writer/issues/38).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-swift@0.7.1` en Node 24.
- [x] Detectar el nodo compartido `class_declaration` para class/struct/enum/extension.
- [x] Resolver el peer conflict con `overrides` a `tree-sitter@0.25.1`.
- [x] Confirmar que los imports Swift quedan externos.

## Fase 1 — Adapter Swift

- [x] Crear `packages/writer-languages/src/swift.js`.
- [x] Extraer imports externos y doc comments.
- [x] Distinguir class/struct/enum/actor/extension.
- [x] Extraer protocolos, typealiases y funciones.
- [x] Extraer métodos, init, deinit, visibilidad y extensions.
- [x] Extraer herencia/conformancia y llamadas.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-swift` y el override al root.

## Fase 2 — Integración y contrato

- [x] Agregar `swift` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.swift` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Swift.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser Swift.
- [x] Integración `runBuild` con protocolo, clase y conformancia.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #38 y memoria.
- [x] Archivar el change.
