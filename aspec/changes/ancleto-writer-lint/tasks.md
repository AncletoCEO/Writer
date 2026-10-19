# Tasks: ancleto-writer lint with exit codes

> Change de implementación. Issue #7.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] Nuevo `ancleto-writer lint [--root] [--json]` que:
- [ ] Exit codes: `0` OK, `1` uso/config, `2` error de análisis, `5` violaciones de lint. Actualizar contrato y docs.
- [ ] Config `lint: { cycles, layerViolations, unresolved, maxBlastRadius }`.
- [ ] Salida humana y `--json` con hallazgos y `file:line`.
- [ ] Tests de cada regla y de los exit codes.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] Un ciclo hace fallar `lint` con exit `5`.
- [ ] Una violación de capa hace fallar `lint` con exit `5`.
- [ ] `--json` devuelve hallazgos estructurados.
- [ ] Un repo limpio devuelve `0`.
- [ ] Documentado en README y contrato.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
