# Analysis: Visual maps, 3D, flows and component diagrams

> Issue: [#20](https://github.com/AncletoCEO/Writer/issues/20)
> Change: `visual-maps-3d`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe generar mapas interactivos, 3D, flows o diagramas de componentes, o quedarse en
Mermaid?

## Evidencia

- `src/render/mermaid.js` genera imports, ciclos, capas, comunidades y UML.
- `src/render/markdown.js` embebe los diagramas en `ARCHITECTURE.md`.
- No hay HTML/CSS/JS ni 3D.
- Copiar plantillas vis.js/HTML de ReadMenator traería obligaciones AGPL sobre los archivos
  generados en el repo del usuario.

## Opciones

### A. Mermaid

- Sin dependencias, renderiza en GitHub/Markdown, mantenimiento bajo.
- Limitado para grafos grandes y sin interacción.

### B. SVG estático propio

- Exportable y sin JS; requiere layout propio y más tests.
- Útil para reportes, pero Mermaid ya cubre la mayoría.

### C. HTML interactivo propio

- Mejor exploración, pero mucho mantenimiento, accesibilidad, tamaño y riesgo de plantillas
  AGPL si se copia el upstream.

### D. Integrar ReadMenator externo

- Si el usuario necesita 2D/3D/edge bundling, puede ejecutar ReadMenator aparte.

## Recomendación

**A.** Writer se queda en Mermaid. No implementar HTML/3D/flows/componentes en el core. Si
aparece demanda de exploración visual, recomendar ReadMenator como herramienta externa o un
exportador SVG estático como follow-up, sin copiar plantillas.

## Criterios para revisar

- Pedidos de exploración visual que Mermaid no cubra.
- Un exportador SVG propio, pequeño y testeable.
- Que no se introduzcan plantillas AGPL en los outputs del usuario.

## Decisión

Mermaid only. HTML/3D/flows/componentes quedan fuera del core.
