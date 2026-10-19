# Tasks: Dead code and orphan symbols

> Change de análisis. Issue #10. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Tasa de falsos positivos y claridad de la confianza.
- [ ] Considerar: Manejo de dynamic imports, re-exports, decoradores y frameworks.
- [ ] Considerar: Exclusión de tests, scripts y entrypoints configurable.
- [ ] Considerar: Valor para `review`/`verify` vs costo.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Archivos huérfanos: sin inbound imports y que no sean entrypoint/config/test.
- [ ] Evaluar Símbolos huérfanos: sin llamadas/referencias conocidas, con confianza `inferred`.
- [ ] Evaluar Integrar ESLint/TypeScript (`no-unused-vars`) como dependencia opcional.
- [ ] Evaluar No implementarlo.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
