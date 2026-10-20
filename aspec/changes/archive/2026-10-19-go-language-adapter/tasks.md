# Tasks: Go language adapter

> Change de implementación. Issue [#30](https://github.com/AncletoCEO/Writer/issues/30).

## Fase 0 — Relevamiento

- [x] Confirmar `tree-sitter-go@0.25.0` y compatibilidad con tree-sitter 0.25 en Node 24.
- [x] Inspeccionar el AST: imports, type_spec, struct/interface, embedded, method, call.
- [x] Decidir multi-target para imports de paquete.

## Fase 1 — Core multi-target

- [x] Extender `resolveImports` para aceptar `targets` además de `target`.
- [x] Test de que un import con `targets` emite una arista por archivo.

## Fase 2 — Adapter Go

- [x] Crear `packages/writer-languages/src/go.js`.
- [x] Implementar imports (single, grouped, alias, blank, dot).
- [x] Implementar structs, interfaces, tipos, funciones y métodos.
- [x] Implementar métodos de interfaz y embebido.
- [x] Implementar llamadas intra-archivo y doc comments.
- [x] Implementar resolver con `go.mod` y multi-target.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-go` a dependencies del pack.

## Fase 3 — Integración y contrato

- [x] Agregar `go` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.go` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Go.

## Fase 4 — Tests y verificación

- [x] Unit tests de parser y resolver Go.
- [x] Integración `runBuild` con repo Go y paquete importado multi-archivo.
- [x] Fallback con pack deshabilitado.
- [x] Ajustar tests de unsupported para no depender de `.go`.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 5 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check` (12 specs canónicos, 0 no canónicos).
- [x] Actualizar issue #30 y memoria.
- [x] Archivar el change.
