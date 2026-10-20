# Proposal: Docstrings, purpose and doc coverage

> Issue: [#11 — Docstrings, purpose and doc coverage](https://github.com/AncletoCEO/Writer/issues/11)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator extrae docstrings en varias convenciones y calcula doc coverage. Writer extrae firmas, pero `INDEX.md` solo muestra path/capa/símbolos y `SYMBOLS.md` no tiene descripción. Una descripción corta mejora mucho la utilidad para agentes.

- `src/parsers/javascript.js` extrae nombre, kind, líneas y firma.
- No se capturan comentarios JSDoc/TSDoc ni `@param`/`@returns`.
- No hay cobertura de documentación.

## Proposed change

¿Writer debe extraer docstrings/propósito y calcular cobertura de documentación, o alcanza con firmas y el seed de spec?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Extracción liviana de comentarios inmediatamente anteriores a la declaración y resumen de primera línea.
B. Parseo estructurado de JSDoc/TSDoc (tags, params, returns).
C. Delegar a TypeScript compiler API (dependencia) o al LLM del seed.
D. No hacerlo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Generación de documentación HTML/Sphinx (ver issue de API reference).

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
