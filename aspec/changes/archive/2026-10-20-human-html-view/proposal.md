# Proposal: Self-contained HTML human view

> Issue: [#52](https://github.com/AncletoCEO/Writer/issues/52)
> Base: change archivado `human-report-command`
> Tipo: implementation

## Problem

`ancleto-writer human` genera Markdown con Mermaid, pero para ver los diagramas hace falta un
visor de Markdown. No existe un HTML autocontenido que una persona pueda abrir directamente sin
red, CDN ni dependencias.

## Proposed change

- `human` genera además `outputDir/human/index.html`.
- HTML autocontenido: CSS inline, sin JavaScript externo, sin CDN y sin red.
- SVG inline para capas, comunidades, UML acotado, imports y el ciclo principal cuando entra en
  el límite.
- Tablas para god nodes, hotspots, comunidades, huérfanos, unresolved, unsupported y cobertura
  de documentación.
- Respeta los límites existentes: `top`, `maxClasses`, `maxNodes`, `maxCommunities`.
- Escapa todo texto del repo y no publica rutas absolutas.
- Sigue fuera del manifest v1 y del fingerprint.

## Scope

In scope: render HTML, SVG inline, tests, README y contrato.

Out of scope: frameworks, JS interactivo, filtros dinámicos, 3D, CDN, Mermaid vendorizado,
GraphRAG/MCP y cambios al contrato de agentes.

## Risks

- **XSS:** cualquier nombre/path del repo debe escaparse antes de entrar al HTML/SVG.
- **Tamaño:** los SVG y tablas deben respetar los límites; nada de renderizar todos los nodos.
- **Determinismo:** sin timestamps, orden estable y sin rutas absolutas.
- **Compatibilidad:** el HTML es adicional; `human/` sigue fuera del manifest.
