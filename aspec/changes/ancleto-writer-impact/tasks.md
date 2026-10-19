# Tasks: ancleto-writer impact command

> Change de implementación. Issue #8.

## Fase 0 — Relevamiento y diseño

- [ ] Confirmar el estado actual y los archivos afectados.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [ ] `ancleto-writer impact <archivo...> [--root] [--json] [--depth N]`.
- [ ] Leer `graph.json` y `manifest.json`; validar frescura. Si está stale, exit `3` con recomendación de `build`, o `--build` para reconstruir antes.
- [ ] Salida: dependientes directos, transitivos, ciclos afectados, capas y archivos de test.
- [ ] Reutilizar el grafo inverso de `blast-radius.js`; agregar límite de profundidad.
- [ ] Tests con cadena transitiva y con archivo sin dependientes.

## Fase 2 — Documentación

- [ ] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [ ] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [ ] `impact src/a.js` lista dependientes directos y transitivos.
- [ ] `--json` es parseable y estable.
- [ ] Paquete stale devuelve `3` o reconstruye con `--build`.
- [ ] Tests de profundidad y de archivo no encontrado.
- [ ] Ejecutar `npm test`.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
