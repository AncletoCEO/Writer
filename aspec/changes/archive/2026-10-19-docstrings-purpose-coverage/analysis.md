# Analysis: Docstrings, purpose and doc coverage

> Issue: [#11](https://github.com/AncletoCEO/Writer/issues/11)
> Change: `docstrings-purpose-coverage`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe extraer docstrings/propósito y calcular cobertura de documentación, o alcanzan
las firmas y el seed de spec?

## Evidencia

- `src/parsers/javascript.js` extrae nombre, kind, líneas y firma; no captura comentarios.
- El lexer descarta comentarios (`//` y `/* */`) y no los expone al parser.
- `INDEX.md` solo muestra path, capa, símbolos y fan-in.
- `SYMBOLS.md` muestra nombre, kind, línea y firma; no hay descripción.
- No hay métrica de cobertura de documentación.

## Opciones

### A. Extracción liviana + cobertura

- Capturar el bloque de comentario inmediatamente anterior a la declaración y usar la primera
  línea no vacía como `summary`.
- Calcular `docCoverage` por archivo y repo (símbolos documentados / símbolos totales).
- Sin dependencias; bajo costo.
- Riesgo: asociación incorrecta en decoradores, comentarios sueltos o código minificado.

### B. JSDoc/TSDoc estructurado

- Parsear `@param`, `@returns`, `@throws`, `@example`, etc.
- Más valor para API docs, pero más mantenimiento y casos borde.

### C. TypeScript compiler API o LLM

- TypeScript aporta precisión pero rompe cero-deps; el LLM del seed ya puede redactar.
- No recomendado para el core.

### D. No hacerlo

- Mantiene el core simple, pero desaprovecha una mejora barata para agentes.

## Recomendación

**Aprobar A**: extracción liviana de `summary` + cobertura. **Diferir B** (tags JSDoc) hasta
que exista demanda de API docs. **No** usar TypeScript/LLM en el core.

## Salida propuesta

- `symbols.json`: campo opcional `summary` (string, una línea).
- `facts/doc-coverage.json`: `{ schemaVersion: 1, files: [{ path, documented, total, ratio }], totals: {...} }`.
- `INDEX.md`: propósito corto por archivo si el primer símbolo exportado tiene summary.
- `GOTCHAS.md`: archivos con baja cobertura (opt-in o threshold configurable).

## Criterios de aceptación

- [ ] El summary se asocia solo a comentarios inmediatamente anteriores (sin líneas en blanco de por medio).
- [ ] No se inventan summaries para declaraciones sin comentario.
- [ ] `docCoverage` es determinista y se puede excluir tests/config.
- [ ] Tests con JSDoc, comentario de una línea, comentario separado y declaración sin comentario.

## Decisión

Aprobar extracción liviana y cobertura; diferir JSDoc estructurado. No agregar dependencias.
