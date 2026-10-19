# Tasks: Lightweight API Markdown view

> Change de implementación. Issue #12. Depende de #11 para summaries (opcional).

## Fase 0 — Relevamiento

- [ ] Confirmar `symbols.json`, exportados y paginación existente.
- [ ] Definir `apiDocs.enabled` y el formato de línea.

## Fase 1 — Implementación

- [ ] Implementar `src/render/api.js`.
- [ ] Integrar `agent/API.md` en `renderDocuments`.
- [ ] Agregar `apiDocs.enabled` a config y validación.
- [ ] Actualizar contrato y README.

## Fase 2 — Tests

- [ ] Solo exportados.
- [ ] Summary presente/ausente.
- [ ] Paginación.
- [ ] Sin exportados.
- [ ] `npm test`, `npm run lint`, `npm run build`.
