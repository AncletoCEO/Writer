# Tasks: Docstrings, purpose and doc coverage

> Change de análisis. Issue #11. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Valor real para `INDEX`/`SYMBOLS`/technical seed.
- [x] Considerar: Costo de parseo y falsos positivos.
- [x] Considerar: Cobertura de convenciones (JSDoc, TSDoc, comentarios sueltos).
- [x] Considerar: Impacto en el tamaño de los docs y en el contrato.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Extracción liviana de comentarios inmediatamente anteriores a la declaración y resumen de primera línea.
- [x] Evaluar Parseo estructurado de JSDoc/TSDoc (tags, params, returns).
- [x] Evaluar Delegar a TypeScript compiler API (dependencia) o al LLM del seed.
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
