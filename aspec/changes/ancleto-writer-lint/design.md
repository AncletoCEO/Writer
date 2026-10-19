# Design: ancleto-writer lint with exit codes

## Approach

- Nuevo `ancleto-writer lint [--root] [--json]` que:
  - use un paquete fresco o reconstruya en memoria;
  - evalúe reglas configurables: ciclos, upward imports, imports no resueltos y umbral de blast radius.
- Exit codes: `0` OK, `1` uso/config, `2` error de análisis, `5` violaciones de lint. Actualizar contrato y docs.
- Config `lint: { cycles, layerViolations, unresolved, maxBlastRadius }`.
- Salida humana y `--json` con hallazgos y `file:line`.
- Tests de cada regla y de los exit codes.

## Architecture

Áreas afectadas: src/cli/index.js, src/metrics/layers.js, src/metrics/cycles.js, src/facts/*, docs/contracts, tests de CLI.

## Validation

- [ ] Un ciclo hace fallar `lint` con exit `5`.
- [ ] Una violación de capa hace fallar `lint` con exit `5`.
- [ ] `--json` devuelve hallazgos estructurados.
- [ ] Un repo limpio devuelve `0`.
- [ ] Documentado en README y contrato.
