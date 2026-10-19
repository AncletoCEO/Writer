# Proposal: Visual maps, 3D, flows and component diagrams

> Issue: [#20 — Visual maps, 3D, flows and component diagrams](https://github.com/AncletoCEO/Writer/issues/20)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator tiene visores vis.js, ForceAtlas2 2D/3D, edge bundling, flows, diagramas de componentes y galerías. Writer solo genera Markdown/Mermaid. Estas features son costosas y copiar plantillas HTML/JS del upstream traería obligaciones AGPL sobre los outputs.

- `src/render/mermaid.js` genera Mermaid.
- `src/render/markdown.js` embebe los diagramas.
- No hay HTML, CSS, JS ni 3D.

## Proposed change

¿Writer debe generar mapas interactivos, 3D, flows o diagramas de componentes, o quedarse en Mermaid?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Quedarse en Mermaid (actual).
B. SVG estático generado por código propio.
C. HTML interactivo propio (sin copiar vis.js de ReadMenator).
D. Integrar ReadMenator como herramienta externa opcional.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Video (issue separado).

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
