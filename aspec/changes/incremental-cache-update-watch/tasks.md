# Tasks: Incremental cache, update and watch

> Change de análisis. Issue #13. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Tiempo de build en repos objetivo (medir p50/p95).
- [ ] Considerar: Costo de complejidad y bugs de frescura.
- [ ] Considerar: Beneficio en CI vs local.
- [ ] Considerar: Portabilidad de `watch`.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Cache por archivo (hash/mtime) para parse y resolución, con invalidación por fingerprint.
- [ ] Evaluar `update` que reutilice el paquete anterior y reanalice solo archivos cambiados.
- [ ] Evaluar `watch` con polling (sin deps) o `fs.watch`.
- [ ] Evaluar No implementar hasta que haya un caso real.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
