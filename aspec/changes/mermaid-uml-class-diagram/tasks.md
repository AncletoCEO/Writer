# Tasks: Mermaid UML class diagram

> Change de implementación. Issue #6.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] Nuevo `src/render/uml.js` que genere Mermaid `classDiagram` desde nodos de símbolo y aristas `inherits`.
- [ ] Incluir nombre, estereotipo (`class`/`interface`), miembros relevantes y relaciones `extends`/`implements`.
- [ ] Partir en varios diagramas si supera un máximo de clases (config `uml.maxClasses`, default 40).
- [ ] Agregar el diagrama a `ARCHITECTURE.md` y, opcionalmente, `agent/UML.md` (actualizar el contrato).
- [ ] Sanitizar identificadores Mermaid y mantener orden determinista.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] `ARCHITECTURE.md` incluye un bloque `classDiagram` cuando hay clases.
- [ ] Clases, interfaces y herencia aparecen correctamente en un fixture.
- [ ] El diagrama se parte si supera el máximo.
- [ ] Tests de render y determinismo.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
