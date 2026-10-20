# Tasks: Surprising connections between communities

> Change de implementación. Issue #5.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] Nuevo `src/metrics/bridges.js`: para cada arista `import` cuyo origen y destino estén en comunidades distintas, calcular un score con:
- [x] Top N configurable (default 20), deduplicado por par `from/to`.
- [x] `facts/bridges.json` con `schemaVersion: 1` y `bridges: [{ from, to, fromCommunity, toCommunity, score, line }]`.
- [x] Sección "Conexiones inesperadas" en `GOTCHAS.md`.
- [x] Tests con dos comunidades y un puente conocido.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] `facts/bridges.json` válido y determinista.
- [x] El puente del fixture aparece primero.
- [x] Sección en `GOTCHAS.md`.
- [x] Sin comunidades, el fact queda vacío y el build no falla.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
