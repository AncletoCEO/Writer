# Tasks: GraphRAG and MCP server

> Change de análisis. Issue #19. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Solapamiento con spec/MCP de memoria.
- [x] Considerar: Costo de mantener auth, transporte y esquema MCP.
- [x] Considerar: Valor real para agentes vs leer JSON.
- [x] Considerar: Token/contexto que agrega cada tool MCP.

## Fase 1 — Opciones y evidencia

- [x] Evaluar No implementar; spec consume los JSON.
- [x] Evaluar MCP de solo lectura sobre `graph.json`/`symbols.json`.
- [x] Evaluar GraphRAG local (entidades, relaciones, reportes).
- [x] Evaluar Integrar el MCP de ReadMenator como herramienta externa.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
