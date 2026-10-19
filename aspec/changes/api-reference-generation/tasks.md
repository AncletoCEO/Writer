# Tasks: API reference generation

> Change de análisis. Issue #12. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Solapamiento con el technical seed y con IDEs.
- [x] Considerar: Valor para agentes vs costo de mantenimiento.
- [x] Considerar: Dependencia de docstrings (issue relacionado).
- [x] Considerar: Tamaño de salida y paginación.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Markdown de API por módulo usando `symbols.json` y docstrings (si se implementan).
- [x] Evaluar Formato Sphinx/Doxygen con tags y cross-links.
- [x] Evaluar No generar; dejar que spec/LLM redacte desde `symbols.json`.
- [x] Evaluar Exportar JSON estructurado y un renderer externo.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
