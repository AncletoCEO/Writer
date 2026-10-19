# Tasks: Taint, security, SARIF, CPG and dataflow

> Change de análisis. Issue #17. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Expertise y mantenimiento.
- [ ] Considerar: Falsos positivos y confianza.
- [ ] Considerar: Solapamiento con herramientas dedicadas.
- [ ] Considerar: Valor para spec vs riesgo reputacional.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Taint mínimo sobre imports peligrosos (`child_process`, `eval`, etc.) con confianza baja.
- [ ] Evaluar CPG/dataflow completo (muy costoso).
- [ ] Evaluar Integrar Semgrep/CodeQL como herramienta externa.
- [ ] Evaluar SARIF solo como formato de salida de hallazgos existentes.
- [ ] Evaluar No hacerlo.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
