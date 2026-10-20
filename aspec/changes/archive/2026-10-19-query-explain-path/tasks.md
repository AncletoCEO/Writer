# Tasks: Query, explain and path exploration

> Change de análisis. Issue #14. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Demanda real de usuarios/agentes.
- [x] Considerar: Solapamiento con spec y con el IDE.
- [x] Considerar: Costo de mantener un lenguaje de consulta.
- [x] Considerar: Calidad de resultados sin LLM.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Comandos deterministas: `explain <symbol>`, `path <a> <b>`, `query` con filtros estructurados.
- [x] Evaluar Búsqueda BM25/local sobre símbolos y docs.
- [x] Evaluar MCP server (ver issue de GraphRAG/MCP).
- [x] Evaluar Dejar la exploración a spec/IDE.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
