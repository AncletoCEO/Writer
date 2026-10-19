# Tasks: Docstrings, purpose and doc coverage

> Change de análisis. Issue #11. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Valor real para `INDEX`/`SYMBOLS`/technical seed.
- [ ] Considerar: Costo de parseo y falsos positivos.
- [ ] Considerar: Cobertura de convenciones (JSDoc, TSDoc, comentarios sueltos).
- [ ] Considerar: Impacto en el tamaño de los docs y en el contrato.

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Extracción liviana de comentarios inmediatamente anteriores a la declaración y resumen de primera línea.
- [ ] Evaluar Parseo estructurado de JSDoc/TSDoc (tags, params, returns).
- [ ] Evaluar Delegar a TypeScript compiler API (dependencia) o al LLM del seed.
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
