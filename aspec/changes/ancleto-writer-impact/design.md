# Design: ancleto-writer impact command

## Approach

- `ancleto-writer impact <archivo...> [--root] [--json] [--depth N]`.
- Leer `graph.json` y `manifest.json`; validar frescura. Si está stale, exit `3` con recomendación de `build`, o `--build` para reconstruir antes.
- Salida: dependientes directos, transitivos, ciclos afectados, capas y archivos de test.
- Reutilizar el grafo inverso de `blast-radius.js`; agregar límite de profundidad.
- Tests con cadena transitiva y con archivo sin dependientes.

## Architecture

Áreas afectadas: src/cli/index.js, src/metrics/blast-radius.js, src/contract/check.js, tests de CLI.

## Validation

- [ ] `impact src/a.js` lista dependientes directos y transitivos.
- [ ] `--json` es parseable y estable.
- [ ] Paquete stale devuelve `3` o reconstruye con `--build`.
- [ ] Tests de profundidad y de archivo no encontrado.
