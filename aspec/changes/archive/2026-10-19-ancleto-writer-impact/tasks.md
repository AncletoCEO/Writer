# Tasks: ancleto-writer impact command

> Change de implementación. Issue #8.

## Fase 0 — Relevamiento y diseño

- [x] Confirmar el estado actual y los archivos afectados.
- [x] Revisar la referencia de ReadMenator.
- [x] Actualizar el contrato si se agregan facts, campos o comandos.

## Fase 1 — Implementación

- [x] `ancleto-writer impact <archivo...> [--root] [--json] [--depth N]`.
- [x] Leer `graph.json` y `manifest.json`; validar frescura. Si está stale, exit `3` con recomendación de `build`, o `--build` para reconstruir antes.
- [x] Salida: dependientes directos, transitivos, ciclos afectados, capas y archivos de test.
- [x] Reutilizar el grafo inverso de `blast-radius.js`; agregar límite de profundidad.
- [x] Tests con cadena transitiva y con archivo sin dependientes.

## Fase 2 — Documentación

- [x] Actualizar `agent/*.md` y `docs/contracts/writer-artifacts-v1.md` si aplica.
- [x] Actualizar el README si el comando o el fact es visible para el usuario.

## Fase 3 — Tests y verificación

- [x] `impact src/a.js` lista dependientes directos y transitivos.
- [x] `--json` es parseable y estable.
- [x] Paquete stale devuelve `3` o reconstruye con `--build`.
- [x] Tests de profundidad y de archivo no encontrado.
- [x] Ejecutar `npm test`.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
