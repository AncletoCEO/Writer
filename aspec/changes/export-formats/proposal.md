# Proposal: Export formats (GraphML, Obsidian, SVG, Cypher)

> Issue: [#18 — Export formats (GraphML, Obsidian, SVG, Cypher)](https://github.com/AncletoCEO/Writer/issues/18)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator exporta JSON, HTML, SVG, GraphML, Obsidian y Cypher/Neo4j. Writer solo publica JSON, Markdown y Mermaid. Para spec, JSON es suficiente; para usuarios humanos o herramientas externas, otros formatos podrían aportar.

- `graph.json` y `symbols.json` son el contrato.
- `agent/*.md` y Mermaid son la salida humana.
- No hay exportadores adicionales.

## Proposed change

¿Qué formatos de exportación necesita el ecosistema y cuáles son ruido?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Mantener JSON/Markdown/Mermaid.
B. GraphML para Gephi/yEd.
C. Obsidian vault con wikilinks.
D. SVG estático.
E. Cypher/Neo4j.
F. Un comando `export --format` con adaptadores.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
HTML interactivo (ver issue de visual maps).

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
