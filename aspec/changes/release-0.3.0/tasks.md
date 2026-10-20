# Tasks: Release 0.3.0

> Change de release. Issue [#48](https://github.com/AncletoCEO/Writer/issues/48).

## Fase 0 — Preparación

- [x] Confirmar P1+P2 completos y 193 tests verdes.
- [x] Verificar instalación del pack publicado en un consumidor limpio.
- [x] Confirmar que core solo deja `.py` unsupported y core+pack lo analiza.

## Fase 1 — Versiones y paquetes

- [x] Subir `@ancleto/writer` a `0.3.0`.
- [x] Confirmar `@ancleto/writer-languages@0.1.0`.
- [x] Agregar README, LICENSE y NOTICE al pack.
- [x] Verificar que el core siga sin `dependencies`.

## Fase 2 — Workflow

- [x] Agregar publicación del pack con OIDC/provenance.
- [x] Exportar `PACK_VERSION` para el canary.
- [x] Agregar canary del tarball del pack.
- [x] Documentar el Trusted Publisher vía `npm trust github` y la primera publicación manual del pack.

## Fase 3 — Documentación

- [x] Actualizar README (estado, versión, P1+P2, ejemplos).
- [x] Actualizar `docs/releasing.md` con versiones, workflow, smoke y rollback.
- [x] Documentar la nota de peers de Swift/Kotlin.

## Fase 4 — Verificación

- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.
- [x] Smoke de consumidor con core `0.3.0` y pack `0.1.0`.
- [x] `npm ci --dry-run`.
- [x] `ancleto specs check`.
- [x] `npm publish --dry-run --access public`.
- [x] Verificar `ancleto-writer --version` = `0.3.0`.

## Fase 5 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] Actualizar issue #48 y memoria.
- [ ] Archivar el change de release.
- [ ] Acción externa: tag `v0.3.0`, push y publicación npm/GitHub.
- [ ] Verificar fichas npm y `npx @ancleto/writer@0.3.0 --version`.
