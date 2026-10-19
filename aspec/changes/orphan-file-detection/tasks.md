# Tasks: Orphan file detection

> Change de implementación. Issue #10.

## Fase 0 — Relevamiento

- [ ] Confirmar `fanIn`, `package.json` y exclusiones existentes en `analyzeRepository`.
- [ ] Revisar el análisis #10 y los ejemplos de Writer/spec.
- [ ] Definir defaults de `orphans` y `lint.orphanFiles`.

## Fase 1 — Implementación

- [ ] Implementar `src/metrics/orphans.js` con detección y exclusiones.
- [ ] Leer `package.json` en `analyzeRepository` y calcular `orphans`.
- [ ] Publicar `facts/dead-code.json` desde `src/facts/dead-code.js`.
- [ ] Agregar sección "Archivos huérfanos" en `GOTCHAS.md`.
- [ ] Agregar regla opt-in `lint.orphanFiles` con salida y exit code.
- [ ] Configurar `orphans.enabled`, `orphans.entrypoints`, `orphans.exclude` y validación.

## Fase 2 — Documentación

- [ ] Actualizar contrato con `facts/dead-code.json`.
- [ ] Actualizar README con la regla y los límites.
- [ ] Documentar que no se detectan símbolos huérfanos.

## Fase 3 — Tests

- [ ] Archivo huérfano real.
- [ ] Entrypoint `bin`/`main`/`exports` excluido.
- [ ] Test, config y script excluidos.
- [ ] Dynamic import no literal baja la confianza.
- [ ] `lint.orphanFiles` desactivado por defecto y activable.
- [ ] `npm test`, `npm run lint`, `npm run build`.
