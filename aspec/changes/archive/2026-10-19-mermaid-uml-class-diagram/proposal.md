# Proposal: Mermaid UML class diagram

> Issue: [#6 — Mermaid UML class diagram](https://github.com/AncletoCEO/Writer/issues/6)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera diagramas de clases Mermaid desde clases, métodos y herencia. Writer ya extrae clases, métodos, interfaces y aristas `inherits`; falta el render UML. Es una de las features con mejor relación valor/esfuerzo.

- `src/parsers/javascript.js` extrae clases, métodos, interfaces y herencia.
- `src/graph/build.js` crea nodos de símbolo y aristas `inherits`.
- `src/render/mermaid.js` solo renderiza imports, ciclos y capas.
- No hay `classDiagram` ni `agent/UML.md`.

## Proposed change

- Nuevo `src/render/uml.js` que genere Mermaid `classDiagram` desde nodos de símbolo y aristas `inherits`.
- Incluir nombre, estereotipo (`class`/`interface`), miembros relevantes y relaciones `extends`/`implements`.
- Partir en varios diagramas si supera un máximo de clases (config `uml.maxClasses`, default 40).
- Agregar el diagrama a `ARCHITECTURE.md` y, opcionalmente, `agent/UML.md` (actualizar el contrato).
- Sanitizar identificadores Mermaid y mantener orden determinista.

## Scope

Incluye: UML Mermaid de clases/interfaces y relaciones.
No incluye: generación de stubs en otros lenguajes (ver issue de analysis).

## Risks

- Dependencia: ninguna.
- Riesgo: tipos TS complejos (genéricos, uniones) pueden requerir sanitización; documentar límites.
