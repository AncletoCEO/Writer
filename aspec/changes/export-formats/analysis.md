# Analysis: Export formats (GraphML, Obsidian, SVG, Cypher)

> Issue: [#18](https://github.com/AncletoCEO/Writer/issues/18)
> Change: `export-formats`
> Fecha: 2026-10-19

## Pregunta

¿Qué formatos de exportación necesita el ecosistema y cuáles son ruido?

## Evidencia

- `graph.json` y `symbols.json` son el contrato para spec/agentes.
- `agent/*.md` + Mermaid cubren la salida humana y los diagramas.
- No hay exportadores GraphML, Obsidian, SVG ni Cypher.
- El paquete es pequeño (~50 KB) y sin dependencias.

## Opciones

### A. JSON/Markdown/Mermaid

- Contrato estable, cero deps, suficiente para spec y GitHub.

### B. GraphML

- Compatible con Gephi/yEd; serializador XML sencillo, sin dependencias.

### C. Obsidian vault

- Wikilinks y notas; útil para exploración humana, pero genera muchos archivos y requiere
  decisiones de naming/estructura.

### D. SVG estático

- Diagrama exportable, pero Mermaid ya cubre el caso en Markdown; SVG requiere layout propio.

### E. Cypher/Neo4j

- Útil para grafos grandes y consultas; agrega formato y mantenimiento.

### F. `export --format` con adaptadores

- Extensible, pero superficie de CLI y tests por formato.

## Recomendación

**A ahora.** Si aparece demanda concreta, implementar **B (GraphML)** primero por ser barato y
estándar para grafos. Obsidian/Cypher/SVG solo con pedidos claros y como exportadores
opcionales. No agregar un comando `export` genérico hasta tener 2+ formatos implementados.

## Criterios para revisar

- Pedidos de usuarios/herramientas (Gephi, Obsidian, Neo4j).
- Costo de tests y mantenimiento por formato.
- Que el formato no introduzca dependencias ni plantillas AGPL.

## Decisión

Mantener JSON/Markdown/Mermaid. GraphML es el primer follow-up si hay demanda; el resto queda
diferido.
