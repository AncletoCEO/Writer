# Proposal: Orphan file detection

> Issue: [#10](https://github.com/AncletoCEO/Writer/issues/10)
> Analysis: [`aspec/changes/dead-code-orphan-symbols/analysis.md`](../dead-code-orphan-symbols/analysis.md)
> Tipo: implementation

## Problem

Writer calcula `fanIn` y el grafo de imports, pero no expone candidatos a código muerto. El
análisis #10 concluyó que los **archivos huérfanos** son viables con exclusiones y confianza,
mientras que los símbolos huérfanos no son fiables con el call graph actual.

## Proposed change

- Nuevo `src/metrics/orphans.js` para detectar archivos con `fanIn === 0`.
- Excluir entrypoints de `package.json` (`bin`, `main`, `module`, `exports`), tests, config,
  scripts, migraciones y `entrypoints` configurados.
- Marcar `confidence: medium|low`; baja si hay dynamic imports no literales o imports no
  resueltos.
- Publicar `facts/dead-code.json` con candidatos y excluidos.
- Agregar sección "Archivos huérfanos" en `GOTCHAS.md`.
- Regla de lint **opt-in** `lint.orphanFiles` (default `false`).
- Config `orphans: { enabled, entrypoints, exclude }`.

## Scope

In scope: archivos huérfanos, exclusiones, confianza, fact, GOTCHAS, lint opt-in y tests.
Out of scope: símbolos huérfanos, eliminación de código, ESLint/TypeScript y detección
semántica de frameworks.

## Risks

- **Falsos positivos por entrypoints no detectados:** permitir `entrypoints` configurable y
  documentar límites.
- **Dynamic imports no literales:** bajar confianza y no fallar CI por defecto.
- **Ruido en repos con frameworks:** la regla de lint es opt-in; el fact incluye excluidos.
- **Duplicar dead-code con otros tools:** Writer solo reporta candidatos, no elimina.
