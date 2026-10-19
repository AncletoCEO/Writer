# Tasks: Call sites and source viewer

> Change de análisis. Issue #15. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Utilidad para agentes vs tamaño de salida.
- [ ] Considerar: Privacidad y ruido de código embebido.
- [ ] Considerar: Resolución cross-file (hoy las llamadas son intra-archivo).
- [ ] Considerar: Solapamiento con el IDE.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Índice de call sites con `caller`, `callee`, `file:line` y confianza.
- [ ] Evaluar Snippets de código embebidos en `symbols.json` (con tope de bytes).
- [ ] Evaluar Source viewer HTML (fuera de alcance).
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
