# Tasks: Interactive Cytoscape human view

> Issue [#53](https://github.com/AncletoCEO/Writer/issues/53).

## Fase 1 — Vendor

- [x] Copiar `cytoscape.min.js` y su licencia MIT a `src/human/vendor/`.
- [x] Verificar que el tarball incluye el vendor.

## Fase 2 — Render interactivo

- [x] Crear `src/human/interactive.js`.
- [x] Agregar comunidades y aristas agregadas.
- [x] Implementar el HTML/Cytoscape con search, filtros, layouts y drill-down.
- [x] Escapar datos y evitar recursos externos.
- [x] Integrar `--interactive` en `runHuman` y CLI.

## Fase 3 — Tests

- [x] `--interactive` genera `interactive.html`.
- [x] Contiene Cytoscape, comunidades y drill-down.
- [x] Sin recursos remotos ni rutas absolutas.
- [x] Determinismo.
- [x] Límite de comunidades.
- [x] CLI JSON incluye `interactive.html`.

## Fase 4 — Documentación

- [x] README con `--interactive`, peso y vendor MIT.
- [x] Contrato: `human/interactive.html` derivado.
- [x] Nota de licencia de Cytoscape.

## Fase 5 — Verificación

- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] Build + human --interactive sobre un repo real grande.
- [x] Abrir el HTML offline y verificar legibilidad.
- [x] `ancleto specs check`.
- [x] Archivar y cerrar #53.
