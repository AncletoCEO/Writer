# Tasks: Call sites and source viewer

> Change de análisis. Issue #15. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Utilidad para agentes vs tamaño de salida.
- [x] Considerar: Privacidad y ruido de código embebido.
- [x] Considerar: Resolución cross-file (hoy las llamadas son intra-archivo).
- [x] Considerar: Solapamiento con el IDE.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Índice de call sites con `caller`, `callee`, `file:line` y confianza.
- [x] Evaluar Snippets de código embebidos en `symbols.json` (con tope de bytes).
- [x] Evaluar Source viewer HTML (fuera de alcance).
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
