# Proposal: Interactive Cytoscape human view

> Issue: [#53](https://github.com/AncletoCEO/Writer/issues/53)
> Base: change archivado `human-html-view`
> Tipo: implementation

## Problem

El HTML estático es liviano pero no permite explorar. La prueba con Cytoscape mostró que el
grafo archivo→archivo es ilegible en repos grandes, mientras que el grafo de comunidades es
claro y accionable.

## Proposed change

- `ancleto-writer human --interactive` genera además `human/interactive.html`.
- Cytoscape.js vendorizado (MIT), inline, sin CDN ni red.
- Vista de comunidades:
  - top por tamaño;
  - color por lenguaje dominante;
  - tamaño por archivos;
  - search, filtro por lenguaje, layouts, zoom/pan;
  - tooltip y drill-down a archivos de la comunidad.
- `index.html` estático sigue como fallback.
- `interactive.html` queda fuera del manifest v1.
- Default interactivo: 20 comunidades; `--max-communities` lo ajusta.

## Scope

In scope: vista interactiva, vendor de Cytoscape, tests, README y contrato.

Out of scope: grafo global archivo→archivo, frameworks, red, 3D, GraphRAG/MCP y cambios de
contrato.

## Risks

- **Peso:** Cytoscape minificado suma ~426 KB al HTML interactivo.
- **Seguridad:** todo path/ID debe escaparse antes de entrar al DOM.
- **Legibilidad:** el grafo debe ser de comunidades, no de archivos.
- **Licencia:** Cytoscape es MIT; incluir su licencia junto al vendor.
