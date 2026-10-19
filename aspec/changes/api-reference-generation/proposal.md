# Proposal: API reference generation

> Issue: [#12 — API reference generation](https://github.com/AncletoCEO/Writer/issues/12)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera `readmenator-apidocs/` con firmas, parámetros, retornos, enlaces y cobertura. Writer ya tiene `symbols.json` con firmas. La pregunta es si vale la pena una capa de docs de API o si el consumidor puede renderizarla.

- `src/facts/symbols.js` publica símbolos y firmas.
- `agent/SYMBOLS.md` lista símbolos con `file:line`.
- No hay páginas por módulo ni índice de API.

## Proposed change

¿Writer debe generar documentación de API determinista o eso pertenece al technical seed/LLM de spec?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Markdown de API por módulo usando `symbols.json` y docstrings (si se implementan).
B. Formato Sphinx/Doxygen con tags y cross-links.
C. No generar; dejar que spec/LLM redacte desde `symbols.json`.
D. Exportar JSON estructurado y un renderer externo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Docs HTML interactivas y búsqueda.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
