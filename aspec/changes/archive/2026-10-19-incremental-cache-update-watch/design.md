# Design: Incremental cache, update and watch

## Approach

¿Hace falta cache incremental, `update` o `watch`, o el build completo es suficientemente rápido?

A. Cache por archivo (hash/mtime) para parse y resolución, con invalidación por fingerprint.
B. `update` que reutilice el paquete anterior y reanalice solo archivos cambiados.
C. `watch` con polling (sin deps) o `fs.watch`.
D. No implementar hasta que haya un caso real.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/build/run.js` ejecuta scan, parse, resolve, graph, metrics, facts y render completos.
- `src/scan/scanner.js` calcula SHA-256 por archivo en una sola lectura.
- No hay cache en disco ni watcher.

## Validation

Benchmark con repos de 2k/10k/50k archivos, diseño de cache e invalidación, y decisión. No implementar.

- Tiempo de build en repos objetivo (medir p50/p95).
- Costo de complejidad y bugs de frescura.
- Beneficio en CI vs local.
- Portabilidad de `watch`.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
