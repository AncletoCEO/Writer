# Tasks: Release 0.3.1

> Patch de documentación. Issue [#48](https://github.com/AncletoCEO/Writer/issues/48).

## Fase 1 — Documentación

- [x] Completar README con language pack, tabla de lenguajes, límites, configuración y FAQ.
- [x] Actualizar árbol de artefactos y contrato (`lang`, `schemaVersion`).
- [x] Actualizar `docs/releasing.md` a `0.3.1` y `npm trust`.
- [x] Bump del core a `0.3.1`; pack en `0.1.0`.

## Fase 2 — Verificación

- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` y `npm publish --dry-run`.
- [x] Smoke core `0.3.1` + pack `0.1.0`.
- [x] `ancleto specs check`.

## Fase 3 — Publicación

- [x] Commit de docs/release.
- [x] Tag `v0.3.1` y push.
- [x] Workflow publica core `0.3.1` y omite pack `0.1.0`.
- [x] Verificar `npm view` y README en npm.
- [x] Archivar `release-0.3.0`, `release-0.3.1` y cerrar #48.
