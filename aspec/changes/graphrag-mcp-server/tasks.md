# Tasks: GraphRAG and MCP server

> Change de análisis. Issue #19. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Solapamiento con spec/MCP de memoria.
- [ ] Considerar: Costo de mantener auth, transporte y esquema MCP.
- [ ] Considerar: Valor real para agentes vs leer JSON.
- [ ] Considerar: Token/contexto que agrega cada tool MCP.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar No implementar; spec consume los JSON.
- [ ] Evaluar MCP de solo lectura sobre `graph.json`/`symbols.json`.
- [ ] Evaluar GraphRAG local (entidades, relaciones, reportes).
- [ ] Evaluar Integrar el MCP de ReadMenator como herramienta externa.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
