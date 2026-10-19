# Tasks: Mermaid UML class diagram

> Change de implementación. Issue #6.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] Nuevo `src/render/uml.js` que genere Mermaid `classDiagram` desde nodos de símbolo y aristas `inherits`.
- [x] Incluir nombre, estereotipo (`class`/`interface`), miembros relevantes y relaciones `extends`/`implements`.
- [x] Partir en varios diagramas si supera un máximo de clases (config `uml.maxClasses`, default 40).
- [x] Agregar el diagrama a `ARCHITECTURE.md` y, opcionalmente, `agent/UML.md` (actualizar el contrato).
- [x] Sanitizar identificadores Mermaid y mantener orden determinista.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] `ARCHITECTURE.md` incluye un bloque `classDiagram` cuando hay clases.
- [x] Clases, interfaces y herencia aparecen correctamente en un fixture.
- [x] El diagrama se parte si supera el máximo.
- [x] Tests de render y determinismo.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
