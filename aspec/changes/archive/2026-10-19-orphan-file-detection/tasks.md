# Tasks: Orphan file detection

> Change de implementación. Issue #10.

## Fase 0 — Relevamiento

- [x] Confirmar `fanIn`, `package.json` y exclusiones existentes en `analyzeRepository`.
- [x] Revisar el análisis #10 y los ejemplos de Writer/spec.
- [x] Definir defaults de `orphans` y `lint.orphanFiles`.

## Fase 1 — Implementación

- [x] Implementar `src/metrics/orphans.js` con detección y exclusiones.
- [x] Leer `package.json` en `analyzeRepository` y calcular `orphans`.
- [x] Publicar `facts/dead-code.json` desde `src/facts/dead-code.js`.
- [x] Agregar sección "Archivos huérfanos" en `GOTCHAS.md`.
- [x] Agregar regla opt-in `lint.orphanFiles` con salida y exit code.
- [x] Configurar `orphans.enabled`, `orphans.entrypoints`, `orphans.exclude` y validación.

## Fase 2 — Documentación

- [x] Actualizar contrato con `facts/dead-code.json`.
- [x] Actualizar README con la regla y los límites.
- [x] Documentar que no se detectan símbolos huérfanos.

## Fase 3 — Tests

- [x] Archivo huérfano real.
- [x] Entrypoint `bin`/`main`/`exports` excluido.
- [x] Test, config y script excluidos.
- [x] Dynamic import no literal baja la confianza.
- [x] `lint.orphanFiles` desactivado por defecto y activable.
- [x] `npm test`, `npm run lint`, `npm run build`.
