# Proposal: Human-compatible report command

> Issue: [#51](https://github.com/AncletoCEO/Writer/issues/51)
> Tipo: implementation

## Problem

La salida de Writer está optimizada para `@ancleto/spec` y agentes: JSON determinista y
Markdown exhaustivo. En repos grandes, `agent/ARCHITECTURE.md` puede superar las 15.000 líneas
por el UML completo, y no es una buena experiencia para una persona.

## Proposed change

Agregar un comando de **proyección humana derivada**:

```bash
ancleto-writer human [--root <dir>] [--out <dir>] [--top N]
  [--max-classes N] [--max-nodes N] [--max-communities N] [--json]
```

- Lee el paquete ya construido; no reescanea ni reparsea.
- Genera `outputDir/human/OVERVIEW.md`, `ARCHITECTURE.md` y `data.json`.
- Aplica límites para que el resultado sea legible en repos grandes.
- No cambia el contrato de agentes ni `schemaVersion`.
- No agrega dependencias de runtime.

## Scope

In scope: comando, render compacto, datos curados, tests, documentación y validación con un
repo real.

Out of scope: HTML/3D/SVG interactivo, LLM, nuevo análisis, GraphRAG/MCP y cambios a los
artefactos de agentes.

## Risks

- **Duplicación:** la vista humana debe ser derivada; el paquete de agentes sigue siendo la
  fuente de verdad.
- **Tamaño:** sin límites, el UML y los grafos vuelven a ser enormes.
- **Determinismo:** evitar timestamps y orden inestable.
- **Contrato:** `human/` no debe romper consumidores ni el manifest v1.
