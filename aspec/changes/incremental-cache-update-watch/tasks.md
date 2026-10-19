# Tasks: Incremental cache, update and watch

> Change de análisis. Issue #13. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Tiempo de build en repos objetivo (medir p50/p95).
- [x] Considerar: Costo de complejidad y bugs de frescura.
- [x] Considerar: Beneficio en CI vs local.
- [x] Considerar: Portabilidad de `watch`.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Cache por archivo (hash/mtime) para parse y resolución, con invalidación por fingerprint.
- [x] Evaluar `update` que reutilice el paquete anterior y reanalice solo archivos cambiados.
- [x] Evaluar `watch` con polling (sin deps) o `fs.watch`.
- [x] Evaluar No implementar hasta que haya un caso real.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
