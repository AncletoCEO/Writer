# Proposal: ancleto-writer lint with exit codes

> Issue: [#7 — ancleto-writer lint with exit codes](https://github.com/AncletoCEO/Writer/issues/7)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

Writer ya calcula ciclos y violaciones de capa, pero solo los escribe como facts. Para CI falta un comando que falle con exit code cuando se viola una regla arquitectónica. Es la feature de mayor valor para `@ancleto/spec` en pipelines.

- `src/metrics/cycles.js` y `src/metrics/layers.js` producen los datos.
- `src/facts/build.js` los publica en `facts/cycles.json` y `facts/layers.json`.
- `src/cli/index.js` solo tiene `init`, `build`, `check`, `doctor`.
- No hay comando `lint` ni exit code específico.

## Proposed change

- Nuevo `ancleto-writer lint [--root] [--json]` que:
  - use un paquete fresco o reconstruya en memoria;
  - evalúe reglas configurables: ciclos, upward imports, imports no resueltos y umbral de blast radius.
- Exit codes: `0` OK, `1` uso/config, `2` error de análisis, `5` violaciones de lint. Actualizar contrato y docs.
- Config `lint: { cycles, layerViolations, unresolved, maxBlastRadius }`.
- Salida humana y `--json` con hallazgos y `file:line`.
- Tests de cada regla y de los exit codes.

## Scope

Incluye: reglas, CLI, docs y tests.
No incluye: reglas de seguridad/taint ni lint de estilo.

## Risks

- Dependencia: idealmente, `lint` reutiliza `runBuild` sin escribir o exige paquete fresco.
- Riesgo: las capas son heurísticas; permitir overrides y documentar falsos positivos.
