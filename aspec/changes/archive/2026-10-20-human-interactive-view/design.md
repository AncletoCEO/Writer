# Design: Interactive Cytoscape human view

## Archivos

```text
src/human/interactive.js             # datos + HTML Cytoscape
src/human/vendor/cytoscape.min.js    # vendor MIT
src/human/vendor/CYTOSCAPE-LICENSE   # licencia
src/human/report.js                  # --interactive
src/cli/index.js                     # flag
test/human.test.js                   # tests
```

## Modelo

- Comunidades top por tamaño (`maxCommunities`, default interactivo 20).
- Nodos: `id`, `size`, `cohesion`, `lang`, `files`.
- Lenguaje dominante: el más frecuente entre los archivos de la comunidad.
- Aristas: imports agregados entre comunidades, con peso.
- Sin nodos archivo→archivo.

## UI

- Sidebar con stats, búsqueda, filtro por lenguaje, layout, fit/reset y leyenda.
- Cytoscape con `cose` por defecto; layouts alternativos.
- Click en comunidad: resalta vecinos y muestra archivos principales.
- Tooltip con comunidad, tamaño, cohesión y lenguaje.
- Link de vuelta a `index.html`.

## Seguridad

- Escaping de IDs, paths, labels y textos antes de insertarlos en el DOM.
- Datos embebidos como JSON con `<` escapado a `\u003c` para evitar cerrar el `<script>`.
- Sin recursos externos, CDN ni `src`/`href` remotos.

## Vendor

- `cytoscape@3.34.4` MIT.
- Se copia `cytoscape.min.js` y su licencia a `src/human/vendor/`.
- Se inlinea en `interactive.html`; el vendor queda en el tarball del core.
- No se agrega `cytoscape` a `dependencies`; el core sigue sin runtime deps.

## Límites

- `--interactive` no cambia el HTML estático.
- `maxCommunities` explícito se respeta; si no se pasa y hay `--interactive`, default 20.
- `maxNodes`/`maxClasses` no se usan en esta vista de comunidades, pero se mantienen para las
  otras salidas.

## Validación

- `interactive.html` existe con `--interactive`.
- `<!doctype html>`, `<script>`, `cytoscape(`, sin recursos remotos.
- Nodos comunidades <= límite.
- Drill-down con archivos.
- Determinismo byte a byte.
- Repo real grande: vista legible.
