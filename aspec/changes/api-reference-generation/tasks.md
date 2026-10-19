# Tasks: API reference generation

> Change de análisis. Issue #12. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Solapamiento con el technical seed y con IDEs.
- [ ] Considerar: Valor para agentes vs costo de mantenimiento.
- [ ] Considerar: Dependencia de docstrings (issue relacionado).
- [ ] Considerar: Tamaño de salida y paginación.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Markdown de API por módulo usando `symbols.json` y docstrings (si se implementan).
- [ ] Evaluar Formato Sphinx/Doxygen con tags y cross-links.
- [ ] Evaluar No generar; dejar que spec/LLM redacte desde `symbols.json`.
- [ ] Evaluar Exportar JSON estructurado y un renderer externo.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
