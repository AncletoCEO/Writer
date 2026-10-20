# Tasks: Dead code and orphan symbols

> Change de análisis. Issue #10. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Tasa de falsos positivos y claridad de la confianza.
- [x] Considerar: Manejo de dynamic imports, re-exports, decoradores y frameworks.
- [x] Considerar: Exclusión de tests, scripts y entrypoints configurable.
- [x] Considerar: Valor para `review`/`verify` vs costo.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Archivos huérfanos: sin inbound imports y que no sean entrypoint/config/test.
- [x] Evaluar Símbolos huérfanos: sin llamadas/referencias conocidas, con confianza `inferred`.
- [x] Evaluar Integrar ESLint/TypeScript (`no-unused-vars`) como dependencia opcional.
- [x] Evaluar No implementarlo.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: solo archivos huérfanos; no se crea change todavía.
