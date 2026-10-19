# Tasks: Surprising connections between communities

> Change de implementación. Issue #5.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] Nuevo `src/metrics/bridges.js`: para cada arista `import` cuyo origen y destino estén en comunidades distintas, calcular un score con:
- [ ] Top N configurable (default 20), deduplicado por par `from/to`.
- [ ] `facts/bridges.json` con `schemaVersion: 1` y `bridges: [{ from, to, fromCommunity, toCommunity, score, line }]`.
- [ ] Sección "Conexiones inesperadas" en `GOTCHAS.md`.
- [ ] Tests con dos comunidades y un puente conocido.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] `facts/bridges.json` válido y determinista.
- [ ] El puente del fixture aparece primero.
- [ ] Sección en `GOTCHAS.md`.
- [ ] Sin comunidades, el fact queda vacío y el build no falla.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
