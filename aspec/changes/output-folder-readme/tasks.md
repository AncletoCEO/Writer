# Tasks: Self-describing output folder README

> Change de implementación. Issue #25.

## Fase 0 — Relevamiento

- [ ] Confirmar el mapa de outputs y la frontera de escritura.
- [ ] Definir el contenido y los archivos que se listan.

## Fase 1 — Implementación

- [ ] Implementar `src/render/output-readme.js`.
- [ ] Agregar `README.md` al mapa de outputs en `runBuild`.
- [ ] Agregar `outputReadme.enabled` a config y validación.
- [ ] Actualizar contrato y README del proyecto.

## Fase 2 — Tests

- [ ] README presente en `outputDir`.
- [ ] Solo lista archivos existentes.
- [ ] README del usuario sin cambios.
- [ ] Regeneración actualiza el contenido.
- [ ] `npm test`, `npm run lint`, `npm run build`.
