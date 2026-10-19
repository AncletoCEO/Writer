# Proposal: Call sites and source viewer

> Issue: [#15 — Call sites and source viewer](https://github.com/AncletoCEO/Writer/issues/15)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator tiene `_symindex.py` con definiciones, call sites y resolución de símbolos, y `_sourceview.py` para mostrar código en el explorador. Writer tiene símbolos con rango de líneas y llamadas intra-archivo, pero no un índice de call sites ni snippets.

- `src/parsers/javascript.js` extrae llamadas intra-archivo.
- `src/graph/build.js` crea aristas `call` con línea.
- `symbols.json` tiene `line`/`endLine` y firma.
- No hay snippets ni call sites cross-file.

## Proposed change

¿Vale la pena un índice de call sites y snippets de código, o `file:line` y las firmas son suficientes para agentes?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Índice de call sites con `caller`, `callee`, `file:line` y confianza.
B. Snippets de código embebidos en `symbols.json` (con tope de bytes).
C. Source viewer HTML (fuera de alcance).
D. No hacerlo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Explorador HTML/3D.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
