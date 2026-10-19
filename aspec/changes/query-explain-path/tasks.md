# Tasks: Query, explain and path exploration

> Change de análisis. Issue #14. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Demanda real de usuarios/agentes.
- [ ] Considerar: Solapamiento con spec y con el IDE.
- [ ] Considerar: Costo de mantener un lenguaje de consulta.
- [ ] Considerar: Calidad de resultados sin LLM.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Comandos deterministas: `explain <symbol>`, `path <a> <b>`, `query` con filtros estructurados.
- [ ] Evaluar Búsqueda BM25/local sobre símbolos y docs.
- [ ] Evaluar MCP server (ver issue de GraphRAG/MCP).
- [ ] Evaluar Dejar la exploración a spec/IDE.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
