# Tasks: Lightweight API Markdown view

> Change de implementación. Issue #12. Depende de #11 para summaries (opcional).

## Fase 0 — Relevamiento

- [x] Confirmar `symbols.json`, exportados y paginación existente.
- [x] Definir `apiDocs.enabled` y el formato de línea.

## Fase 1 — Implementación

- [x] Implementar `src/render/api.js`.
- [x] Integrar `agent/API.md` en `renderDocuments`.
- [x] Agregar `apiDocs.enabled` a config y validación.
- [x] Actualizar contrato y README.

## Fase 2 — Tests

- [x] Solo exportados.
- [x] Summary presente/ausente.
- [x] Paginación.
- [x] Sin exportados.
- [x] `npm test`, `npm run lint`, `npm run build`.
