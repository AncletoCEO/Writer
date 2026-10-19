# Analysis: Incremental cache, update and watch

> Issue: [#13](https://github.com/AncletoCEO/Writer/issues/13)
> Change: `incremental-cache-update-watch`
> Fecha: 2026-10-19

## Pregunta

¿Hace falta cache incremental, `update` o `watch`, o el build completo es suficientemente
rápido?

## Evidencia

- `src/build/run.js` ejecuta scan, parse, resolve, graph, metrics, facts y render completos.
- `src/scan/scanner.js` calcula SHA-256 por archivo en una sola lectura.
- El smoke de 2.000 archivos tarda ~325 ms; el paquete pesa ~50 KB.
- No hay cache en disco ni watcher.

## Opciones

### A. Cache por archivo

- Guardar resultados de parse/resolución por `hash`/`mtime` y reutilizarlos si el archivo no
  cambió.
- Complejidad media; requiere invalidación correcta y un formato de cache versionado.

### B. `update` incremental

- Reutilizar el paquete anterior y reanalizar solo archivos cambiados.
- Más complejo: métricas globales (PageRank, comunidades) pueden cambiar aunque el archivo
  no; requiere recomputar el grafo.

### C. `watch`

- Polling o `fs.watch` para reconstruir ante cambios.
- Útil en desarrollo, pero agrega proceso vivo, cross-platform y ruido.

### D. No implementar todavía

- El build completo es rápido y simple; no hay evidencia de repos que lo justifiquen.

## Recomendación

**D ahora.** Revisar cuando un repo real de usuario supere **10.000 archivos** o el build p95
supere **5 s**. Si se activa, implementar primero **A (cache de parse/resolución)**, no `update`
ni `watch`. `update` y `watch` solo si hay un flujo de desarrollo interactivo con demanda.

## Criterios de decisión

- Benchmark en 10k/50k archivos y p95.
- Tasa de acierto de cache y correctness ante cambios de configuración/tsconfig.
- Costo de invalidación y tamaño de cache.
- Demanda real de watch en usuarios de spec.

## Decisión

Diferir cache/update/watch. Umbral: >10k archivos o build p95 >5 s. Empezar por cache de
parse si se activa.
