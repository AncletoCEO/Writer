# Tasks: Human-compatible report command

> Issue [#51](https://github.com/AncletoCEO/Writer/issues/51).

## Fase 1 — Proyección

- [x] Crear `src/human/report.js`.
- [x] Leer `manifest.json`, `graph.json` y `facts/*` con fallbacks.
- [x] Calcular totales, lenguajes, top lists y límites.
- [x] Generar `OVERVIEW.md`, `ARCHITECTURE.md` y `data.json`.
- [x] Publicación atómica de `human/`.

## Fase 2 — CLI

- [x] Agregar la lógica del comando `human` en `src/cli/index.js`.
- [x] Flags `--root`, `--out`, `--top`, `--max-classes`, `--max-nodes`, `--max-communities`, `--json`.
- [x] Registrar `human` en `src/cli/index.js` y en usage.
- [x] Validar enteros positivos y errores claros.

## Fase 3 — Tests

- [x] Fixture mixto: artefactos esperados y secciones.
- [x] Determinismo byte a byte.
- [x] Límites de listas/UML/imports.
- [x] Paquete ausente.
- [x] Frontera: solo escribe dentro de `outputDir/human`.

## Fase 4 — Documentación

- [x] README: comando y salida humana.
- [x] Contrato: `human/` derivado, fuera del manifest v1.
- [x] Documentar límites y relación con `agent/ARCHITECTURE.md`.

## Fase 5 — Verificación

- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] Build + human sobre un repo real grande.
- [x] Verificar tamaño/líneas y que no haya rutas absolutas.
- [x] `ancleto specs check`.
- [x] Archivar el change.
