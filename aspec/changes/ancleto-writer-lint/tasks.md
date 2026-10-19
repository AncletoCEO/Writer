# Tasks: ancleto-writer lint with exit codes

> Change de implementación. Issue #7.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] Nuevo `ancleto-writer lint [--root] [--json]` que:
- [x] Exit codes: `0` OK, `1` uso/config, `2` error de análisis, `5` violaciones de lint. Actualizar contrato y docs.
- [x] Config `lint: { cycles, layerViolations, unresolved, maxBlastRadius }`.
- [x] Salida humana y `--json` con hallazgos y `file:line`.
- [x] Tests de cada regla y de los exit codes.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] Un ciclo hace fallar `lint` con exit `5`.
- [x] Una violación de capa hace fallar `lint` con exit `5`.
- [x] `--json` devuelve hallazgos estructurados.
- [x] Un repo limpio devuelve `0`.
- [x] Documentado en README y contrato.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
