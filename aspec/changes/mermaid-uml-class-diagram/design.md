# Design: Mermaid UML class diagram

## Approach

- Nuevo `src/render/uml.js` que genere Mermaid `classDiagram` desde nodos de símbolo y aristas `inherits`.
- Incluir nombre, estereotipo (`class`/`interface`), miembros relevantes y relaciones `extends`/`implements`.
- Partir en varios diagramas si supera un máximo de clases (config `uml.maxClasses`, default 40).
- Agregar el diagrama a `ARCHITECTURE.md` y, opcionalmente, `agent/UML.md` (actualizar el contrato).
- Sanitizar identificadores Mermaid y mantener orden determinista.

## Architecture

Áreas afectadas: src/render/uml.js, src/render/markdown.js, src/graph/build.js, tests de render.

## Validation

- [ ] `ARCHITECTURE.md` incluye un bloque `classDiagram` cuando hay clases.
- [ ] Clases, interfaces y herencia aparecen correctamente en un fixture.
- [ ] El diagrama se parte si supera el máximo.
- [ ] Tests de render y determinismo.
