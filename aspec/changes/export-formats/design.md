# Design: Export formats (GraphML, Obsidian, SVG, Cypher)

## Approach

¿Qué formatos de exportación necesita el ecosistema y cuáles son ruido?

A. Mantener JSON/Markdown/Mermaid.
B. GraphML para Gephi/yEd.
C. Obsidian vault con wikilinks.
D. SVG estático.
E. Cypher/Neo4j.
F. Un comando `export --format` con adaptadores.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `graph.json` y `symbols.json` son el contrato.
- `agent/*.md` y Mermaid son la salida humana.
- No hay exportadores adicionales.

## Validation

ADR con matriz formato/demanda/costo y decisión. No implementar.

- Demanda real.
- Cero dependencias y tamaño.
- Esfuerzo de mantenimiento por formato.
- Riesgo de contaminar outputs del usuario.
