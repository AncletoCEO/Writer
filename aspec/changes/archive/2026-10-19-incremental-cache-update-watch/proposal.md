# Proposal: Incremental cache, update and watch

> Issue: [#13 — Incremental cache, update and watch](https://github.com/AncletoCEO/Writer/issues/13)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator tiene cache SHA-256, `update` incremental y `watch`. Writer hace un scan/parse completo en cada build. En el smoke de 2.000 archivos tardó ~189 ms, así que la urgencia es baja, pero monorepos grandes o uso en watch podrían cambiar la ecuación.

- `src/build/run.js` ejecuta scan, parse, resolve, graph, metrics, facts y render completos.
- `src/scan/scanner.js` calcula SHA-256 por archivo en una sola lectura.
- No hay cache en disco ni watcher.

## Proposed change

¿Hace falta cache incremental, `update` o `watch`, o el build completo es suficientemente rápido?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Cache por archivo (hash/mtime) para parse y resolución, con invalidación por fingerprint.
B. `update` que reutilice el paquete anterior y reanalice solo archivos cambiados.
C. `watch` con polling (sin deps) o `fs.watch`.
D. No implementar hasta que haya un caso real.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Cache distribuido o daemon.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
