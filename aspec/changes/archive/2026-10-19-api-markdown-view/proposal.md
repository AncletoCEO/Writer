# Proposal: Lightweight API Markdown view

> Issue: [#12](https://github.com/AncletoCEO/Writer/issues/12)
> Analysis: [`aspec/changes/api-reference-generation/analysis.md`](../api-reference-generation/analysis.md)
> Tipo: implementation
> Dependencia: `docstring-summary-coverage` (#11) para summaries.

## Problem

`symbols.json` ya contiene firmas y `SYMBOLS.md` lista todos los símbolos, pero no hay una
vista enfocada en la **API pública** exportada. El análisis #12 descartó Sphinx/Doxygen y
aprobó, como máximo, un `API.md` liviano derivado de `symbols.json`.

## Proposed change

- Generar `agent/API.md` con símbolos exportados agrupados por archivo.
- Cada línea: nombre, firma y `summary` si existe (#11).
- Paginar con el mismo mecanismo de `agent/*.md` (500 líneas, `_pN.md`).
- Config `apiDocs: { enabled: true }`.
- No generar páginas por módulo, parámetros/retornos estructurados ni HTML.

## Scope

In scope: `API.md` derivado de `symbols.json`, summaries opcionales, paginación y tests.
Out of scope: Sphinx/Doxygen, búsqueda, HTML interactivo y extracción de tags JSDoc.

## Risks

- **Duplicación con `SYMBOLS.md`:** `API.md` solo incluye exportados; `SYMBOLS.md` sigue siendo
  el índice exhaustivo.
- **Sin summaries (#11):** `API.md` funciona solo con firmas; no se bloquea.
- **Crecimiento:** paginación y tope de líneas.
