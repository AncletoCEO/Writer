# Tasks: Taint, security, SARIF, CPG and dataflow

> Change de análisis. Issue #17. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Expertise y mantenimiento.
- [x] Considerar: Falsos positivos y confianza.
- [x] Considerar: Solapamiento con herramientas dedicadas.
- [x] Considerar: Valor para spec vs riesgo reputacional.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Taint mínimo sobre imports peligrosos (`child_process`, `eval`, etc.) con confianza baja.
- [x] Evaluar CPG/dataflow completo (muy costoso).
- [x] Evaluar Integrar Semgrep/CodeQL como herramienta externa.
- [x] Evaluar SARIF solo como formato de salida de hallazgos existentes.
- [x] Evaluar No hacerlo.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
