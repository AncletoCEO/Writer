# Tasks: Self-describing output folder README

> Change de implementación. Issue #25.

## Fase 0 — Relevamiento

- [x] Confirmar el mapa de outputs y la frontera de escritura.
- [x] Definir el contenido y los archivos que se listan.

## Fase 1 — Implementación

- [x] Implementar `src/render/output-readme.js`.
- [x] Agregar `README.md` al mapa de outputs en `runBuild`.
- [x] Agregar `outputReadme.enabled` a config y validación.
- [x] Actualizar contrato y README del proyecto.

## Fase 2 — Tests

- [x] README presente en `outputDir`.
- [x] Solo lista archivos existentes.
- [x] README del usuario sin cambios.
- [x] Regeneración actualiza el contenido.
- [x] `npm test`, `npm run lint`, `npm run build`.
